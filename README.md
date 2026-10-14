# StreamFlix

Catálogo de filmes e séries **disponíveis agora** nos serviços de streaming.
Filtre por Netflix, Prime Video, Max, Disney+ e mais — só o que está incluído na
assinatura ou é gratuito. Sem aluguel, sem surpresa na hora de dar play.

**Regiões:** Brasil 🇧🇷 e Portugal 🇵🇹 — troque no seletor do header. A escolha
muda o catálogo e os serviços disponíveis; a interface continua em português.

---

## 🚀 Começando

### 1. Obter a chave da API do TMDB (2 minutos)

1. Crie uma conta em **https://www.themoviedb.org/signup** e confirme o e-mail.
2. Acesse **https://www.themoviedb.org/settings/api**
3. Clique em **Create** → escolha **Developer** → aceite os termos.
4. Preencha o formulário. Em "Application Summary" pode escrever algo como
   _"Catálogo pessoal de filmes disponíveis em streaming no Brasil"_.
   Em "Type of Use" escolha **Educational** ou **Personal**.
5. Após aprovar (é instantâneo), copie o campo
   **API Read Access Token (v4 auth)** — um texto longo começando com `eyJ...`.

> ⚠️ **Atenção:** use o **Read Access Token (v4)**, não a "API Key (v3)".
> São campos diferentes na mesma página. O token v4 é o que começa com `eyJ`.
>
> Alternativa: se você só tem a chave v3 (32 caracteres hexadecimais), pode
> usá-la em `TMDB_API_KEY` — o cliente aceita as duas formas. A v4 é preferível
> porque o segredo viaja no header, não na URL (não vaza em logs nem histórico).

### 2. Configurar o projeto

```bash
# Na raiz do projeto:
cp .env.local.example .env.local
```

Abra `.env.local` e cole o token:

```env
TMDB_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...seu_token_aqui
NEXT_PUBLIC_TMDB_REGION=BR
NEXT_PUBLIC_TMDB_LANGUAGE=pt-BR
```

> O token **não** tem prefixo `NEXT_PUBLIC_`, então nunca é enviado ao navegador.
> O módulo `src/lib/tmdb/client.ts` importa `server-only`, o que faz o build
> **falhar** se algum Client Component tentar usá-lo. É uma garantia em tempo
> de compilação, não uma convenção.

### 3. Rodar

```bash
npm install
npm run dev
```

Abra **http://localhost:3000**.

### 4. Configurar o Supabase

As **listas pessoais exigem conta** — sem Supabase configurado, o catálogo
funciona normalmente mas as áreas de lista mostram um aviso explicando como
configurar. Para ativar login e sincronização:

1. Crie um projeto em **https://supabase.com/dashboard** (o plano gratuito basta).
2. No **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   e execute. É idempotente — pode rodar quantas vezes quiser.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**
   e preencha no `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
   ```

4. Reinicie o `npm run dev`.

> ⚠️ A `anon key` é um JWT longo (200+ caracteres, começa com `eyJ`). Se ela
> estiver curta como um placeholder, o login e a sincronização **não funcionam**.

O login é por **e-mail e senha**, com cadastro e recuperação de senha.

> ✅ **Confirmação de e-mail desativada (recomendado nesta fase):** em
> **Authentication → Sign In / Providers → Email**, desligue *Confirm email*.
> Assim o cadastro entra direto. Se preferir manter ligada, o app já trata o
> fluxo de confirmação por link.

> 🔒 A `anon key` é **pública por design** — ela vai no bundle do browser e não
> é um segredo. A proteção real vem das políticas de **Row Level Security** no
> Postgres (ver `supabase/schema.sql`), que garantem que cada usuário só lê e
> escreve as próprias linhas, mesmo que alguém manipule o cliente.

> 📧 Para recuperação de senha funcionar em produção, configure um provedor de
> e-mail (SMTP) em **Authentication → Emails**. O provedor padrão do Supabase é
> limitado e serve apenas para testes.

---

## 🏗️ Arquitetura

### Fluxo de dados

```
URL (searchParams)  →  Server Component  →  lib/tmdb  →  API do TMDB
       ↑                                          ↓
   FilterBar (client)  ←──────  MediaItem normalizado  ──────→  UI
```

**A URL é a fonte única da verdade dos filtros.** Isso dá de graça:
estado compartilhável, botão voltar funcional, SSR sem hidratação de estado
e zero chance de UI dessincronizada.

### Camadas

| Pasta | Responsabilidade |
|---|---|
| `src/lib/tmdb/` | Cliente HTTP, endpoints, normalização, URLs de imagem, curadoria de providers |
| `src/lib/` (region*) | Região ativa em cookie (BR/PT) — isomórfico + leitura no servidor |
| `src/lib/library/` | Listas do usuário (quero assistir / já assisti) — exigem conta |
| `src/lib/supabase/` | Clientes browser/SSR e renovação de sessão |
| `src/components/ui/` | Primitivos do design system |
| `src/components/media/` | Card, grid, trilha, hero, providers, trailer, abas, botões de status |
| `src/components/filters/` | Barra de filtros, chips, paginação |
| `src/components/auth/` | Formulários de entrar, criar conta, recuperar e redefinir senha |
| `src/app/` | Rotas (App Router) |

### Decisões que importam

**Normalização na fronteira.** O TMDB devolve shapes diferentes para filme
(`title`, `release_date`) e série (`name`, `first_air_date`). Tudo passa por
`normalize.ts` e sai como `MediaItem`. Resultado: a UI não tem um único
`if (type === 'movie')`.

**Uma requisição em vez de cinco.** A página de detalhes usa
`append_to_response=credits,videos,watch/providers,recommendations`, colapsando
5 chamadas em 1. Economia de ~1.2s de latência em cascata.

**Cache por volatilidade.** Gêneros e providers: 24h. Detalhes: 12h.
Listas: 1h. Busca: 5min. Cachear tudo igual seria desperdício ou risco de
estourar o rate limit.

**Streaming com Suspense.** Cada trilha da home é um Server Component
assíncrono no seu próprio `<Suspense>`. A página pinta assim que o hero
resolve, em vez de esperar a requisição mais lenta.

**Dois status, um contrato.** Cada título tem um status: **quero assistir**
(`want`) ou **já assisti** (`watched`), mutuamente exclusivos. `LibraryBackend`
é o contrato e `SupabaseBackend` a implementação (tabela `favorites` com RLS).
Nenhum componente de UI conhece o SDK do Supabase — só o contexto.

**A lista exige conta.** Marcar ou tirar um título da lista sem sessão leva o
usuário para o login, com `?next=` de volta ao ponto de partida. Em troca de
abrir mão do "funciona sem login", ganhamos uma garantia simples: o que está na
tela é exatamente o que está na conta. Antes havia um `LocalBackend` em
`localStorage`; foi removido para não manter dois caminhos de código nem deixar
o usuário com a impressão de ter listas salvas na conta quando elas viviam só
naquele navegador. Por consistência com essa regra, `provider.tsx` e
`library-view.tsx` só dependem de `backend` — sem ramos de "modo local".

**Abas na URL, região no cookie.** As abas da home (`?aba=inicio|quero|assistidos`)
são lidas por um componente client, não por `searchParams` no servidor — assim o
HTML pré-renderizado é preservado. Já a **região** vive em **cookie**, não na URL:
assim o servidor já renderiza na região certa (sem flash de país errado) e um link
compartilhado não carrega o país de quem enviou, e sim o de quem abre.

**Serviços de streaming vindos do TMDB.** A lista de serviços em destaque não é
fixa no código: vem de `/watch/providers/{movie,tv}` e é filtrada por região
(`featuredProviders`). Motivo: a resposta muda por país (Globoplay só existe no
BR; RTP Play só em PT) e no tempo — a lista fixa anterior tinha **IDs errados**
(554 era BroadwayHD, não Telecine; 2242 e 619 nem existem). Curadoria = filtro,
não digitação de nomes.

**Listas otimistas.** Clicar em "quero assistir" ou "já assisti" muda a UI no
mesmo frame e só depois persiste. Se a escrita falhar, o estado é revertido e
um aviso aparece — a UI nunca fica "mentindo" sobre o que foi salvo de fato.

---

## 🎨 Design — Editorial Noir

| Token | Valor | Uso |
|---|---|---|
| `--color-ink` | `#0b0b0c` | Fundo raiz (quase-preto quente) |
| `--color-ink-raised` | `#141416` | Cards e superfícies |
| `--color-paper` | `#f4f1ec` | Texto principal (14.8:1 ✅ AAA) |
| `--color-paper-dim` | `#a8a39b` | Texto secundário (7.1:1 ✅ AAA) |
| `--color-paper-mute` | `#8e8a84` | Metadados (4.9:1 ✅ AA) |
| `--color-terra` | `#d9603b` | Acento único (terracota queimada) |

**Tipografia:** `Instrument Serif` para display (até `clamp(2.75rem, 8.5vw, 6.5rem)`),
`Geist` para corpo, `Geist Mono` para todos os metadados. Três vozes
tipográficas distintas criam a sensação editorial.

**Layout:** grid de 12 colunas usado de forma assimétrica — o conteúdo ocupa
as colunas 1–7 e a barra lateral começa na 9, deixando um vazio deliberado
no meio. Pôsteres com `border-radius: 2px` (quase reto, intencional).

**Micro-interações:** zoom de 1.04 no pôster (não no card — evita reflow),
sublinhado que cresce da esquerda, logos de provider em grayscale que ganham
cor no hover. Tudo com `cubic-bezier(0.22, 1, 0.36, 1)`.

---

## ♿ Acessibilidade (WCAG 2.2 AA)

- **Contraste:** todos os pares texto/fundo validados (mínimo 4.9:1)
- **Cor nunca é o único indicador:** notas têm rótulo textual no `aria-label`;
  chips ativos mudam cor **e** peso de fonte
- **Modal de trailer:** Radix Dialog — focus trap, `Esc`, retorno de foco,
  `aria-modal`, bloqueio de scroll
- **Trilhas com scroll:** `tabIndex={0}` + `role="group"` (WCAG 2.1.1)
- **`aria-live="polite"`** anuncia a contagem de resultados ao filtrar
- **Skip link** para pular a navegação repetida
- **`prefers-reduced-motion`** desliga todas as animações
- **`alt` descritivo:** "Pôster de Duna: Parte Dois", não "poster"
- **Botão de favorito** usa `aria-pressed` (padrão correto para toggle)

---

## 📁 Estrutura

```
src/
├── app/
│   │   ├── layout.tsx          # shell, fontes, skip-link, LibraryProvider
│   │   ├── page.tsx            # home: hero + abas (catálogo | quero | assisti)
│   │   ├── descobrir/page.tsx  # grid + filtros
│   │   ├── busca/page.tsx      # busca textual
│   │   ├── minha-lista/page.tsx# listas do usuário (abas quero/assisti)
│   │   ├── favoritos/page.tsx  # rota legada → redireciona p/ /minha-lista
│   │   ├── entrar/page.tsx     # login (e-mail + senha)
│   │   ├── criar-conta/page.tsx
│   │   ├── recuperar-senha/page.tsx
│   │   ├── redefinir-senha/page.tsx
│   │   ├── auth/actions.ts     # Server Actions (signIn, signUp, reset…)
│   │   ├── auth/callback/      # troca do code por sessão (route handler)
│   │   ├── [type]/[id]/page.tsx# detalhes (movie | tv)
│   │   ├── error.tsx · loading.tsx · not-found.tsx
│   │   └── globals.css         # tokens do design system
│   └── proxy.ts                # renovação de sessão na borda (ex-middleware)
├── lib/
│   ├── tmdb/
│   │   ├── client.ts           # server-only, cache, erros tipados
│   │   ├── endpoints.ts        # discover, search, details, genres (por região)
│   │   ├── normalize.ts        # movie|tv → MediaItem
│   │   ├── images.ts           # URLs por tamanho
│   │   ├── providers.ts        # curadoria de serviços por região (do TMDB)
│   │   └── types.ts
│   ├── region.ts               # regiões suportadas (isomórfico)
│   ├── region-server.ts        # getRegion() — lê o cookie no servidor
│   ├── use-region.ts           # hook do seletor (grava o cookie)
│   ├── library/
│   │   ├── types.ts            # contrato LibraryBackend + status + helpers
│   │   ├── supabase-backend.ts # SupabaseBackend (tabela favorites + status)
│   │   └── provider.tsx        # LibraryProvider: sessão, exigência de login, otimismo
│   ├── supabase/
│   │   ├── client.ts           # cliente browser (singleton)
│   │   ├── server.ts           # cliente SSR + getServerUser()
│   │   └── middleware.ts       # renovação de sessão (usado pelo proxy)
│   ├── filters.ts              # parse/serialize de searchParams
│   └── utils.ts
└── components/
    ├── ui/                     # Button, SectionHeading, Skeleton, EmptyState
    ├── media/                  # MediaCard, MediaGrid, MediaRail, Hero,
    │                           # LibraryTabs, LibraryButtons, LibraryView…
    ├── filters/                # FilterBar, Chip, Pagination
    ├── auth/                   # FormField, SignInForm, SignUpForm, …
    └── layout/                 # Header, Footer, SearchInput, AccountMenu
```

---

## 🔮 Próximos passos

- [x] **Listas pessoais** — quero assistir / já assisti, com abas na home
- [x] **Contas** — login por e-mail e senha, com cadastro e recuperação
- [ ] **PWA** — manifest + service worker para uso offline
- [ ] **Alertas** — avisar quando um título da lista entrar em um serviço
- [x] **Multi-região** — seletor de país no header (Brasil e Portugal)
- [ ] **Testes** — Vitest para `normalize.ts`, `filters.ts` e `library/types.ts`
      (lógica pura, alto valor de cobertura)

---

## 📜 Atribuição

Este produto usa a API do **TMDB**, mas não é endossado nem certificado pelo TMDB.

Dados e imagens: [themoviedb.org](https://www.themoviedb.org/)

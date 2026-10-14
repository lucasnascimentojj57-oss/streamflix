-- ═══════════════════════════════════════════════════════════════════════
-- StreamFlix — Schema da biblioteca pessoal
-- ═══════════════════════════════════════════════════════════════════════
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- É idempotente: pode rodar mais de uma vez sem erro.
--
-- Modelo de dados: uma linha por (usuário, título). Cada linha carrega um
-- status: 'want' (quero assistir) ou 'watched' (já assisti). São mutuamente
-- exclusivos por construção — é uma única coluna, não há como o mesmo título
-- ter dois status.
--
-- Guardamos os campos desnormalizados do MediaItem porque a página de listas
-- precisa renderizar os cards sem N requisições ao TMDB — e porque um título
-- pode sair do catálogo do TMDB, mas o usuário não deve perder o que salvou.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.favorites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,

  -- Identidade do título no TMDB
  tmdb_id       integer not null,
  media_type    text    not null check (media_type in ('movie', 'tv')),

  -- Campos desnormalizados do MediaItem (snapshot no momento de salvar)
  title         text    not null,
  original_title text   not null default '',
  overview      text    not null default '',
  poster_path   text,
  backdrop_path text,
  release_date  date,
  rating        numeric(3,1) not null default 0,
  vote_count    integer not null default 0,
  genre_ids     integer[] not null default '{}',

  created_at    timestamptz not null default now(),

  -- Um título só pode aparecer uma vez por usuário.
  -- É esta constraint que torna o upsert idempotente.
  constraint favorites_user_media_unique unique (user_id, tmdb_id, media_type)
);

-- ═══════════════════════════════════════════════════════════════════════
-- Status (migração de esquemas anteriores)
-- ═══════════════════════════════════════════════════════════════════════
-- Projetos criados antes das abas usavam a tabela apenas como "favoritos".
-- `add column if not exists` promove esses dados para 'want' sem perder nada.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.favorites
  add column if not exists status text not null default 'want';

-- `updated_at` permite ordenar a lista pela última interação (mover um título
-- de "quero" para "assisti" deve trazê-lo ao topo da lista "assisti").
alter table public.favorites
  add column if not exists updated_at timestamptz not null default now();

-- Garante que só existem os dois status previstos — mesmo que alguém
-- escreva direto na tabela.
alter table public.favorites
  drop constraint if exists favorites_status_check;

alter table public.favorites
  add constraint favorites_status_check
  check (status in ('want', 'watched'));

-- Índice para a consulta principal: "minha lista de um status, mais recentes
-- primeiro". O índice antigo (user_id, created_at) não cobre o `where
-- status = …` e faria o Postgres ler linhas descartadas.
create index if not exists favorites_user_status_updated_idx
  on public.favorites (user_id, status, updated_at desc);

drop index if exists favorites_user_created_idx;

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════
-- Sem RLS, a anon key (que é pública e vai no bundle do browser) daria
-- acesso de leitura e escrita à tabela inteira de TODOS os usuários.
-- Com RLS, o Postgres filtra por linha usando o JWT da requisição.
--
-- A anon key ser pública é por design — a segurança vem daqui.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.favorites enable row level security;

-- Política única cobrindo todos os comandos.
-- `auth.uid()` é extraído do JWT pelo Supabase; nunca confiamos em um
-- user_id vindo do cliente.
drop policy if exists "Usuário gerencia apenas os próprios favoritos"
  on public.favorites;

create policy "Usuário gerencia apenas os próprios favoritos"
  on public.favorites
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Verificação
-- ═══════════════════════════════════════════════════════════════════════
-- Depois de executar, confirme que RLS está ativo:
--   select relname, relrowsecurity from pg_class where relname = 'favorites';
-- Deve retornar relrowsecurity = true.
--
-- E que a coluna status existe:
--   select column_name, data_type, column_default
--   from information_schema.columns
--   where table_name = 'favorites' and column_name = 'status';

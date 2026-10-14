import { KeyRound } from "lucide-react";

/**
 * Tela de configuração inicial.
 *
 * Por que isso existe: sem token, a API do TMDB não responde. As opções
 * seriam (a) falhar o build, (b) renderizar páginas vazias em silêncio, ou
 * (c) mostrar isto. A opção (a) impede alguém de clonar o repositório e
 * rodar `npm run build` sem antes ter uma conta no TMDB — hostil. A (b)
 * deixa o desenvolvedor sem pista do que está errado.
 *
 * Esta tela é renderizada no servidor, então o passo a passo aparece
 * imediatamente, sem depender de nenhuma requisição externa.
 */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 md:px-8 md:py-32">
      <div className="mb-8 grid size-12 place-items-center rounded-[3px] border border-terra/30 bg-terra/10 text-terra">
        <KeyRound aria-hidden="true" className="size-5" />
      </div>

      <p className="label mb-5 text-terra">Configuração pendente</p>

      <h1 className="font-display text-display text-balance text-paper">
        Falta a chave da API do TMDB
      </h1>

      <p className="mt-6 text-[0.9375rem] leading-relaxed text-paper-dim">
        O app está pronto, mas precisa de um token para buscar os dados. Leva
        cerca de dois minutos para obter.
      </p>

      <ol className="mt-10 space-y-6 border-l border-line-strong pl-6">
        {[
          <>
            Crie uma conta em{" "}
            <a
              href="https://www.themoviedb.org/signup"
              target="_blank"
              rel="noreferrer noopener"
              className="break-words text-terra underline underline-offset-4 hover:text-terra-soft"
            >
              themoviedb.org/signup
            </a>{" "}
            e confirme o e-mail.
          </>,
          <>
            Acesse{" "}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noreferrer noopener"
              className="break-words text-terra underline underline-offset-4 hover:text-terra-soft"
            >
              themoviedb.org/settings/api
            </a>{" "}
            e clique em <strong className="text-paper">Create</strong> →{" "}
            <strong className="text-paper">Developer</strong>.
          </>,
          <>
            Copie o campo{" "}
            <strong className="text-paper">
              API Read Access Token (v4)
            </strong>{" "}
            — o texto longo que começa com{" "}
            <code className="rounded bg-ink-raised px-1.5 py-0.5 font-mono text-xs text-terra">
              eyJ
            </code>
            . Não use a &ldquo;API Key (v3)&rdquo;, que é outro campo.
          </>,
          <>
            Crie o arquivo{" "}
            <code className="rounded bg-ink-raised px-1.5 py-0.5 font-mono text-xs text-terra">
              .env.local
            </code>{" "}
            na raiz do projeto e cole:
          </>,
        ].map((step, index) => (
          <li key={index} className="relative">
            <span
              aria-hidden="true"
              className="label absolute -left-[1.9rem] grid size-6 place-items-center rounded-full border border-line-strong bg-ink text-paper-mute"
            >
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed text-paper-dim">{step}</p>
          </li>
        ))}
      </ol>

      <pre className="mt-6 overflow-x-auto rounded-[3px] border border-line bg-ink-raised p-5 font-mono text-xs leading-relaxed text-paper-dim">
        <code>
          TMDB_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...
          {"\n"}
          NEXT_PUBLIC_TMDB_REGION=BR
          {"\n"}
          NEXT_PUBLIC_TMDB_LANGUAGE=pt-BR
        </code>
      </pre>

      <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-paper-mute">
        Depois de salvar, reinicie o servidor (
        <code className="font-mono text-xs text-paper-dim">Ctrl+C</code> e{" "}
        <code className="font-mono text-xs text-paper-dim">npm run dev</code>).
        Variáveis de ambiente só são lidas na inicialização.
      </p>
    </div>
  );
}

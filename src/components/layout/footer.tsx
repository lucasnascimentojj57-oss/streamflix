import Link from "next/link";

/**
 * Footer.
 *
 * A atribuição ao TMDB não é opcional: os Termos de Uso da API exigem
 * o aviso de que o produto usa a API mas não é endossado por eles.
 * Omitir isso é violação de termos.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1680px] px-5 py-12 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-3">
            <p className="font-display text-2xl text-paper">
              stream<span className="text-terra">flix</span>
            </p>
            <p className="text-sm leading-relaxed text-paper-dim">
              Descubra o que está disponível nos serviços de streaming do
              Brasil, em um só lugar.
            </p>
          </div>

          <nav aria-label="Rodapé">
            <ul className="space-y-2.5">
              {[
                { href: "/descobrir", label: "Descobrir" },
                { href: "/descobrir?type=tv", label: "Séries" },
                { href: "/minha-lista", label: "Minha lista" },
                { href: "/busca", label: "Buscar" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="label text-paper-mute transition-colors hover:text-terra"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="max-w-xs space-y-3">
            <p className="label text-paper-mute">Dados</p>
            <p className="text-xs leading-relaxed text-paper-mute">
              Este produto usa a API do TMDB, mas não é endossado nem
              certificado pelo TMDB.
            </p>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer noopener"
              className="label inline-block text-paper-dim transition-colors hover:text-terra"
            >
              themoviedb.org ↗
            </a>
          </div>
        </div>

        <p className="label mt-12 border-t border-line pt-6 text-paper-mute">
          © {new Date().getFullYear()} StreamFlix — Projeto pessoal
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

/**
 * Aviso exibido nos formulários de autenticação quando o Supabase não
 * está configurado. Sem isso, o usuário veria campos e um botão que
 * falhariam silenciosamente.
 */
export function AuthNotConfigured() {
  return (
    <div className="rounded-[3px] border border-line bg-ink-raised p-7">
      <div className="mb-5 grid size-11 place-items-center rounded-[3px] border border-terra/30 bg-terra/10 text-terra">
        <TriangleAlert aria-hidden="true" className="size-5" />
      </div>

      <h2 className="font-display text-xl text-paper">
        Contas indisponíveis
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-paper-dim">
        Este projeto está rodando sem Supabase, então não é possível criar
        conta ou entrar — e as listas pessoais dependem de uma conta. Para
        ativar o login, configure as variáveis de ambiente descritas no{" "}
        <strong className="text-paper">README.md</strong>. Enquanto isso, você
        pode continuar explorando o catálogo.
      </p>

      <Link
        href="/descobrir"
        className="mt-6 inline-block text-sm text-terra underline underline-offset-4 hover:text-terra-soft"
      >
        Explorar o catálogo
      </Link>
    </div>
  );
}

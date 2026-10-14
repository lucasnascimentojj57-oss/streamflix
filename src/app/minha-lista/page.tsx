import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LibraryTabs } from "@/components/media/library-tabs";
import { LibraryView } from "@/components/media/library-view";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Minha lista",
  description:
    "O que você quer assistir e o que já assistiu, em um só lugar.",
};

/**
 * Página da biblioteca pessoal.
 *
 * A biblioteca exige conta, então verificamos a sessão AQUI, no servidor:
 * quem não está logado é redirecionado para /entrar com `?next=/minha-lista`
 * e volta para cá depois do login. Fazer isso no cliente causaria um flash
 * da lista vazia antes do redirecionamento.
 *
 * `getServerUser()` valida o JWT contra o servidor de auth do Supabase —
 * `getSession()` apenas leria o cookie, que pode ter sido forjado.
 */
export default async function MinhaListaPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent("/minha-lista")}`);
  }

  const { aba } = await searchParams;

  // "assistidos" é a segunda aba; qualquer outro valor cai em "quero".
  const activeTab = aba === "assistidos" ? "assistidos" : "quero";
  const status = activeTab === "assistidos" ? "watched" : "want";

  return (
    <div className="mx-auto max-w-[1680px] px-5 py-12 md:px-8 md:py-16">
      <header className="mb-8 max-w-2xl">
        <p className="label mb-4 text-terra">Sua coleção</p>
        <h1 className="font-display text-display text-paper">Minha lista</h1>
        <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-paper-dim">
          Organize o que você quer ver e registre o que já viu. Fica salvo na
          sua conta e acompanha você em qualquer dispositivo.
        </p>
      </header>

      <LibraryTabs active={activeTab} base="/minha-lista" variant="library" />

      <div className="mt-10">
        <LibraryView status={status} />
      </div>
    </div>
  );
}

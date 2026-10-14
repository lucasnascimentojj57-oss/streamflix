import type { Metadata } from "next";
import { LibraryTabs } from "@/components/media/library-tabs";
import { LibraryView } from "@/components/media/library-view";

export const metadata: Metadata = {
  title: "Minha lista",
  description:
    "O que você quer assistir e o que já assistiu, em um só lugar.",
};

/**
 * Página da biblioteca pessoal.
 *
 * Server Component fino: lê a aba ativa da URL (fonte da verdade) e
 * delega a lista a um Client Component — os dados vivem no localStorage
 * ou no Supabase, ambos acessíveis só no cliente. Manter a página como
 * Server Component preserva `metadata` e o shell renderizado no servidor.
 */
export default async function MinhaListaPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
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
          Organize o que você quer ver e registre o que já viu. Sem conta, tudo
          fica neste navegador; com conta, acompanha você em qualquer lugar.
        </p>
      </header>

      <LibraryTabs active={activeTab} base="/minha-lista" variant="library" />

      <div className="mt-10">
        <LibraryView status={status} />
      </div>
    </div>
  );
}

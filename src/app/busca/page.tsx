import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/filters/pagination";
import { SetupNotice } from "@/components/layout/setup-notice";
import { MediaGrid } from "@/components/media/media-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/skeletons";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import { search } from "@/lib/tmdb/endpoints";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Busque filmes e séries por título.",
};

/**
 * Página de busca.
 *
 * Rota separada de /descobrir de propósito: a API do TMDB não permite
 * combinar busca textual com filtros de provider — são endpoints distintos
 * com capacidades distintas. Tentar unificar as duas telas produziria uma
 * UI que promete o que a API não entrega.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto max-w-[1680px] px-5 py-12 md:px-8 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="label mb-4 text-terra">Busca</p>
        <h1 className="font-display text-display text-paper">
          Encontre um título
        </h1>
      </header>

      <div className="max-w-xl">
        <SearchInput autoFocus />
      </div>

      <div className="mt-12">
        {query ? (
          <Suspense
            key={`${query}-${page}`}
            fallback={<MediaGridSkeleton count={12} />}
          >
            <SearchResults query={query} page={page} />
          </Suspense>
        ) : (
          <EmptyState
            title="Digite para começar"
            description="Busque por nome de filme ou série. Os resultados aparecem conforme você digita."
          />
        )}
      </div>
    </div>
  );
}

async function SearchResults({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const result = await search(query, page);

  if (result.items.length === 0) {
    return (
      <EmptyState
        title={`Nada encontrado para “${query}”`}
        description="Confira a grafia ou tente um termo mais curto. Buscar pelo título original costuma ajudar com títulos estrangeiros."
      />
    );
  }

  return (
    <>
      <p
        aria-live="polite"
        className="label mb-8 text-paper-mute"
      >
        {result.totalResults.toLocaleString("pt-BR")}{" "}
        {result.totalResults === 1 ? "resultado" : "resultados"} para “{query}”
      </p>

      <MediaGrid items={result.items} />

      <div className="mt-16">
        <Pagination page={result.page} totalPages={result.totalPages} />
      </div>
    </>
  );
}

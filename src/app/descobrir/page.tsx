import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar } from "@/components/filters/filter-bar";
import { Pagination } from "@/components/filters/pagination";
import { MediaGrid } from "@/components/media/media-grid";
import { SetupNotice } from "@/components/layout/setup-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/skeletons";
import { parseFilters, type RawSearchParams } from "@/lib/filters";
import { getRegion } from "@/lib/region-server";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import { discover, listGenres, listProviders } from "@/lib/tmdb/endpoints";
import { featuredProviders } from "@/lib/tmdb/providers";

export const metadata: Metadata = {
  title: "Descobrir",
  description:
    "Filtre filmes e séries por serviço de streaming, gênero, ano e nota.",
};

/**
 * Página de descoberta.
 *
 * Padrão: a página é um Server Component que lê `searchParams` e busca os
 * dados no servidor. A `FilterBar` é um Client Component que só escreve na
 * URL. Isso significa que os dados nunca passam pelo cliente para serem
 * filtrados — o servidor entrega exatamente o que será exibido.
 *
 * A região vem do COOKIE (não da URL), então o servidor já renderiza com
 * os serviços e a disponibilidade do país do usuário.
 *
 * `searchParams` é uma Promise no Next 15+, então precisa de await.
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const region = await getRegion();
  const filters = parseFilters(params, region);

  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto max-w-[1680px] px-5 py-12 md:px-8 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="label mb-4 text-terra">Catálogo</p>
        <h1 className="font-display text-display text-balance text-paper">
          O que assistir agora
        </h1>
        <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-paper-dim">
          Só títulos incluídos na assinatura ou gratuitos nos serviços
          disponíveis na sua região. Sem aluguel, sem surpresa na hora de dar
          play.
        </p>
      </header>

      <Suspense fallback={<FilterBarSkeleton />}>
        <Results filters={filters} />
      </Suspense>
    </div>
  );
}

async function Results({
  filters,
}: {
  filters: ReturnType<typeof parseFilters>;
}) {
  const { region } = filters;

  // Gêneros, catálogo de providers e resultados em paralelo — sem
  // dependência entre eles. `listProviders` alimenta os chips de serviço.
  const [genres, allProviders, result] = await Promise.all([
    listGenres(filters.type),
    listProviders(region, filters.type),
    discover(filters),
  ]);

  const providers = featuredProviders(allProviders, region);

  const activeProviders = providers.filter((provider) =>
    filters.providers.includes(provider.id),
  );

  return (
    <>
      <FilterBar
        genres={genres}
        totalResults={result.totalResults}
        providers={providers}
        region={region}
      />

      <div className="mt-10">
        {result.items.length === 0 ? (
          <EmptyState
            title="Nenhum título com esses filtros"
            description={
              activeProviders.length > 1
                ? `Nenhum título está disponível em todos os serviços selecionados ao mesmo tempo. Tente remover ${
                    activeProviders[activeProviders.length - 1].short
                  }.`
                : "Tente ampliar o período, reduzir a nota mínima ou remover algum filtro."
            }
          />
        ) : (
          <>
            <MediaGrid items={result.items} />

            <div className="mt-16">
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="flex gap-3">
        <div className="skeleton h-9 w-40 rounded-[3px]" />
        <div className="skeleton h-9 w-36 rounded-[3px]" />
        <div className="skeleton h-9 w-24 rounded-[3px]" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-9 w-24 shrink-0 rounded-[3px]" />
        ))}
      </div>
      <MediaGridSkeleton />
    </div>
  );
}

import { Suspense } from "react";
import { SetupNotice } from "@/components/layout/setup-notice";
import { Hero } from "@/components/media/hero";
import { HomeTabs } from "@/components/media/home-tabs";
import { MediaRail } from "@/components/media/media-rail";
import { SectionHeading } from "@/components/ui/section-heading";
import { HeroSkeleton, MediaRailSkeleton } from "@/components/ui/skeletons";
import { getRegion } from "@/lib/region-server";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import {
  discoverByProvider,
  listProviders,
  trending,
} from "@/lib/tmdb/endpoints";
import { homeRailProviders, type FeaturedProvider } from "@/lib/tmdb/providers";

/**
 * Home.
 *
 * Arquitetura de streaming: cada trilha é um Server Component assíncrono
 * dentro do seu próprio `<Suspense>`. Consequência prática: a página começa
 * a pintar assim que o hero resolve, e as trilhas chegam conforme ficam
 * prontas — em vez de esperar a requisição mais lenta de todas.
 *
 * Sem isso, 6 chamadas ao TMDB bloqueariam o TTFB inteiro.
 *
 * A home é POR REGIÃO: os títulos e as trilhas refletem o que está
 * disponível no país (`getRegion()` lê o cookie). Trocar de região no
 * header muda esta página.
 *
 * As abas (`?aba=inicio|quero|assistidos`) vivem em um componente client
 * para manter o HTML pré-renderizado — ler `searchParams` aqui tornaria a
 * rota dinâmica por conta de uma decisão que é puramente visual.
 */

// Região e conteúdo mudam devagar; 1h é um bom equilíbrio.
export const revalidate = 3600;

export default async function HomePage() {
  // Sem token não há dados possíveis — mostramos o guia de configuração
  // em vez de uma home vazia ou de quebrar o build.
  if (!isTmdbConfigured()) return <SetupNotice />;

  const region = await getRegion();

  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection region={region} />
      </Suspense>

      <div className="mx-auto max-w-[1680px] px-5 py-14 md:px-8 md:py-16">
        {/* useSearchParams exige um limite de Suspense — ver home-tabs.tsx. */}
        <Suspense fallback={<HomeTabsSkeleton />}>
          <HomeTabs catalog={<CatalogSections region={region} />} />
        </Suspense>
      </div>
    </>
  );
}

/* ───────────────────────── Trilhas do catálogo ───────────────────────── */

async function CatalogSections({ region }: { region: string }) {
  // Os serviços em destaque são os mais populares DA REGIÃO — Globoplay
  // no Brasil, RTP Play em Portugal — em vez de uma lista fixa.
  const allProviders = await listProviders(region, "movie");
  const rails = homeRailProviders(allProviders, region);

  return (
    <div className="space-y-20">
      <Suspense fallback={<RailSectionSkeleton index={1} title="Em alta" />}>
        <TrendingSection />
      </Suspense>

      {rails.map((provider, index) => (
        <Suspense
          key={provider.id}
          fallback={
            <RailSectionSkeleton
              index={index + 2}
              title={`No ${provider.short}`}
            />
          }
        >
          <ProviderSection provider={provider} region={region} index={index + 2} />
        </Suspense>
      ))}
    </div>
  );
}

/* ───────────────────────── Seções assíncronas ───────────────────────── */

async function HeroSection({ region }: { region: string }) {
  const items = await trending("week");
  const featured = items.find((item) => item.backdropPath) ?? items[0];

  if (!featured) return null;
  // O hero não depende de região (tendências globais), mas mantemos a
  // prop para deixar explícito o ponto onde a região entra, se precisar.
  void region;
  return <Hero item={featured} />;
}

async function TrendingSection() {
  const items = await trending("week");
  if (!items.length) return null;

  return (
    <section aria-labelledby="trending-heading">
      <SectionHeading
        index={1}
        eyebrow="Esta semana"
        title="Em alta agora"
        description="Os títulos que o público está assistindo e comentando nos últimos sete dias."
        action={{ href: "/descobrir?sort=popularity.desc", label: "Ver tudo" }}
      />
      <div className="mt-8">
        <MediaRail
          items={items.slice(0, 12)}
          ranked
          priority
          label="Títulos em alta esta semana"
        />
      </div>
    </section>
  );
}

async function ProviderSection({
  provider,
  region,
  index,
}: {
  provider: FeaturedProvider;
  region: string;
  index: number;
}) {
  const items = await discoverByProvider(provider.id, region);
  if (!items.length) return null;

  return (
    <section aria-labelledby={`provider-${provider.id}-heading`}>
      <SectionHeading
        index={index}
        eyebrow="Incluído na assinatura"
        title={`No ${provider.short}`}
        action={{
          href: `/descobrir?p=${provider.id}`,
          label: "Ver catálogo",
        }}
      />
      <div className="mt-8">
        <MediaRail
          items={items.slice(0, 12)}
          label={`Títulos disponíveis no ${provider.short}`}
        />
      </div>
    </section>
  );
}

/* ───────────────────────── Fallbacks ───────────────────────── */

function HomeTabsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex gap-1 border-b border-line pb-px">
        {[112, 148, 128].map((width, index) => (
          <div
            key={index}
            className="skeleton mx-4 my-3 h-5 rounded-[3px]"
            style={{ width }}
          />
        ))}
      </div>
      <div className="mt-12">
        <MediaRailSkeleton />
      </div>
    </div>
  );
}

function RailSectionSkeleton({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  return (
    <section aria-hidden="true">
      <SectionHeading index={index} eyebrow="Carregando" title={title} />
      <div className="mt-8">
        <MediaRailSkeleton />
      </div>
    </section>
  );
}

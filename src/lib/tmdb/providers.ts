import type { TmdbProvider } from "./types";

/**
 * Curadoria de providers de streaming por região.
 *
 * Por que curar a partir do TMDB em vez de manter listas fixas no código?
 * Porque a resposta muda por país E no tempo:
 *  - Globoplay (307) só existe no Brasil; RTP Play (452) só em Portugal;
 *  - a lista anterior tinha IDs ERRADOS (554 era "BroadwayHD", não
 *    "Telecine"; 2242 e 619 nem existem mais).
 *
 * Então: o TMDB é a fonte da verdade de ids e nomes; aqui só decidimos
 * **quais** serviços merecem destaque, por região. Curadoria = filtro,
 * não digitação.
 *
 * A ordem é a `display_priorities[REGIÃO]` do TMDB (o que é popular lá),
 * limitada a um teto para os chips não virarem uma parede infinita.
 */

export interface FeaturedProvider {
  id: number;
  name: string;
  /** Nome curto para chips e rótulos. */
  short: string;
}

/** Teto de serviços exibidos nos chips de filtro. */
const MAX_FEATURED = 14;
/** Teto de trilhas por provider na home. */
const MAX_RAILS = 5;

/**
 * Exceções de nome curto.
 *
 * O nome do TMDB é a base, mas alguns são longos demais para um chip
 * ("Amazon Prime Video" → "Prime Video"). Chave = id do provider, que é
 * estável por serviço — o que muda por região é a disponibilidade.
 */
const SHORT_NAMES: Record<number, string> = {
  8: "Netflix",
  119: "Prime Video",
  337: "Disney+",
  350: "Apple TV+",
  1899: "Max",
  531: "Paramount+",
  283: "Crunchyroll",
  3: "Google Play",
  2: "Apple TV",
  10: "Amazon Video",
  68: "Microsoft Store",
  192: "YouTube",
  188: "YouTube Premium",
  35: "Rakuten TV",
  452: "RTP Play",
};

/** Nome curto de exibição a partir do provider do TMDB. */
function shortName(provider: TmdbProvider): string {
  return (
    SHORT_NAMES[provider.provider_id] ??
    provider.provider_name.replace(/\s+(Plus|Channel)$/i, "").trim()
  );
}

/**
 * Serviços que NÃO são "assistir incluído" e só poluem os chips.
 *
 * Lojas de aluguel/compra e meta-serviços — a proposta do app é o que já
 * está na assinatura, então eles ficam de fora da navegação principal.
 */
const EXCLUDED_IDS = new Set<number>([
  2285, // JustWatch TV — meta-serviço
  2, // Apple TV Store — loja
  3, // Google Play Movies — loja
  10, // Amazon Video — loja
  68, // Microsoft Store — loja
  192, // YouTube — avulso
]);

const byRegionPriority = (region: string) => (a: TmdbProvider, b: TmdbProvider) =>
  (a.display_priorities?.[region] ?? 999) -
  (b.display_priorities?.[region] ?? 999);

/**
 * Providers em destaque para uma região.
 *
 * Recebe a lista já vinda de `listProviders(region)` — não faz requisição
 * própria, para o módulo continuar utilizável em Client Components (que
 * não podem tocar no token do TMDB).
 */
export function featuredProviders(
  all: TmdbProvider[],
  region: string,
): FeaturedProvider[] {
  return all
    .filter((provider) => !EXCLUDED_IDS.has(provider.provider_id))
    .sort(byRegionPriority(region))
    .slice(0, MAX_FEATURED)
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      short: shortName(provider),
    }));
}

/** Primeiros providers (por prioridade regional) que viram trilhas na home. */
export function homeRailProviders(
  all: TmdbProvider[],
  region: string,
): FeaturedProvider[] {
  return all
    .filter((provider) => !EXCLUDED_IDS.has(provider.provider_id))
    .sort(byRegionPriority(region))
    .slice(0, MAX_RAILS)
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      short: shortName(provider),
    }));
}

import { SORT_OPTIONS, type DiscoverFilters, type MediaType, type SortValue } from "./tmdb/types";
import { DEFAULT_REGION, type RegionCode } from "./region";

/**
 * A URL é a fonte única da verdade dos filtros.
 *
 * Consequências positivas (decisão de arquitetura, não detalhe):
 *  - Estado compartilhável e favoritável pelo usuário
 *  - Botão voltar do navegador funciona de graça
 *  - Server Components leem o estado direto, sem hidratação
 *  - Zero chance de UI dessincronizada do estado
 *
 * Este módulo é a fronteira de parse/serialize. Tudo é validado:
 * nunca confiamos em searchParams, pois o usuário pode digitar qualquer coisa.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

/** "8,119,1899" → [8, 119, 1899], descartando valores inválidos. */
function parseIdList(value: string | string[] | undefined): number[] {
  const raw = first(value);
  if (!raw) return [];

  const ids = raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);

  return [...new Set(ids)].slice(0, 20); // limite defensivo
}

function parseInt_(
  value: string | string[] | undefined,
  { min, max }: { min: number; max: number },
): number | null {
  const raw = first(value);
  if (!raw) return null;

  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value));

export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_YEAR = 1950;

export function parseFilters(
  params: RawSearchParams,
  region: RegionCode = DEFAULT_REGION,
): DiscoverFilters {
  const type: MediaType = first(params.type) === "tv" ? "tv" : "movie";

  const sortRaw = first(params.sort);
  const sort: SortValue =
    sortRaw && VALID_SORTS.has(sortRaw)
      ? (sortRaw as SortValue)
      : "popularity.desc";

  return {
    type,
    providers: parseIdList(params.p),
    genres: parseIdList(params.g),
    sort,
    year: parseInt_(params.year, { min: MIN_YEAR, max: CURRENT_YEAR + 2 }),
    minRating: parseInt_(params.min, { min: 1, max: 9 }),
    page: parseInt_(params.page, { min: 1, max: 500 }) ?? 1,
    region,
  };
}

/**
 * Serializa filtros de volta para query string.
 * Omite valores default — mantém a URL curta e legível.
 *
 * `region` NÃO entra aqui de propósito: ela vem de cookie e não deve
 * viajar na URL (senão o link compartilhado carregaria o país de quem
 * enviou, não de quem abre).
 */
export function serializeFilters(f: Partial<DiscoverFilters>): string {
  const sp = new URLSearchParams();

  if (f.type && f.type !== "movie") sp.set("type", f.type);
  if (f.providers?.length) sp.set("p", f.providers.join(","));
  if (f.genres?.length) sp.set("g", f.genres.join(","));
  if (f.sort && f.sort !== "popularity.desc") sp.set("sort", f.sort);
  if (f.year) sp.set("year", String(f.year));
  if (f.minRating) sp.set("min", String(f.minRating));
  if (f.page && f.page > 1) sp.set("page", String(f.page));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const discoverHref = (f: Partial<DiscoverFilters>) =>
  `/descobrir${serializeFilters(f)}`;

/** Quantos filtros (além do tipo e ordenação) estão ativos. */
export function activeFilterCount(f: DiscoverFilters): number {
  return (
    f.providers.length +
    f.genres.length +
    (f.year ? 1 : 0) +
    (f.minRating ? 1 : 0)
  );
}

/** Lista de anos para o seletor, do mais recente ao mais antigo. */
export const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - MIN_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i,
);

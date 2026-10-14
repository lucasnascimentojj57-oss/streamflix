import type {
  CreditPerson,
  MediaDetails,
  MediaItem,
  MediaType,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbMultiResult,
  TmdbProvider,
  TmdbShow,
  TmdbShowDetails,
  TmdbVideo,
  TmdbWatchRegion,
} from "./types";

/**
 * Fronteira de normalização.
 *
 * Tudo que entra da API passa por aqui e sai como `MediaItem`/`MediaDetails`.
 * Benefício concreto: a UI não tem um único `if (type === 'movie')`.
 */

const isMovie = (r: TmdbMovie | TmdbShow): r is TmdbMovie =>
  "title" in r && typeof (r as TmdbMovie).title === "string";

/** Extrai o ano de "2024-03-01" → "2024". Tolera string vazia. */
const yearOf = (date: string | null | undefined) =>
  date && date.length >= 4 ? date.slice(0, 4) : null;

export function normalizeMedia(
  raw: TmdbMovie | TmdbShow,
  fallbackType?: MediaType,
): MediaItem {
  // `media_type` só vem em /search/multi e /trending; nas outras rotas
  // inferimos pelo shape (title vs name) e, por fim, pelo fallback.
  const type: MediaType =
    raw.media_type ?? (isMovie(raw) ? "movie" : fallbackType ?? "tv");

  const title = isMovie(raw) ? raw.title : raw.name;
  const originalTitle = isMovie(raw) ? raw.original_title : raw.original_name;
  const date = isMovie(raw) ? raw.release_date : raw.first_air_date;

  return {
    id: raw.id,
    type,
    title: title || originalTitle || "Sem título",
    originalTitle: originalTitle ?? "",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    year: yearOf(date),
    releaseDate: date || null,
    rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
    voteCount: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
    genreIds: raw.genre_ids ?? [],
  };
}

/**
 * Normaliza uma lista, descartando:
 *  - pessoas (vindas de /search/multi)
 *  - itens sem pôster (quebram o grid visualmente)
 *  - duplicatas por id+type (acontece em /trending)
 */
export function normalizeList(
  results: (TmdbMovie | TmdbShow | TmdbMultiResult)[] | undefined,
  fallbackType?: MediaType,
  { requirePoster = true } = {},
): MediaItem[] {
  if (!results?.length) return [];

  const seen = new Set<string>();
  const items: MediaItem[] = [];

  for (const raw of results) {
    if ("media_type" in raw && raw.media_type === "person") continue;

    const item = normalizeMedia(raw as TmdbMovie | TmdbShow, fallbackType);
    if (requirePoster && !item.posterPath) continue;

    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push(item);
  }

  return items;
}

/* ───────────────────────── Créditos ───────────────────────── */

function normalizeCast(
  details: TmdbMovieDetails | TmdbShowDetails,
  limit = 12,
): CreditPerson[] {
  return (details.credits?.cast ?? [])
    .slice(0, limit)
    .map(({ id, name, character, profile_path }) => ({
      id,
      name,
      role: character || "—",
      profilePath: profile_path,
    }));
}

function normalizeDirectors(
  details: TmdbMovieDetails | TmdbShowDetails,
): CreditPerson[] {
  // Filmes têm job="Director" no crew; séries têm created_by.
  if ("created_by" in details && details.created_by?.length) {
    return details.created_by.map(({ id, name }) => ({
      id,
      name,
      role: "Criação",
      profilePath: null,
    }));
  }

  const seen = new Set<number>();
  return (details.credits?.crew ?? [])
    .filter((c) => c.job === "Director")
    .filter((c) => (seen.has(c.id) ? false : seen.add(c.id)))
    .map(({ id, name }) => ({
      id,
      name,
      role: "Direção",
      profilePath: null,
    }));
}

/* ───────────────────────── Trailer ───────────────────────── */

/**
 * Escolhe o melhor vídeo disponível.
 * Prioridade: trailer oficial no idioma local > trailer oficial > trailer > teaser.
 * Só YouTube — é o único que embedamos.
 */
export function pickTrailer(videos: TmdbVideo[] | undefined): TmdbVideo | null {
  if (!videos?.length) return null;

  const youtube = videos.filter((v) => v.site === "YouTube");
  if (!youtube.length) return null;

  const score = (v: TmdbVideo) => {
    let s = 0;
    if (v.type === "Trailer") s += 8;
    else if (v.type === "Teaser") s += 4;
    if (v.official) s += 3;
    if (v.iso_639_1 === "pt") s += 2;
    return s;
  };

  return [...youtube].sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    // Empate: o mais recente.
    return (b.published_at ?? "").localeCompare(a.published_at ?? "");
  })[0];
}

/* ───────────────────────── Providers ───────────────────────── */

export function pickRegionProviders(
  details: TmdbMovieDetails | TmdbShowDetails,
  region: string,
): TmdbWatchRegion | null {
  return details["watch/providers"]?.results?.[region] ?? null;
}

/**
 * Sufixos que o TMDB usa para variantes de canal do mesmo serviço.
 *
 * "HBO Max Amazon Channel" é o Max assinado através da Amazon; para o
 * usuário é o mesmo serviço. Listar os dois lado a lado é ruído — e pior,
 * sugere que são opções diferentes quando não são.
 */
const VARIANT_SUFFIXES = [
  "amazon channel with ads",
  "amazon channel",
  "with ads",
];

/** "HBO Max Amazon Channel" → "hbo max" */
function baseProviderName(name: string) {
  let base = name.toLowerCase().trim();
  let changed = true;

  // Loop porque uma variante pode acumular sufixos
  // ("... Amazon Channel with Ads").
  while (changed) {
    changed = false;
    for (const suffix of VARIANT_SUFFIXES) {
      if (base.endsWith(suffix)) {
        base = base.slice(0, -suffix.length).trim();
        changed = true;
      }
    }
  }

  return base;
}

/**
 * Remove duplicatas por id E por nome-base, preservando o de maior
 * prioridade (menor `display_priority`).
 */
export function dedupeProviders(providers: TmdbProvider[]): TmdbProvider[] {
  const seenIds = new Set<number>();
  const seenNames = new Set<string>();

  return [...providers]
    .sort((a, b) => a.display_priority - b.display_priority)
    .filter((provider) => {
      if (seenIds.has(provider.provider_id)) return false;
      seenIds.add(provider.provider_id);

      const base = baseProviderName(provider.provider_name);
      if (seenNames.has(base)) return false;
      seenNames.add(base);

      return true;
    });
}

/** Achata as formas de assistir que consideramos "incluído" (sem custo extra). */
export function includedProviders(region: TmdbWatchRegion | null) {
  if (!region) return [];

  return dedupeProviders([
    ...(region.flatrate ?? []),
    ...(region.free ?? []),
    ...(region.ads ?? []),
  ]);
}

/* ───────────────────────── Detalhes ───────────────────────── */

export function normalizeDetails(
  raw: TmdbMovieDetails | TmdbShowDetails,
  type: MediaType,
  region: string,
): MediaDetails {
  const base = normalizeMedia(raw, type);
  const providers = pickRegionProviders(raw, region);

  const isTv = type === "tv";
  const tvRaw = raw as TmdbShowDetails;
  const movieRaw = raw as TmdbMovieDetails;

  const runtime = isTv
    ? tvRaw.episode_run_time?.[0] ?? null
    : movieRaw.runtime ?? null;

  return {
    ...base,
    type,
    tagline: raw.tagline || null,
    genres: raw.genres ?? [],
    runtime,
    status: raw.status ?? "",
    originalLanguage: raw.original_language ?? "",
    homepage: raw.homepage || null,
    cast: normalizeCast(raw),
    directors: normalizeDirectors(raw),
    trailer: pickTrailer(raw.videos?.results),
    providers,
    recommendations: normalizeList(raw.recommendations?.results, type),
    seasons: isTv ? tvRaw.number_of_seasons ?? null : null,
    episodes: isTv ? tvRaw.number_of_episodes ?? null : null,
  };
}

/* ───────────────────────── Formatadores ───────────────────────── */

/** 142 → "2h 22min" */
export function formatRuntime(minutes: number | null) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** 7.84 → "7.8". Retorna null quando não há votos suficientes para ser útil. */
export function formatRating(rating: number, voteCount: number) {
  if (!rating || voteCount < 10) return null;
  return rating.toFixed(1);
}

/** Rótulo textual da nota — acessibilidade: nunca comunicar só por cor. */
export function ratingLabel(rating: number) {
  if (rating >= 8) return "Excelente";
  if (rating >= 7) return "Muito bom";
  if (rating >= 6) return "Bom";
  if (rating >= 5) return "Regular";
  return "Fraco";
}

/**
 * Tradução do campo `status`.
 *
 * O TMDB não localiza este campo — mesmo com `language=pt-BR` ele devolve
 * "Released", "Returning Series" etc. em inglês. Traduzimos aqui para não
 * deixar um termo solto em inglês no meio de uma interface em português.
 */
const STATUS_LABELS: Record<string, string> = {
  Released: "Lançado",
  "Post Production": "Em pós-produção",
  "In Production": "Em produção",
  Planned: "Planejado",
  Rumored: "Rumor",
  Canceled: "Cancelado",
  "Returning Series": "Em exibição",
  Ended: "Finalizada",
  Pilot: "Piloto",
};

export const statusLabel = (status: string) =>
  STATUS_LABELS[status] ?? status;

/**
 * Nome do idioma em português, via `Intl.DisplayNames` (nativo, sem
 * dependência). "en" → "inglês". Cai para o código em maiúsculas se o
 * ambiente não suportar a API.
 */
const languageNames = (() => {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "language" });
  } catch {
    return null;
  }
})();

export function languageLabel(code: string) {
  if (!code) return "";
  return languageNames?.of(code) ?? code.toUpperCase();
}

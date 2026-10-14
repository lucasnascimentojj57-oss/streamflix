/**
 * Tipos do TMDB + o tipo normalizado que a UI consome.
 *
 * Princípio: a API retorna shapes diferentes para filme e série
 * (`title` vs `name`, `release_date` vs `first_air_date`). Em vez de
 * espalhar ternários pela UI, normalizamos na fronteira para `MediaItem`.
 */

import type { RegionCode } from "@/lib/region";

export type MediaType = "movie" | "tv";

/* ───────────────────────── Respostas brutas ───────────────────────── */

export interface TmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovie {
  id: number;
  media_type?: "movie";
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  adult: boolean;
}

export interface TmdbShow {
  id: number;
  media_type?: "tv";
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
}

export type TmdbPerson = {
  id: number;
  media_type: "person";
  name: string;
};

/** Resultado de /search/multi — pode ser qualquer um dos três. */
export type TmdbMultiResult = TmdbMovie | TmdbShow | TmdbPerson;

/* ───────────────────────── Sub-recursos ───────────────────────── */

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: "YouTube" | "Vimeo";
  type: "Trailer" | "Teaser" | "Clip" | "Featurette" | "Behind the Scenes";
  official: boolean;
  published_at: string;
  iso_639_1: string;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  /** Prioridade global (igual em toda consulta). Não use para ordenar por região. */
  display_priority: number;
  /**
   * Prioridade POR região. A chave é o código do país (ex.: "BR", "PT").
   * É ESTE o campo correto para ordenar e para saber se o serviço existe
   * no país — a ausência da chave significa que o serviço não está lá.
   */
  display_priorities?: Record<string, number>;
}

export interface TmdbWatchRegion {
  link?: string;
  /** Incluído na assinatura (Netflix, Prime, Max…) */
  flatrate?: TmdbProvider[];
  /** Grátis com anúncios */
  ads?: TmdbProvider[];
  /** Grátis */
  free?: TmdbProvider[];
  /** Aluguel */
  rent?: TmdbProvider[];
  /** Compra */
  buy?: TmdbProvider[];
}

export interface TmdbWatchProviders {
  results: Record<string, TmdbWatchRegion | undefined>;
}

/* ─────────────────── Detalhes (com append_to_response) ─────────────────── */

interface DetailsAppendix {
  credits?: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] };
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
  recommendations?: TmdbPage<TmdbMovie | TmdbShow>;
  images?: { backdrops: { file_path: string }[] };
}

export interface TmdbMovieDetails extends TmdbMovie, DetailsAppendix {
  runtime: number | null;
  genres: TmdbGenre[];
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
  original_language: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  imdb_id: string | null;
  homepage: string | null;
}

export interface TmdbShowDetails extends TmdbShow, DetailsAppendix {
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TmdbGenre[];
  tagline: string | null;
  status: string;
  last_air_date: string | null;
  in_production: boolean;
  original_language: string;
  created_by: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  homepage: string | null;
}

/* ───────────────────── Modelo normalizado da UI ───────────────────── */

/** Referência mínima e estável — usada nas listas e nos links. */
export interface MediaRef {
  id: number;
  type: MediaType;
}

/** O que todo card/grid/trilha consome. Uma forma só. */
export interface MediaItem extends MediaRef {
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  /** Ano de estreia como string de 4 dígitos, ou null. */
  year: string | null;
  /** Data ISO completa, para ordenação. */
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
}

export interface CreditPerson {
  id: number;
  name: string;
  role: string;
  profilePath: string | null;
}

export interface MediaDetails extends MediaItem {
  tagline: string | null;
  genres: TmdbGenre[];
  /** Minutos. Para séries, duração média do episódio. */
  runtime: number | null;
  status: string;
  originalLanguage: string;
  homepage: string | null;
  cast: CreditPerson[];
  directors: CreditPerson[];
  trailer: TmdbVideo | null;
  providers: TmdbWatchRegion | null;
  recommendations: MediaItem[];
  /** Só para séries. */
  seasons: number | null;
  episodes: number | null;
}

/* ───────────────────────── Filtros ───────────────────────── */

export const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Mais populares" },
  { value: "vote_average.desc", label: "Melhor avaliados" },
  { value: "primary_release_date.desc", label: "Mais recentes" },
  { value: "revenue.desc", label: "Maior bilheteria" },
  { value: "title.asc", label: "Título (A–Z)" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface DiscoverFilters {
  type: MediaType;
  providers: number[];
  genres: number[];
  sort: SortValue;
  year: number | null;
  minRating: number | null;
  page: number;
  /** Região de disponibilidade (BR/PT). Não vai na URL: vem do cookie. */
  region: RegionCode;
}

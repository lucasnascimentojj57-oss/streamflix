import "server-only";

import { REVALIDATE, tmdbFetch, tmdbFetchSafe } from "./client";
import { normalizeDetails, normalizeList } from "./normalize";
import type {
  DiscoverFilters,
  MediaDetails,
  MediaItem,
  MediaType,
  TmdbGenre,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbMultiResult,
  TmdbPage,
  TmdbProvider,
  TmdbShow,
  TmdbShowDetails,
} from "./types";

/**
 * Funções de acesso a dados. Cada uma devolve tipos já normalizados —
 * as páginas nunca tocam no shape bruto da API.
 */

export interface PagedResult {
  items: MediaItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

/** O TMDB rejeita page > 500. */
const clampPage = (page: number) => Math.min(Math.max(1, page), 500);

function toPaged(
  raw: TmdbPage<TmdbMovie | TmdbShow>,
  type?: MediaType,
): PagedResult {
  return {
    items: normalizeList(raw.results, type),
    page: raw.page,
    totalPages: Math.min(raw.total_pages, 500),
    totalResults: raw.total_results,
  };
}

/* ═══════════════════════════ DESCOBRIR ═══════════════════════════ */

/**
 * Consulta principal do app: o que está disponível nos streamings agora.
 *
 * `with_watch_monetization_types=flatrate|free|ads` → só o que está
 * incluído na assinatura ou é grátis. Sem isso, viriam filmes de aluguel,
 * que não é a proposta.
 */
export async function discover(
  filters: Partial<DiscoverFilters> & { region: string },
): Promise<PagedResult> {
  const {
    type = "movie",
    providers = [],
    genres = [],
    sort = "popularity.desc",
    year = null,
    minRating = null,
    page = 1,
    region,
  } = filters;

  // `primary_release_date` não existe em /discover/tv — o campo é first_air_date.
  const sortBy =
    type === "tv"
      ? sort.replace("primary_release_date", "first_air_date")
      : sort;

  const params: Record<string, string | number | undefined> = {
    page: clampPage(page),
    sort_by: sortBy,
    include_adult: "false",
    watch_region: region,
    with_watch_monetization_types: "flatrate|free|ads",
    // Evita o "lixo" de títulos com 2 votos no topo de vote_average.desc.
    "vote_count.gte": sort.startsWith("vote_average") ? 200 : 50,
  };

  if (providers.length) params.with_watch_providers = providers.join("|");
  if (genres.length) params.with_genres = genres.join(",");
  if (minRating) params["vote_average.gte"] = minRating;

  if (year) {
    if (type === "movie") params.primary_release_year = year;
    else params.first_air_date_year = year;
  }

  const raw = await tmdbFetch<TmdbPage<TmdbMovie | TmdbShow>>(
    `/discover/${type}`,
    {
      params,
      revalidate: REVALIDATE.list,
      // A região entra na chave de cache: BR e PT são entradas distintas.
      tags: ["discover", region],
    },
  );

  return toPaged(raw, type);
}

/** Trilha da home: destaques de um provider específico. */
export async function discoverByProvider(
  providerId: number,
  region: string,
  type: MediaType = "movie",
): Promise<MediaItem[]> {
  const result = await tmdbFetchSafe<TmdbPage<TmdbMovie | TmdbShow>>(
    `/discover/${type}`,
    { page: 1, results: [], total_pages: 0, total_results: 0 },
    {
      params: {
        sort_by: "popularity.desc",
        watch_region: region,
        with_watch_providers: providerId,
        with_watch_monetization_types: "flatrate|free|ads",
        include_adult: "false",
        "vote_count.gte": 80,
        page: 1,
      },
      revalidate: REVALIDATE.list,
      tags: ["discover", `provider:${providerId}`, region],
    },
  );

  return normalizeList(result.results, type);
}

/* ═══════════════════════════ TENDÊNCIAS ═══════════════════════════ */

/**
 * Tendências da semana.
 *
 * Usa `tmdbFetch` (estrito) de propósito: é o conteúdo principal da home.
 * Se falhar — token ausente, API fora do ar — queremos que o error boundary
 * apareça com uma mensagem acionável, em vez de uma home silenciosamente
 * vazia onde o usuário não faz ideia do que deu errado.
 */
export async function trending(
  window: "day" | "week" = "week",
): Promise<MediaItem[]> {
  const raw = await tmdbFetch<TmdbPage<TmdbMultiResult>>(
    `/trending/all/${window}`,
    { revalidate: REVALIDATE.list, tags: ["trending"] },
  );

  return normalizeList(raw.results);
}

/* ═══════════════════════════ BUSCA ═══════════════════════════ */

/**
 * Busca textual. Nota: /search não aceita filtros de provider —
 * é uma limitação da API, não uma omissão. Por isso a busca é uma
 * rota separada, sem a barra de filtros.
 */
export async function search(
  query: string,
  page = 1,
): Promise<PagedResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { items: [], page: 1, totalPages: 0, totalResults: 0 };
  }

  const raw = await tmdbFetch<TmdbPage<TmdbMultiResult>>("/search/multi", {
    params: {
      query: trimmed,
      page: clampPage(page),
      include_adult: "false",
    },
    revalidate: REVALIDATE.search,
  });

  return {
    items: normalizeList(raw.results),
    page: raw.page,
    totalPages: Math.min(raw.total_pages, 500),
    totalResults: raw.total_results,
  };
}

/* ═══════════════════════════ DETALHES ═══════════════════════════ */

/**
 * Detalhes completos em UMA requisição.
 *
 * `append_to_response` colapsa 5 chamadas (details, credits, videos,
 * watch/providers, recommendations) em uma só. Sem isso, teríamos
 * 5 round-trips em cascata — ~1.2s a mais de TTFB.
 */
export async function getDetails(
  type: MediaType,
  id: number,
  region: string,
): Promise<MediaDetails | null> {
  try {
    const raw = await tmdbFetch<TmdbMovieDetails | TmdbShowDetails>(
      `/${type}/${id}`,
      {
        params: {
          append_to_response: "credits,videos,watch/providers,recommendations",
          // Garante trailer mesmo quando não há versão dublada/legendada local.
          include_video_language: "pt,en,null",
        },
        revalidate: REVALIDATE.details,
        tags: [`${type}:${id}`],
      },
    );

    return normalizeDetails(raw, type, region);
  } catch {
    // 404 é esperado (id inválido na URL) → a página chama notFound().
    return null;
  }
}

/* ═══════════════════════════ METADADOS ═══════════════════════════ */

export async function listGenres(type: MediaType): Promise<TmdbGenre[]> {
  const raw = await tmdbFetchSafe<{ genres: TmdbGenre[] }>(
    `/genre/${type}/list`,
    { genres: [] },
    { revalidate: REVALIDATE.static, tags: ["genres"] },
  );

  return raw.genres;
}

/**
 * Lista de providers de uma região — a fonte da verdade da curadoria.
 *
 * Por que buscar do TMDB em vez de uma lista fixa no código? Porque os
 * nomes e a disponibilidade mudam por país (Globoplay só existe no BR;
 * RTP Play só em PT) e no tempo (Star+ foi descontinuado). Uma lista
 * manual sempre envelhece — e uma lista fixa já errou IDs no passado.
 */
export async function listProviders(
  region: string,
  type: MediaType = "movie",
): Promise<TmdbProvider[]> {
  const raw = await tmdbFetchSafe<{ results: TmdbProvider[] }>(
    `/watch/providers/${type}`,
    { results: [] },
    {
      params: { watch_region: region },
      revalidate: REVALIDATE.static,
      tags: ["providers", region],
    },
  );

  // Ordena pela prioridade DA REGIÃO — `display_priority` é global e daria
  // a mesma ordem para todos os países, escondendo o que é popular aqui.
  return raw.results
    .filter((provider) => provider.display_priorities?.[region] != null)
    .sort(
      (a, b) =>
        (a.display_priorities?.[region] ?? 999) -
        (b.display_priorities?.[region] ?? 999),
    );
}

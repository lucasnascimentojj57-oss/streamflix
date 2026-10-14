import "server-only";

/**
 * Cliente HTTP do TMDB.
 *
 * `server-only` faz o build FALHAR se algum Client Component importar
 * este módulo — garantindo que o access token nunca chegue ao browser.
 *
 * Estratégia de cache: o TMDB tem rate limit (~50 req/s) e os dados mudam
 * em ritmos muito diferentes. Cachear tudo igual seria desperdício ou risco,
 * então cada tipo de recurso tem seu próprio TTL (ver `REVALIDATE`).
 */

import { LANGUAGE } from "./config";

const BASE_URL = "https://api.themoviedb.org/3";

// Reexportado para conveniência de quem já importa do client.
export { LANGUAGE, REGION } from "./config";

/** TTL de cache em segundos, por volatilidade do dado. */
export const REVALIDATE = {
  /** Gêneros e lista de providers: praticamente estáticos. */
  static: 60 * 60 * 24, // 24h
  /** Detalhes de um título: elenco/trailer raramente mudam. */
  details: 60 * 60 * 12, // 12h
  /** Listas de descoberta: catálogo de streaming gira devagar. */
  list: 60 * 60, // 1h
  /** Busca: resultados voláteis, cache curto só para absorver duplo-clique. */
  search: 60 * 5, // 5min
} as const;

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export class TmdbConfigError extends Error {
  constructor() {
    super(
      "TMDB não configurado. Preencha TMDB_ACCESS_TOKEN (token v4, recomendado) ou TMDB_API_KEY (chave v3) no .env.local. Instruções no README.",
    );
    this.name = "TmdbConfigError";
  }
}

/**
 * Credenciais do TMDB — as duas formas que a API aceita.
 *
 * A API v3 aceita autenticação de duas maneiras:
 *  1. **v4 (Bearer)** — `TMDB_ACCESS_TOKEN`, um JWT longo, enviado no header
 *     `Authorization`. É a forma **recomendada**: o segredo viaja no header,
 *     não na URL, então nunca aparece em logs de proxy, em histórico de
 *     navegador nem em mensagens de erro.
 *  2. **v3 (api_key)** — `TMDB_API_KEY`, 32 caracteres hexadecimais, enviada
 *     como query string. Funciona, mas é menos segura pelo motivo acima.
 *
 * Aceitamos as duas porque quem clona o projeto às vezes já tem só uma delas
 * em mãos. A v4 tem prioridade quando ambas existem.
 */
function getCredentials(): { bearer?: string; apiKey?: string } | null {
  const bearer = process.env.TMDB_ACCESS_TOKEN?.trim();
  if (bearer) return { bearer };

  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (apiKey) return { apiKey };

  return null;
}

/**
 * `true` quando o token está presente.
 *
 * Usado pelas páginas para decidir entre renderizar o conteúdo ou a tela
 * de configuração. Sem isso, o build de produção falharia para qualquer
 * pessoa que clonasse o repositório sem ter uma conta no TMDB — o que
 * tornaria o projeto impossível de avaliar.
 */
export const isTmdbConfigured = () =>
  Boolean(
    process.env.TMDB_ACCESS_TOKEN?.trim() ||
      process.env.TMDB_API_KEY?.trim(),
  );

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  params?: Record<string, QueryValue>;
  revalidate?: number;
  /** Tags para invalidação manual via revalidateTag. */
  tags?: string[];
  signal?: AbortSignal;
}

function buildUrl(
  path: string,
  params: Record<string, QueryValue> = {},
  apiKey?: string,
) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", LANGUAGE);

  // Autenticação v3 vai na própria URL (é o único jeito que a v3 aceita).
  if (apiKey) url.searchParams.set("api_key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    // Descarta vazios para não poluir a URL (e a chave de cache).
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

/**
 * Executa uma requisição ao TMDB.
 * Lança `TmdbError` em respostas não-OK e `TmdbConfigError` se faltar credencial.
 */
export async function tmdbFetch<T>(
  path: string,
  { params, revalidate = REVALIDATE.list, tags, signal }: RequestOptions = {},
): Promise<T> {
  const credentials = getCredentials();
  if (!credentials) throw new TmdbConfigError();

  const url = buildUrl(path, params, credentials.apiKey);

  const response = await fetch(url, {
    headers: {
      ...(credentials.bearer
        ? { Authorization: `Bearer ${credentials.bearer}` }
        : {}),
      Accept: "application/json",
    },
    next: { revalidate, tags },
    signal,
  });

  if (!response.ok) {
    // O corpo de erro do TMDB tem `status_message` — útil no log.
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { status_message?: string };
      if (body.status_message) detail = body.status_message;
    } catch {
      /* corpo não-JSON: mantém statusText */
    }

    throw new TmdbError(detail, response.status, path);
  }

  return response.json() as Promise<T>;
}

/**
 * Variante tolerante a falha: devolve `fallback` em vez de lançar.
 *
 * Usada em dados secundários (ex.: trilha de recomendações na home).
 * Um provider fora do ar não deve derrubar a página inteira.
 */
export async function tmdbFetchSafe<T>(
  path: string,
  fallback: T,
  options?: RequestOptions,
): Promise<T> {
  try {
    return await tmdbFetch<T>(path, options);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[tmdb] falha tolerada em ${path}:`, error);
    }
    return fallback;
  }
}

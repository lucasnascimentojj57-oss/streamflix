/**
 * Configuração isomórfica do TMDB.
 *
 * Este módulo existe separado de `client.ts` por uma razão concreta:
 * `client.ts` importa `server-only` (para proteger o token), mas
 * `normalize.ts` precisa de `REGION` e é usado também por Client Components
 * (o `RatingBadge`, por exemplo). Importar `client.ts` de dentro de
 * `normalize.ts` arrastaria `server-only` para o bundle do browser e o
 * build falharia — corretamente.
 *
 * Regra: aqui só entram valores públicos (prefixo NEXT_PUBLIC_).
 * Nenhum segredo pode morar neste arquivo.
 */

export const LANGUAGE = process.env.NEXT_PUBLIC_TMDB_LANGUAGE ?? "pt-BR";
export const REGION = process.env.NEXT_PUBLIC_TMDB_REGION ?? "BR";

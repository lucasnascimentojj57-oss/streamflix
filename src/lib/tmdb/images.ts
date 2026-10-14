/**
 * Builder de URLs de imagem do TMDB.
 *
 * Importante para performance: o TMDB serve tamanhos pré-renderizados.
 * Pedir `original` para um card de 180px desperdiça megabytes.
 * Usamos sempre o menor tamanho que cobre o slot de layout.
 *
 * Este módulo é isomórfico (sem segredos) — pode ser usado no cliente.
 */

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export const POSTER = {
  xs: "w154",
  sm: "w185",
  md: "w342", // grid mobile
  lg: "w500", // grid desktop / página de detalhes
} as const;

export const BACKDROP = {
  sm: "w300",
  md: "w780",
  lg: "w1280", // hero — nunca `original` (chega a 4MB)
} as const;

export const PROFILE = {
  sm: "w45",
  md: "w185",
} as const;

export const LOGO = {
  sm: "w45",
  md: "w92",
} as const;

/** Monta a URL completa. Retorna `null` quando não há imagem. */
export function imageUrl(path: string | null | undefined, size: string) {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export const posterUrl = (
  p: string | null | undefined,
  size: string = POSTER.md,
) => imageUrl(p, size);

export const backdropUrl = (
  p: string | null | undefined,
  size: string = BACKDROP.md,
) => imageUrl(p, size);

export const profileUrl = (
  p: string | null | undefined,
  size: string = PROFILE.md,
) => imageUrl(p, size);

export const logoUrl = (
  p: string | null | undefined,
  size: string = LOGO.md,
) => imageUrl(p, size);

/**
 * Placeholder blur de 1px, gerado inline.
 * Evita layout shift e o "flash branco" ao carregar pôsteres,
 * sem precisar buscar a imagem no servidor para gerar base64 real.
 */
/* URL-encoded (não base64) para funcionar também no browser, onde
   `Buffer` não existe. */
export const BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%272%27%20height%3D%273%27%3E%3Crect%20width%3D%272%27%20height%3D%273%27%20fill%3D%27%23141416%27%2F%3E%3C%2Fsvg%3E";

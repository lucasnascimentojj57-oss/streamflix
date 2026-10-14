/**
 * Região — configuração isomórfica.
 *
 * O app atende Brasil e Portugal. A região escolhida muda **o que está
 * disponível** (quais títulos, em quais serviços) e **quais serviços
 * existem** — mas não o idioma da interface, que continua em português.
 *
 * Persistimos a escolha em **cookie, não localStorage**. Motivo concreto:
 * a home e o catálogo são Server Components. Ler localStorage exigiria
 * hidratar primeiro e só então buscar os dados — causando um flash de
 * conteúdo errado. Com cookie, o servidor já renderiza na região certa.
 *
 * Vive em `config.ts` (e não em `client.ts`, que é `server-only`) porque
 * os componentes de UI de filtros também precisam da lista de regiões.
 */

export const REGIONS = [
  { code: "BR", label: "Brasil", flag: "🇧🇷" },
  { code: "PT", label: "Portugal", flag: "🇵🇹" },
] as const;

export type RegionCode = (typeof REGIONS)[number]["code"];

/** Região padrão quando não há cookie (o README assume o público brasileiro). */
export const DEFAULT_REGION: RegionCode =
  (process.env.NEXT_PUBLIC_TMDB_REGION as RegionCode | undefined) ?? "BR";

export const REGION_COOKIE = "streamflix.region";

export const isRegionCode = (value: unknown): value is RegionCode =>
  typeof value === "string" && REGIONS.some((region) => region.code === value);

export const regionLabel = (code: string) =>
  REGIONS.find((region) => region.code === code)?.label ?? code;

export const regionFlag = (code: string) =>
  REGIONS.find((region) => region.code === code)?.flag ?? "";

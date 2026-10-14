import "server-only";

import { cookies } from "next/headers";
import {
  DEFAULT_REGION,
  isRegionCode,
  REGION_COOKIE,
  type RegionCode,
} from "@/lib/region";

/**
 * Região atual, lida do cookie — só no servidor.
 *
 * Server Components usam isto para buscar a disponibilidade correta. É
 * um read puro (nenhum efeito colateral): ler cookie em Server Component
 * é permitido; escrever não seria.
 */
export async function getRegion(): Promise<RegionCode> {
  const store = await cookies();
  const value = store.get(REGION_COOKIE)?.value;

  return isRegionCode(value) ? value : DEFAULT_REGION;
}

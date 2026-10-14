"use client";

import { useCallback, useState } from "react";
import { REGION_COOKIE, type RegionCode } from "./region";

/**
 * Região no cliente.
 *
 * O cookie é a fonte da verdade e o SERVIDOR já entrega o valor correto
 * (`initial`) — então não há efeito de leitura aqui. Ler o cookie de novo
 * no cliente causaria um render em cascata e, se o cookie estivesse
 * corrompido, divergência de hidratação. Este hook apenas mantém o valor
 * para exibir no seletor e o reescreve quando o usuário troca.
 *
 * Após escrever, quem chama faz `router.refresh()` para os Server
 * Components refazerem o fetch na nova região.
 */
export function useRegion(initial: RegionCode) {
  const [region, setRegionState] = useState<RegionCode>(initial);

  const setRegion = useCallback((next: RegionCode) => {
    // 1 ano, path raiz, SameSite Lax (não é dado sensível).
    document.cookie = `${REGION_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setRegionState(next);
  }, []);

  return { region, setRegion };
}

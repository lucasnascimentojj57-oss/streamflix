"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { parseFilters, serializeFilters } from "@/lib/filters";
import type { RegionCode } from "@/lib/region";
import type { DiscoverFilters } from "@/lib/tmdb/types";

/**
 * Navegação de filtros.
 *
 * Padrão central do app: os filtros vivem na URL. Este hook lê o estado
 * atual dela e expõe `update`, que faz push de uma nova URL.
 *
 * A REGIÃO é a exceção: vem de cookie (não da URL), então chega como
 * parâmetro — `serializeFilters` a ignora de propósito, mantendo a URL
 * enxuta e compartilhável independentemente do país do navegador.
 *
 * Detalhes importantes:
 *  - `useTransition` mantém a UI interativa durante o refetch no servidor.
 *    Sem isso, o grid congelaria a cada clique em chip.
 *  - Qualquer mudança de filtro reseta `page` para 1 — esquecer isso é um
 *    bug clássico (usuário na página 7, troca de gênero, recebe "sem resultados").
 *  - `scroll: false` evita o salto ao topo a cada toggle de chip.
 */
export function useFilterNav(region: RegionCode, basePath = "/descobrir") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseFilters(
    Object.fromEntries(searchParams.entries()),
    region,
  );

  const push = useCallback(
    (next: DiscoverFilters, { scroll = false } = {}) => {
      startTransition(() => {
        router.push(`${basePath}${serializeFilters(next)}`, { scroll });
      });
    },
    [router, basePath],
  );

  /** Atualiza campos e volta para a página 1. */
  const update = useCallback(
    (patch: Partial<DiscoverFilters>) => {
      push({ ...filters, ...patch, page: 1 });
    },
    [filters, push],
  );

  /** Paginação preserva os filtros e sobe a página. */
  const goToPage = useCallback(
    (page: number) => {
      push({ ...filters, page }, { scroll: true });
    },
    [filters, push],
  );

  /** Liga/desliga um id em `providers` ou `genres`. */
  const toggleId = useCallback(
    (key: "providers" | "genres", id: number) => {
      const current = filters[key];
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];

      update({ [key]: next });
    },
    [filters, update],
  );

  const reset = useCallback(() => {
    push({ ...filters, providers: [], genres: [], year: null, minRating: null, page: 1 });
  }, [filters, push]);

  return { filters, update, toggleId, goToPage, reset, isPending };
}

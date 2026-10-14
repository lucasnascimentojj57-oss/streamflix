"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { activeFilterCount, YEAR_OPTIONS } from "@/lib/filters";
import type { RegionCode } from "@/lib/region";
import type { FeaturedProvider } from "@/lib/tmdb/providers";
import { SORT_OPTIONS, type MediaType, type SortValue, type TmdbGenre } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { Chip } from "./chip";
import { useFilterNav } from "./use-filter-nav";

interface FilterBarProps {
  genres: TmdbGenre[];
  totalResults: number;
  /** Serviços em destaque NA REGIÃO ATUAL (vêm do TMDB). */
  providers: FeaturedProvider[];
  /** Região ativa — passada para a navegação (não vai na URL). */
  region: RegionCode;
}

/**
 * Barra de filtros.
 *
 * Arquitetura de UI: dois níveis.
 *  1. Sempre visível — tipo (filme/série), providers e ordenação.
 *     São os filtros que ~90% dos usuários tocam.
 *  2. Painel expansível — gêneros, ano, nota mínima.
 *     Escondidos por padrão para não afogar a interface em 40 chips.
 *
 * A lista de providers é POR REGIÃO: em Portugal aparecem RTP Play,
 * Rakuten TV etc., e Globoplay/Telecine não aparecem (lá não existem).
 *
 * Acessibilidade:
 *  - cada grupo é um `role="group"` com `aria-label`, para o leitor de tela
 *    anunciar o contexto antes dos chips;
 *  - o painel usa `aria-expanded` + `aria-controls`;
 *  - a contagem de resultados é um `aria-live="polite"`, então o usuário de
 *    leitor de tela sabe que a lista mudou sem precisar navegar até ela.
 */
export function FilterBar({
  genres,
  totalResults,
  providers,
  region,
}: FilterBarProps) {
  const { filters, update, toggleId, reset, isPending } = useFilterNav(region);
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const activeCount = activeFilterCount(filters);

  return (
    <div className="space-y-5">
      {/* ── Nível 1 ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        {/* Filme | Série — segmentado, pois são mutuamente exclusivos */}
        <div
          role="group"
          aria-label="Tipo de conteúdo"
          className="flex rounded-[3px] border border-line-strong p-0.5"
        >
          {(
            [
              ["movie", "Filmes"],
              ["tv", "Séries"],
            ] as [MediaType, string][]
          ).map(([value, label]) => {
            const active = filters.type === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => update({ type: value, genres: [] })}
                className={cn(
                  "h-8 rounded-[2px] px-4 text-xs transition-colors duration-[180ms]",
                  active
                    ? "bg-paper font-semibold text-ink"
                    : "font-medium text-paper-dim hover:text-paper",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />

        {/* Ordenação */}
        <label className="flex items-center gap-2">
          <span className="sr-only">Ordenar por</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              update({ sort: event.target.value as SortValue })
            }
            className="h-9 cursor-pointer rounded-[3px] border border-line-strong bg-ink px-3 text-xs font-medium text-paper transition-colors hover:border-paper-mute"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* Toggle do painel avançado */}
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-[3px] border px-3.5 text-xs font-medium transition-colors duration-[180ms]",
            activeCount > 0
              ? "border-terra text-terra"
              : "border-line-strong text-paper-dim hover:border-paper-mute hover:text-paper",
          )}
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="grid size-4 place-items-center rounded-full bg-terra text-[0.625rem] font-bold text-ink tabular-nums">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="label inline-flex items-center gap-1.5 text-paper-mute transition-colors hover:text-terra"
          >
            <RotateCcw aria-hidden="true" className="size-3" />
            Limpar
          </button>
        )}
      </div>

      {/* ── Providers — a feature central do app ─────────────────── */}
      <div
        role="group"
        aria-label="Filtrar por serviço de streaming"
        className="no-scrollbar fade-r -mx-5 flex gap-2 overflow-x-auto px-5 md:-mx-8 md:px-8"
      >
        {providers.map((provider) => (
          <Chip
            key={provider.id}
            active={filters.providers.includes(provider.id)}
            onClick={() => toggleId("providers", provider.id)}
          >
            {provider.short}
          </Chip>
        ))}
      </div>

      {/* ── Nível 2 — painel avançado ────────────────────────────── */}
      <div
        id={panelId}
        hidden={!expanded}
        className="space-y-5 border-t border-line pt-5"
      >
        <fieldset
          role="group"
          aria-label="Filtrar por gênero"
          className="space-y-2.5"
        >
          <legend className="label text-paper-mute">Gênero</legend>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Chip
                key={genre.id}
                active={filters.genres.includes(genre.id)}
                onClick={() => toggleId("genres", genre.id)}
              >
                {genre.name}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-x-8 gap-y-5">
          <label className="space-y-2.5">
            <span className="label block text-paper-mute">Ano de estreia</span>
            <select
              value={filters.year ?? ""}
              onChange={(event) =>
                update({
                  year: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="h-9 w-40 cursor-pointer rounded-[3px] border border-line-strong bg-ink px-3 text-xs font-medium text-paper transition-colors hover:border-paper-mute"
            >
              <option value="">Qualquer ano</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <fieldset
            role="group"
            aria-label="Filtrar por nota mínima"
            className="space-y-2.5"
          >
            <legend className="label text-paper-mute">Nota mínima</legend>
            <div className="flex gap-2">
              {[6, 7, 8].map((rating) => (
                <Chip
                  key={rating}
                  active={filters.minRating === rating}
                  onClick={() =>
                    update({
                      minRating: filters.minRating === rating ? null : rating,
                    })
                  }
                >
                  {rating}+
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* Anúncio para leitores de tela + contador visual */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "label text-paper-mute transition-opacity duration-200",
          isPending && "opacity-40",
        )}
      >
        {isPending
          ? "Carregando…"
          : `${totalResults.toLocaleString("pt-BR")} ${
              totalResults === 1 ? "título" : "títulos"
            } disponíveis`}
      </p>
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Nome do parâmetro de página. */
  paramName?: string;
}

/**
 * Paginação numérica.
 *
 * Por que não scroll infinito? Três razões:
 *  1. URL compartilhável e estado restaurável ao voltar;
 *  2. acessibilidade — scroll infinito torna o footer inalcançável e
 *     confunde leitores de tela;
 *  3. o TMDB limita a 500 páginas, então "infinito" seria uma mentira.
 *
 * Implementação genérica: preserva TODOS os searchParams atuais e só troca
 * o da página. Assim funciona igual em /descobrir (com filtros) e em /busca
 * (com `q`), sem duplicar lógica.
 *
 * `nav` + `aria-current="page"` é o padrão ARIA correto.
 */
export function Pagination({
  page,
  totalPages,
  paramName = "page",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next <= 1) params.delete(paramName);
    else params.set(paramName, String(next));

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
    });
  };

  const window = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Paginação de resultados"
      className={cn(
        "flex items-center justify-center gap-1.5 transition-opacity",
        isPending && "pointer-events-none opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="grid size-9 place-items-center rounded-[3px] border border-line-strong text-paper-dim transition-colors hover:border-paper hover:text-paper disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>

      {window.map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="label px-1 text-paper-mute"
          >
            ···
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goToPage(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Página ${item}`}
            className={cn(
              "h-9 min-w-9 rounded-[3px] border px-2 text-xs tabular-nums transition-colors",
              item === page
                ? "border-terra bg-terra font-bold text-ink"
                : "border-line-strong font-medium text-paper-dim hover:border-paper hover:text-paper",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
        className="grid size-9 place-items-center rounded-[3px] border border-line-strong text-paper-dim transition-colors hover:border-paper hover:text-paper disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  );
}

/**
 * Gera a janela de páginas: sempre primeira, última, atual e vizinhas,
 * com elipses no meio. Ex.: 1 ··· 7 8 [9] 10 11 ··· 42
 */
function pageWindow(page: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, page]);
  for (let offset = 1; offset <= 2; offset++) {
    if (page - offset > 1) pages.add(page - offset);
    if (page + offset < total) pages.add(page + offset);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("gap");
    result.push(value);
  });

  return result;
}

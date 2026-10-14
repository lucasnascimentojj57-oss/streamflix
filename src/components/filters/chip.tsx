"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends Omit<ComponentProps<"button">, "children"> {
  active: boolean;
  children: React.ReactNode;
}

/**
 * Chip de filtro.
 *
 * Acessibilidade: `aria-pressed` comunica o estado de toggle. O estado
 * ativo é indicado por inversão de cor E por peso de fonte — não apenas
 * por cor, atendendo WCAG 1.4.1.
 *
 * Transição curta (180ms) de propósito: filtros são ações repetidas,
 * e animação longa em interação frequente gera sensação de lentidão.
 */
export function Chip({ active, children, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[3px] border px-3.5 text-xs transition-all duration-[180ms] ease-[var(--ease-in-out-soft)]",
        active
          ? "border-terra bg-terra font-semibold text-ink"
          : "border-line-strong font-medium text-paper-dim hover:border-paper-mute hover:text-paper",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

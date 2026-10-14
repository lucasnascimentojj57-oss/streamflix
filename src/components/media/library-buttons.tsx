"use client";

import { Bookmark, Check } from "lucide-react";
import { useLibrary } from "@/lib/library/provider";
import { LIBRARY_STATUSES, type LibraryStatus } from "@/lib/library/types";
import type { MediaItem } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

/**
 * Botões de status da biblioteca.
 *
 * Dois status mutuamente exclusivos: "Quero assistir" (marcador) e
 * "Já assisti" (check). Clicar no status ativo remove o título da lista.
 *
 * Acessibilidade:
 *  - cada botão é um toggle com `aria-pressed` (padrão correto para
 *    alternância, não `aria-checked`, que é de checkbox/radio);
 *  - os botões são irmãos do link do card (nunca dentro dele) — botão
 *    dentro de link é HTML inválido e quebra a navegação por teclado;
 *  - no overlay, ficam sempre visíveis em telas sem hover (touch) e
 *    aparecem no hover/foco em telas com ponteiro.
 */

const LABELS: Record<LibraryStatus, { idle: string; active: string; short: string }> =
  {
    want: {
      idle: "Quero assistir",
      active: "Na lista: quero assistir",
      short: "Quero assistir",
    },
    watched: {
      idle: "Já assisti",
      active: "Na lista: já assisti",
      short: "Já assisti",
    },
  };

const ICONS = {
  want: Bookmark,
  watched: Check,
} as const;

interface LibraryButtonsProps {
  item: MediaItem;
  className?: string;
  /** `overlay` sobre o pôster; `inline` nas barras de ação (detalhes). */
  variant?: "overlay" | "inline";
}

export function LibraryButtons({
  item,
  className,
  variant = "overlay",
}: LibraryButtonsProps) {
  const { statusOf, toggleStatus } = useLibrary();
  const current = statusOf(item);

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {LIBRARY_STATUSES.map((status) => (
          <InlineButton
            key={status}
            status={status}
            active={current === status}
            title={item.title}
            onToggle={() => toggleStatus(item, status)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("absolute right-2 top-2 z-20 flex flex-col gap-1.5", className)}>
      {LIBRARY_STATUSES.map((status) => (
        <OverlayButton
          key={status}
          status={status}
          active={current === status}
          title={item.title}
          onToggle={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleStatus(item, status);
          }}
        />
      ))}
    </div>
  );
}

function OverlayButton({
  status,
  active,
  title,
  onToggle,
}: {
  status: LibraryStatus;
  active: boolean;
  title: string;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const Icon = ICONS[status];
  const label = LABELS[status];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={
        active
          ? `Remover ${title} de "${label.short}"`
          : `Marcar ${title} como "${label.short}"`
      }
      className={cn(
        "grid size-9 place-items-center rounded-[3px] backdrop-blur-md transition-all duration-200",
        // Mostra no hover/foco em telas com ponteiro; sempre visível no touch.
        "bg-ink/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        "focus-visible:opacity-100",
        active
          ? "text-terra md:opacity-100"
          : "text-paper hover:bg-ink hover:text-terra",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-4", active && "fill-current")} />
    </button>
  );
}

function InlineButton({
  status,
  active,
  title,
  onToggle,
}: {
  status: LibraryStatus;
  active: boolean;
  title: string;
  onToggle: () => void;
}) {
  const Icon = ICONS[status];
  const label = LABELS[status];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-[3px] border px-4 text-sm font-medium transition-all duration-200",
        active
          ? "border-terra bg-terra/10 text-terra"
          : "border-line-strong text-paper hover:border-paper",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-4", active && "fill-current")} />
      <span className="sr-only">
        {active ? `${title}: ` : ""}
      </span>
      {active ? label.active : label.idle}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { REGIONS, type RegionCode } from "@/lib/region";
import { useRegion } from "@/lib/use-region";
import { cn } from "@/lib/utils";
import { RegionFlag } from "./region-flag";

/**
 * Seletor de região.
 *
 * Trocar de país muda o que está disponível nos streamings e quais
 * serviços aparecem — não o idioma da interface, que continua em português.
 *
 * A escolha é gravada em cookie (`useRegion`) e depois chamamos
 * `router.refresh()` para os Server Components refazerem o fetch na nova
 * região, sem reload completo e sem perder o scroll.
 *
 * Acessibilidade: `button` com `aria-expanded`/`aria-haspopup`, fecha com
 * `Esc` e clique fora, foco retorna ao gatilho — mesmo padrão do menu de conta.
 */
export function RegionSelector({ region }: { region: RegionCode }) {
  const router = useRouter();
  const { region: current, setRegion } = useRegion(region);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = REGIONS.find((r) => r.code === current);
  if (!active) return null;

  const choose = (code: RegionCode) => {
    setOpen(false);
    if (code === current) return;
    setRegion(code);
    // Refaz a busca dos Server Components com a nova região.
    router.refresh();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Região: ${active.label}. Trocar região.`}
        className={cn(
          "label inline-flex h-10 items-center gap-2 rounded-[3px] px-2.5 transition-colors duration-200",
          open
            ? "bg-ink-raised text-paper"
            : "text-paper-dim hover:bg-ink-raised hover:text-paper",
        )}
      >
        <RegionFlag
          code={active.code}
          className="h-3.5 w-5 shrink-0 rounded-[1px]"
        />
        {active.code}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-rise rounded-[3px] border border-line-strong bg-ink-overlay p-1.5 shadow-2xl shadow-black/60">
          <p className="label mb-1 px-3 py-2 text-paper-mute">
            Disponibilidade em
          </p>

          <ul>
            {REGIONS.map((option) => {
              const selected = option.code === current;
              return (
                <li key={option.code}>
                  <button
                    type="button"
                    onClick={() => choose(option.code)}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[2px] px-3 py-2.5 text-left text-sm transition-colors duration-150",
                      selected
                        ? "bg-ink-raised text-paper"
                        : "text-paper-dim hover:bg-ink-raised hover:text-paper",
                    )}
                  >
                    <RegionFlag
                      code={option.code}
                      className="h-3.5 w-5 shrink-0 rounded-[1px]"
                    />
                    <span className="flex-1">{option.label}</span>
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-terra"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="px-3 py-2 text-[0.6875rem] leading-relaxed text-paper-mute">
            Muda o catálogo e os serviços. O idioma continua em português.
          </p>
        </div>
      )}
    </div>
  );
}

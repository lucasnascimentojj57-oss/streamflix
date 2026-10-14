"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Campo de busca com debounce.
 *
 * Decisões de performance:
 *  - debounce de 400ms: digitar "interestelar" dispararia 12 requisições
 *    sem isso. 400ms é o ponto onde a busca parece instantânea mas não
 *    reage a cada tecla.
 *  - `router.replace` em vez de `push`: a digitação não deve poluir o
 *    histórico com 12 entradas; o botão voltar precisa sair da busca.
 *  - `useTransition` mantém o input responsivo durante o refetch.
 *
 * Acessibilidade: `role="search"` no form, label associado ao input
 * (visualmente oculto) e o botão de limpar tem aria-label.
 */
export function SearchInput({
  autoFocus = false,
  className,
}: {
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Sincroniza quando a URL muda por fora (botão voltar, link direto).
   *
   * Padrão oficial do React para "ajustar estado quando uma prop muda":
   * comparar com o valor anterior DURANTE o render, em vez de usar um
   * efeito. Um efeito aqui causaria um render em cascata (o input
   * apareceria com o texto antigo por um frame antes de corrigir).
   */
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setValue(initial);
  }

  useEffect(() => {
    // Nada a fazer se o valor já reflete a URL.
    if (value === initial) return;

    const timeout = setTimeout(() => {
      const trimmed = value.trim();
      startTransition(() => {
        router.replace(
          trimmed ? `/busca?q=${encodeURIComponent(trimmed)}` : "/busca",
          { scroll: false },
        );
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [value, initial, router]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (trimmed) router.push(`/busca?q=${encodeURIComponent(trimmed)}`);
      }}
      className={cn("relative", className)}
    >
      <label htmlFor="site-search" className="sr-only">
        Buscar filmes e séries
      </label>

      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors",
          isPending ? "animate-pulse text-terra" : "text-paper-mute",
        )}
      />

      <input
        ref={inputRef}
        id="site-search"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar títulos…"
        autoComplete="off"
        className="h-11 w-full rounded-[3px] border border-line-strong bg-ink-raised pl-10 pr-10 text-sm text-paper transition-colors duration-200 placeholder:text-paper-mute hover:border-paper-mute focus:border-terra focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          aria-label="Limpar busca"
          className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[2px] text-paper-mute transition-colors hover:bg-ink-overlay hover:text-paper"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </form>
  );
}

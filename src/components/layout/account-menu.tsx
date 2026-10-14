"use client";

import Link from "next/link";
import { Cloud, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useLibrary } from "@/lib/library/provider";
import { cn } from "@/lib/utils";

/**
 * Menu de conta no header.
 *
 * Três estados:
 *  1. Supabase não configurado → nada é renderizado (não há como logar).
 *  2. Deslogado → link "Entrar".
 *  3. Logado → avatar com menu (e-mail + sair).
 *
 * Acessibilidade: o menu é um `button` com `aria-expanded`/`aria-haspopup`,
 * fecha com `Esc` e com clique fora, e o foco volta ao gatilho. É o padrão
 * de disclosure — mais simples e mais robusto que um `role="menu"` completo,
 * que exigiria navegação por setas para ser correto.
 */
export function AccountMenu() {
  const { user } = useLibrary();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fecha ao clicar fora ou pressionar Esc.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  // Sem Supabase configurado não há como logar, então nem mostramos o
  // gatilho. Usamos `isSupabaseConfigured()` (que lê variáveis NEXT_PUBLIC_*,
  // idênticas no servidor e no cliente) em vez de `typeof window`, que
  // divergiria entre os dois e causaria erro de hidratação.
  if (!isSupabaseConfigured()) return null;

  if (!user) {
    return (
      <Link
        href="/entrar"
        className="label inline-flex h-10 items-center gap-2 rounded-[3px] px-3 text-paper-dim transition-colors duration-200 hover:bg-ink-raised hover:text-paper"
      >
        <UserRound aria-hidden="true" className="size-[1.1rem]" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  }

  const initial = (user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "grid size-10 place-items-center rounded-[3px] transition-colors duration-200",
          open
            ? "bg-ink-raised text-paper"
            : "text-paper-dim hover:bg-ink-raised hover:text-paper",
        )}
      >
        <span className="sr-only">
          Conta de {user.email}. Sua lista está sincronizada na nuvem.
        </span>
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-terra text-xs font-bold text-ink"
        >
          {initial}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-rise rounded-[3px] border border-line-strong bg-ink-overlay p-1.5 shadow-2xl shadow-black/60">
          <div className="border-b border-line px-3 py-3">
            <p className="label mb-1.5 text-paper-mute">Conectado como</p>
            <p className="truncate text-sm text-paper" title={user.email ?? ""}>
              {user.email}
            </p>
          </div>

          <p className="flex items-center gap-2 px-3 py-3 text-xs text-paper-dim">
            <Cloud aria-hidden="true" className="size-3.5 text-terra" />
            Lista sincronizada entre dispositivos
          </p>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-[2px] px-3 py-2.5 text-left text-sm text-paper-dim transition-colors duration-150 hover:bg-ink-raised hover:text-paper"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sair da conta
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

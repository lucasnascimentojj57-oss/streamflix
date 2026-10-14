"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Search } from "lucide-react";
import type { RegionCode } from "@/lib/region";
import { useLibrary } from "@/lib/library/provider";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { RegionSelector } from "./region-selector";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/descobrir", label: "Descobrir" },
];

/**
 * Header.
 *
 * Decisão de layout: assimétrico — logotipo à esquerda com peso
 * tipográfico forte, navegação colada nele (não centralizada), e as
 * ações empurradas ao extremo direito. Evita o "header de template"
 * com nav perfeitamente centralizada.
 *
 * Acessibilidade: `aria-current="page"` marca a rota ativa, e o
 * contador da lista tem texto alternativo descritivo.
 */
export function Header({ region }: { region: RegionCode }) {
  const pathname = usePathname();
  const { counts } = useLibrary();
  const count = counts.total;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-4 px-5 sm:gap-8 md:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-baseline gap-px"
          aria-label="StreamFlix — início"
        >
          <span className="font-display text-xl leading-none tracking-tight text-paper">
            stream
          </span>
          <span className="font-display text-xl leading-none tracking-tight text-terra">
            flix
          </span>
          <span
            aria-hidden="true"
            className="ml-1 size-1 rounded-full bg-terra transition-transform duration-300 group-hover:scale-[1.8]"
          />
        </Link>

        <nav aria-label="Navegação principal" className="hidden sm:block">
          <ul className="flex items-center gap-6">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "label relative py-2 transition-colors duration-200",
                      active
                        ? "text-paper"
                        : "text-paper-mute hover:text-paper",
                    )}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-px left-0 h-0.5 w-full bg-terra"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/busca"
            aria-label="Buscar títulos"
            className={cn(
              "grid size-10 place-items-center rounded-[3px] transition-colors duration-200",
              pathname.startsWith("/busca")
                ? "text-terra"
                : "text-paper-dim hover:bg-ink-raised hover:text-paper",
            )}
          >
            <Search aria-hidden="true" className="size-[1.1rem]" />
          </Link>

          <Link
            href="/minha-lista"
            className={cn(
              "relative grid size-10 place-items-center rounded-[3px] transition-colors duration-200",
              pathname.startsWith("/minha-lista")
                ? "text-terra"
                : "text-paper-dim hover:bg-ink-raised hover:text-paper",
            )}
          >
            <Bookmark aria-hidden="true" className="size-[1.1rem]" />
            <span className="sr-only">
              Minha lista
              {count > 0
                ? `, ${count} ${count === 1 ? "título salvo" : "títulos salvos"}`
                : ", vazia"}
            </span>
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-terra px-1 text-[0.5625rem] font-bold leading-4 text-ink tabular-nums"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <AccountMenu />
          <RegionSelector region={region} />
        </div>
      </div>
    </header>
  );
}

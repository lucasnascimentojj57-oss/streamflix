"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library/provider";

/**
 * Abas de navegação — URL como fonte da verdade.
 *
 * Tabs são LINKS, não botões com estado local: cada aba tem sua própria
 * URL. Isso dá compartilhamento, botão voltar funcional e pré-busca, de
 * graça — o mesmo princípio dos filtros do catálogo.
 *
 * A primeira aba ("Início") só aparece na home; nas páginas pessoais
 * listamos apenas as duas listas de status.
 *
 * Acessibilidade: `role="tablist"` com `aria-current` na aba ativa.
 * O rótulo de cada aba inclui a contagem como texto de apoio (não
 * apenas um número solto), para o leitor de tela anunciar o contexto.
 */

export type TabsVariant = "home" | "library";

const HOME_TABS = [
  { key: "inicio", label: "Início" },
  { key: "quero", label: "Quero assistir" },
  { key: "assistidos", label: "Já assisti" },
] as const;

const LIBRARY_TABS = [
  { key: "quero", label: "Quero assistir" },
  { key: "assistidos", label: "Já assisti" },
] as const;

interface LibraryTabsProps {
  active: string;
  /** Rota base dos links. Na home é `/`; na lista é `/minha-lista`. */
  base: string;
  variant?: TabsVariant;
  className?: string;
}

export function LibraryTabs({
  active,
  base,
  variant = "library",
  className,
}: LibraryTabsProps) {
  const searchParams = useSearchParams();
  const { counts, loading, user } = useLibrary();

  const tabs = variant === "home" ? HOME_TABS : LIBRARY_TABS;

  const countFor = (key: string) =>
    key === "quero" ? counts.want : key === "assistidos" ? counts.watched : null;

  return (
    <div
      role="tablist"
      aria-label="Listas"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-line pb-px",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const count = countFor(tab.key);

        // Preserva outros searchParams (úteis na home: o hero/aba atual),
        // mas nunca arrasta `aba` para outra aba.
        const params = new URLSearchParams(searchParams.toString());
        params.delete("aba");

        const isHomeDefault = base === "/" && tab.key === "inicio";
        if (!isHomeDefault) params.set("aba", tab.key);

        const query = params.toString();
        const href = `${base}${query ? `?${query}` : ""}`;

        return (
          <Link
            key={tab.key}
            href={href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-200",
              isActive ? "text-paper" : "text-paper-mute hover:text-paper",
            )}
          >
            {tab.label}
            {count !== null && !loading && (
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[0.625rem] font-bold tabular-nums",
                  isActive
                    ? "bg-terra text-ink"
                    : "bg-ink-raised text-paper-mute",
                )}
              >
                {count > 999 ? "999+" : count}
              </span>
            )}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-0.5 w-full bg-terra"
              />
            )}
          </Link>
        );
      })}

      {/* Dica de sincronização — só quando há contas disponíveis e o
          usuário não está logado (a lista viveria só neste navegador). */}
      {!user && !loading && counts.total > 0 && (
        <Link
          href="/entrar"
          className="ml-auto hidden shrink-0 items-center gap-1.5 self-center pr-1 text-xs text-paper-mute transition-colors hover:text-terra sm:flex"
        >
          Sincronizar entre dispositivos →
        </Link>
      )}
    </div>
  );
}

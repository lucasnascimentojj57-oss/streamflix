"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { LibraryTabs } from "./library-tabs";
import { LibraryView } from "./library-view";

export const HOME_TABS = ["inicio", "quero", "assistidos"] as const;

/**
 * Abas da home.
 *
 * Por que um componente client recebendo as trilhas como `catalog` (em vez
 * de a página ler `?aba=` no servidor)? Porque ler `searchParams` no servidor
 * tornaria a home DINÂMICA, perdendo o HTML estático com `revalidate` de 1h —
 * justamente a otimização que faz a página mais visitada abrir instantânea.
 *
 * Aqui a página continua estática: as trilhas (Server Components) chegam
 * prontas como prop, e a escolha da aba acontece no cliente a partir da URL.
 * Trocar de aba é navegação, não refetch.
 */
export function HomeTabs({ catalog }: { catalog: ReactNode }) {
  const searchParams = useSearchParams();
  const aba = searchParams.get("aba");

  const activeTab =
    aba === "quero" || aba === "assistidos" ? aba : "inicio";

  return (
    <>
      <LibraryTabs active={activeTab} base="/" variant="home" />

      <div className="mt-12">
        {activeTab === "inicio" ? (
          catalog
        ) : (
          <LibraryView
            status={activeTab === "assistidos" ? "watched" : "want"}
          />
        )}
      </div>
    </>
  );
}

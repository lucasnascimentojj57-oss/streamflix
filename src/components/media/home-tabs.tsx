"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useLibrary } from "@/lib/library/provider";
import { LibraryTabs } from "./library-tabs";
import { LibraryView } from "./library-view";
import { SignInPrompt } from "./sign-in-prompt";

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
 *
 * As abas pessoais exigem conta. Sem sessão, `LibraryView` mostraria uma
 * lista vazia — que o usuário leria como "eu não salvei nada", não como
 * "falta entrar". Por isso trocamos o convite ao login no lugar da grade.
 */
export function HomeTabs({ catalog }: { catalog: ReactNode }) {
  const searchParams = useSearchParams();
  const { user, loading } = useLibrary();
  const aba = searchParams.get("aba");

  const activeTab = aba === "quero" || aba === "assistidos" ? aba : "inicio";

  const isWatched = activeTab === "assistidos";
  const needsSignIn = activeTab !== "inicio" && !loading && !user;

  return (
    <>
      <LibraryTabs active={activeTab} base="/" variant="home" />

      <div className="mt-12">
        {activeTab === "inicio" ? (
          catalog
        ) : needsSignIn ? (
          <SignInPrompt
            next={isWatched ? "/?aba=assistidos" : "/?aba=quero"}
            title={
              isWatched
                ? "Entre para ver o que você já assistiu"
                : "Entre para ver o que você quer assistir"
            }
          />
        ) : (
          <LibraryView status={isWatched ? "watched" : "want"} />
        )}
      </div>
    </>
  );
}

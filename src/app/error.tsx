"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Boundary de erro da aplicação.
 *
 * Distinguimos dois casos porque a ação útil é diferente:
 *  - falta de configuração (token ausente) → o usuário precisa de instrução;
 *  - falha de rede/API → basta tentar de novo.
 *
 * `error.digest` é o identificador do erro no servidor — mostramos para
 * que o usuário possa reportar algo rastreável.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[streamflix]", error);
  }, [error]);

  const isConfigError = error.message.includes("TMDB_ACCESS_TOKEN");

  return (
    <div className="mx-auto flex max-w-[1680px] flex-col items-start px-5 py-32 md:px-8">
      <p className="label mb-6 text-terra">
        {isConfigError ? "Configuração pendente" : "Algo deu errado"}
      </p>

      <h1 className="font-display text-display text-balance text-paper">
        {isConfigError
          ? "Falta a chave da API"
          : "Não conseguimos carregar o catálogo"}
      </h1>

      <p className="mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-paper-dim">
        {isConfigError ? (
          <>
            Crie um arquivo <code className="rounded bg-ink-raised px-1.5 py-0.5 font-mono text-xs text-terra">.env.local</code>{" "}
            na raiz do projeto com o seu token do TMDB e reinicie o servidor.
            O passo a passo está no <strong className="text-paper">README.md</strong>.
          </>
        ) : (
          "Pode ser uma instabilidade momentânea na API do TMDB ou na sua conexão. Tente novamente."
        )}
      </p>

      {error.digest && (
        <p className="label mt-6 text-paper-mute">
          Referência: {error.digest}
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        {!isConfigError && <Button onClick={reset}>Tentar novamente</Button>}
        <ButtonLink href="/" variant="outline">
          Voltar ao início
        </ButtonLink>
      </div>
    </div>
  );
}

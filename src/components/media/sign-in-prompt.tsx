"use client";

import { LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Convite para entrar quando uma área exige conta.
 *
 * Usado nas abas pessoais da home. Ali o redirecionamento automático seria
 * agressivo: a home é a página de entrada, e jogar o visitante para o login
 * só porque ele clicou na aba "Quero assistir" quebra a exploração. Em vez
 * disso explicamos por que a lista está indisponível e oferecemos o caminho.
 *
 * Em `/minha-lista`, que é uma página dedicada à coleção, o redirecionamento
 * acontece no servidor — não há nada de útil para mostrar sem sessão.
 *
 * `next` preserva o destino (com a aba atual) para voltar exatamente ao ponto
 * de partida depois do login.
 */
export function SignInPrompt({
  next,
  title,
  description,
}: {
  next: string;
  title: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={<LockKeyhole className="size-6" />}
      title={title}
      description={
        description ??
        "Sua lista fica salva na sua conta e acompanha você em qualquer dispositivo. Entre ou crie uma conta gratuita para continuar."
      }
      action={
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink
            href={`/entrar?next=${encodeURIComponent(next)}`}
            size="sm"
          >
            Entrar
          </ButtonLink>
          <ButtonLink
            href={`/criar-conta?next=${encodeURIComponent(next)}`}
            variant="ghost"
            size="sm"
          >
            Criar conta
          </ButtonLink>
        </div>
      }
    />
  );
}

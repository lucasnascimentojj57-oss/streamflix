"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { AuthNotConfigured } from "./auth-not-configured";
import { FormField } from "./form-field";

const INITIAL: AuthActionState = { status: "idle" };

/**
 * Formulário para definir a nova senha.
 *
 * Só é acessível com uma sessão válida — criada pelo callback quando o
 * usuário clica no link de recuperação. Sem sessão, a action devolve um
 * erro explicando que o link expirou.
 */
export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    updatePassword,
    INITIAL,
  );

  if (!configured) return <AuthNotConfigured />;

  return (
    <form
      action={formAction}
      className="rounded-[3px] border border-line bg-ink-raised p-7"
    >
      <h2 className="font-display text-xl text-paper">Definir nova senha</h2>

      <p className="mt-2 text-sm leading-relaxed text-paper-dim">
        Escolha uma senha nova para a sua conta.
      </p>

      <div className="mt-7 space-y-5">
        <FormField
          label="Nova senha"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 6 caracteres"
          icon={Lock}
          minLength={6}
          autoFocus
          error={
            state.status === "error" && state.field === "password"
              ? state.message
              : undefined
          }
        />

        <FormField
          label="Confirme a nova senha"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          icon={Lock}
          minLength={6}
          error={
            state.status === "error" && state.field === "confirm"
              ? state.message
              : undefined
          }
        />
      </div>

      {state.status === "error" && !state.field && (
        <p
          role="alert"
          className="mt-5 rounded-[3px] border border-terra/40 bg-terra/[0.07] px-3.5 py-3 text-xs leading-relaxed text-terra"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-6 w-full" size="lg">
        {pending ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}

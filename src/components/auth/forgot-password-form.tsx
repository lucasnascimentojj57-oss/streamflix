"use client";

import Link from "next/link";
import { Mail, MailCheck } from "lucide-react";
import { useActionState } from "react";
import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { AuthNotConfigured } from "./auth-not-configured";
import { FormField } from "./form-field";

const INITIAL: AuthActionState = { status: "idle" };

/**
 * Formulário de recuperação de senha.
 *
 * A resposta de sucesso é sempre a mesma, exista ou não a conta — isso
 * evita que alguém descubra quais e-mails estão cadastrados.
 */
export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    requestPasswordReset,
    INITIAL,
  );

  if (!configured) return <AuthNotConfigured />;

  if (state.status === "success") {
    return (
      <div
        aria-live="polite"
        className="rounded-[3px] border border-terra/30 bg-terra/[0.06] p-7"
      >
        <div className="mb-5 grid size-11 place-items-center rounded-[3px] border border-terra/30 bg-terra/10 text-terra">
          <MailCheck aria-hidden="true" className="size-5" />
        </div>

        <h2 className="font-display text-xl text-paper">Verifique seu e-mail</h2>

        <p className="mt-3 text-sm leading-relaxed text-paper-dim">
          {state.message}
        </p>

        <p className="label mt-6 border-t border-line pt-5 text-paper-mute">
          O link expira em 1 hora.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-[3px] border border-line bg-ink-raised p-7"
    >
      <h2 className="font-display text-xl text-paper">Recuperar senha</h2>

      <p className="mt-2 text-sm leading-relaxed text-paper-dim">
        Informe seu e-mail e enviaremos um link para você definir uma nova
        senha.
      </p>

      <div className="mt-7">
        <FormField
          label="Seu e-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          icon={Mail}
          autoFocus
          error={
            state.status === "error" && state.field === "email"
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
        {pending ? "Enviando…" : "Enviar link"}
      </Button>

      <p className="mt-5 text-center text-xs text-paper-dim">
        Lembrou a senha?{" "}
        <Link
          href="/entrar"
          className="text-terra underline underline-offset-4 hover:text-terra-soft"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}

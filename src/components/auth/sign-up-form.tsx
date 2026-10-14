"use client";

import Link from "next/link";
import { Mail, Lock, MailCheck } from "lucide-react";
import { useActionState } from "react";
import { signUp, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { AuthNotConfigured } from "./auth-not-configured";
import { FormField } from "./form-field";

const INITIAL: AuthActionState = { status: "idle" };

/**
 * Formulário de criação de conta (e-mail + senha).
 *
 * Se a confirmação por e-mail estiver desativada no painel do Supabase, o
 * cadastro já devolve sessão e o usuário entra direto (a action redireciona).
 * Se estiver ativada, mostramos o aviso de confirmação.
 */
export function SignUpForm({
  configured,
  next,
}: {
  configured: boolean;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signUp,
    INITIAL,
  );

  if (!configured) return <AuthNotConfigured />;

  // Cadastro feito, mas confirmação por e-mail ativada.
  if (state.status === "success") {
    return (
      <div
        aria-live="polite"
        className="rounded-[3px] border border-terra/30 bg-terra/[0.06] p-7"
      >
        <div className="mb-5 grid size-11 place-items-center rounded-[3px] border border-terra/30 bg-terra/10 text-terra">
          <MailCheck aria-hidden="true" className="size-5" />
        </div>

        <h2 className="font-display text-xl text-paper">
          Confirme seu e-mail
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-paper-dim">
          {state.message}
        </p>

        <p className="label mt-6 border-t border-line pt-5 text-paper-mute">
          Não chegou? Verifique o spam.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-[3px] border border-line bg-ink-raised p-7"
    >
      <h2 className="font-display text-xl text-paper">Criar conta</h2>

      <p className="mt-2 text-sm leading-relaxed text-paper-dim">
        Leva menos de um minuto. Suas listas passam a acompanhar você em
        qualquer dispositivo.
      </p>

      {/* Leva o destino adiante: quem veio de "/?aba=quero" volta para lá
          depois de criar a conta, em vez de cair sempre em /minha-lista. */}
      {next && <input type="hidden" name="next" value={next} />}

      <div className="mt-7 space-y-5">
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

        <FormField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 6 caracteres"
          icon={Lock}
          minLength={6}
          error={
            state.status === "error" && state.field === "password"
              ? state.message
              : undefined
          }
        />

        <FormField
          label="Confirme a senha"
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
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="mt-5 text-center text-xs text-paper-dim">
        Já tem conta?{" "}
        <Link
          href={
            next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar"
          }
          className="text-terra underline underline-offset-4 hover:text-terra-soft"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { useActionState } from "react";
import { signIn, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { AuthNotConfigured } from "./auth-not-configured";
import { FormField } from "./form-field";

interface SignInFormProps {
  configured: boolean;
  initialError?: string;
  next?: string;
}

const INITIAL: AuthActionState = { status: "idle" };

/**
 * Formulário de login por e-mail e senha.
 *
 * Usa `useActionState` (React 19) para lidar com o estado da Server Action
 * sem `useState` manual nem `fetch`. O erro é anunciado com `role="alert"`
 * no campo correspondente; o botão fica `disabled` durante o envio.
 */
export function SignInForm({ configured, initialError, next }: SignInFormProps) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signIn,
    initialError ? { status: "error", message: initialError } : INITIAL,
  );

  if (!configured) return <AuthNotConfigured />;

  return (
    <form
      action={formAction}
      className="rounded-[3px] border border-line bg-ink-raised p-7"
    >
      <h2 className="font-display text-xl text-paper">Entrar</h2>

      <p className="mt-2 text-sm leading-relaxed text-paper-dim">
        Acesse para levar suas listas a qualquer dispositivo.
      </p>

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

        <div className="space-y-2.5">
          <FormField
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            icon={Lock}
            minLength={6}
            error={
              state.status === "error" && state.field === "password"
                ? state.message
                : undefined
            }
          />

          <Link
            href="/recuperar-senha"
            className="inline-block text-xs text-paper-dim underline-offset-4 transition-colors hover:text-terra hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      {/* Erro sem campo específico (ex.: credenciais inválidas) */}
      {state.status === "error" && !state.field && (
        <p
          role="alert"
          className="mt-5 rounded-[3px] border border-terra/40 bg-terra/[0.07] px-3.5 py-3 text-xs leading-relaxed text-terra"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-6 w-full" size="lg">
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="mt-5 text-center text-xs text-paper-dim">
        Ainda não tem conta?{" "}
        <Link
          href="/criar-conta"
          className="text-terra underline underline-offset-4 hover:text-terra-soft"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}

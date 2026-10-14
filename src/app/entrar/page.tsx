import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getServerUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre para levar suas listas a qualquer dispositivo.",
};

/**
 * Página de login.
 *
 * Server Component: verifica a sessão no servidor e redireciona quem já
 * está logado. Fazer essa checagem no cliente causaria um flash da tela
 * de login para usuários autenticados.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>;
}) {
  const params = await searchParams;

  const user = await getServerUser();
  if (user) {
    // Saneia o destino — um `next` absoluto seria open redirect.
    const next =
      params.next?.startsWith("/") && !params.next.startsWith("//")
        ? params.next
        : "/minha-lista";
    redirect(next);
  }

  return (
    <AuthLayout
      eyebrow="Sua conta"
      title="Leve suas listas com você"
      description="Sem conta, tudo fica salvo apenas neste navegador. Entrando, o que você marcou como quero assistir e já assisti acompanha você em qualquer dispositivo — e o que já está aqui é migrado automaticamente."
      bullets={[
        "Acesso por e-mail e senha",
        "Suas listas atuais são preservadas",
        "Você pode sair quando quiser, sem perder nada",
      ]}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href="/criar-conta"
            className="text-terra underline underline-offset-4 hover:text-terra-soft"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <SignInForm
        configured={isSupabaseConfigured()}
        initialError={params.erro}
        next={params.next}
      />
    </AuthLayout>
  );
}

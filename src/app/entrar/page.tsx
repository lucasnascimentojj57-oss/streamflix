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
      description="Entre para guardar o que você quer assistir e marcar o que já assistiu. Suas listas ficam salvas na sua conta e acompanham você em qualquer dispositivo — nada se perde ao trocar de navegador ou de aparelho."
      bullets={[
        "Acesso por e-mail e senha",
        "Suas listas sincronizadas em todos os dispositivos",
        "Você pode sair quando quiser, sem perder nada",
      ]}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href={
              params.next
                ? `/criar-conta?next=${encodeURIComponent(params.next)}`
                : "/criar-conta"
            }
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

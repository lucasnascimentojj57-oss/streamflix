import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getServerUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Crie uma conta para sincronizar suas listas entre dispositivos.",
};

/** Página de criação de conta (e-mail + senha). */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  const user = await getServerUser();
  if (user) {
    // Mesma sanitizacão do login: só caminhos relativos são aceitos.
    redirect(
      params.next?.startsWith("/") && !params.next.startsWith("//")
        ? params.next
        : "/minha-lista",
    );
  }

  return (
    <AuthLayout
      eyebrow="Comece agora"
      title="Crie sua conta"
      description="Com uma conta, tudo o que você marcar como quero assistir ou já assisti fica salvo na sua conta e disponível em qualquer aparelho."
      bullets={[
        "Basta um e-mail e uma senha",
        "Suas listas em todos os dispositivos",
        "Sem anúncios e sem compartilhar dados com terceiros",
      ]}
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href={
              params.next
                ? `/entrar?next=${encodeURIComponent(params.next)}`
                : "/entrar"
            }
            className="text-terra underline underline-offset-4 hover:text-terra-soft"
          >
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm configured={isSupabaseConfigured()} next={params.next} />
    </AuthLayout>
  );
}

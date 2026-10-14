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
export default async function SignUpPage() {
  const user = await getServerUser();
  if (user) redirect("/minha-lista");

  return (
    <AuthLayout
      eyebrow="Comece agora"
      title="Crie sua conta"
      description="Com uma conta, tudo o que você marcar como quero assistir ou já assisti fica salvo na nuvem e disponível em qualquer aparelho. O que você já tem neste navegador é migrado na hora."
      bullets={[
        "Basta um e-mail e uma senha",
        "Suas listas atuais sobem automaticamente",
        "Sem anúncios e sem compartilhar dados com terceiros",
      ]}
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href="/entrar"
            className="text-terra underline underline-offset-4 hover:text-terra-soft"
          >
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm configured={isSupabaseConfigured()} />
    </AuthLayout>
  );
}

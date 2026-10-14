import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Receba um link para redefinir sua senha.",
};

/** Página de recuperação de senha. */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Sua conta"
      title="Esqueceu a senha?"
      description="Informe o e-mail da sua conta e enviaremos um link para você criar uma senha nova. Por segurança, não informamos se um e-mail está cadastrado ou não."
      bullets={[
        "O link chega no seu e-mail em instantes",
        "Ele expira em 1 hora, por segurança",
        "Depois de definir a nova senha, você entra direto",
      ]}
      footer={
        <>
          Lembrou a senha?{" "}
          <Link
            href="/entrar"
            className="text-terra underline underline-offset-4 hover:text-terra-soft"
          >
            Entrar
          </Link>
        </>
      }
    >
      <ForgotPasswordForm configured={isSupabaseConfigured()} />
    </AuthLayout>
  );
}

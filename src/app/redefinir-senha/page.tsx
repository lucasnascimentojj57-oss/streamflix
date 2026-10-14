import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Definir nova senha",
  description: "Escolha uma nova senha para a sua conta.",
};

/**
 * Página de redefinição de senha.
 *
 * Exige sessão: quem chega aqui veio do link de recuperação, e o callback
 * já trocou o código por uma sessão. Sem sessão, mandamos para a tela de
 * pedir um novo link — evita um formulário que sempre falharia.
 */
export default async function ResetPasswordPage() {
  const user = await getServerUser();
  if (!isSupabaseConfigured() || !user) redirect("/recuperar-senha");

  return (
    <AuthLayout
      eyebrow="Quase lá"
      title="Defina sua nova senha"
      description="Você acessou por um link de recuperação válido. Escolha uma senha nova para voltar a entrar na sua conta."
      bullets={[
        "Use pelo menos 6 caracteres",
        "Uma senha só sua — evite reutilizar de outros sites",
      ]}
    >
      <ResetPasswordForm configured={isSupabaseConfigured()} />
    </AuthLayout>
  );
}

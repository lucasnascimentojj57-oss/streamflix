"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server Actions de autenticação por e-mail e senha.
 *
 * Por que Server Actions e não chamadas diretas do cliente?
 *  - O `origin` dos links (confirmação de conta, recuperação de senha)
 *    precisa ser confiável. Se o cliente enviasse a URL de retorno, um
 *    atacante poderia redirecionar o link para o próprio domínio e capturar
 *    o token. Aqui derivamos o origin dos headers da requisição, no servidor.
 *  - As mensagens do Supabase são traduzidas para português em um lugar só.
 *
 * A senha NUNCA é registrada em log nem ecoada de volta ao cliente.
 */

export interface AuthActionState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Campo que causou o erro, para o formulário marcar o certo. */
  field?: "email" | "password" | "confirm";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mínimo aceito pelo Supabase, replicado aqui para mensagem antecipada. */
const MIN_PASSWORD = 6;

/**
 * Normaliza o destino pós-login.
 *
 * Só aceitamos caminhos relativos — um `next` absoluto seria um open
 * redirect: o atacante usaria nosso domínio para levar o usuário a um site
 * malicioso logo depois do login, quando ele está mais confiante.
 */
function safeNext(raw: string): string {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/minha-lista";
}

/** Origin confiável, derivado dos headers (nunca do cliente). */
async function getOrigin() {
  const headerList = await headers();
  return (
    headerList.get("origin") ??
    `http://${headerList.get("host") ?? "localhost:3000"}`
  );
}

/**
 * Traduz erros do Supabase sem vazar detalhes úteis a atacantes.
 *
 * Nota: em login, nunca dizemos "esse e-mail não existe" — isso permitiria
 * enumerar contas. A resposta é sempre genérica.
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.";
  }
  if (m.includes("user already registered")) {
    return "Já existe uma conta com esse e-mail. Tente entrar.";
  }
  if (m.includes("password should be at least")) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`;
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.";
  }
  if (m.includes("email address") && m.includes("invalid")) {
    return "Esse e-mail não parece válido.";
  }
  if (m.includes("auth session missing")) {
    return "Seu link expirou. Peça um novo e-mail de recuperação.";
  }

  return "Algo deu errado. Tente novamente em instantes.";
}

/* ───────────────────────── Entrar ───────────────────────── */

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/minha-lista");

  if (!email)
    return { status: "error", message: "Informe seu e-mail.", field: "email" };
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Esse e-mail não parece válido.", field: "email" };
  }
  if (!password) {
    return { status: "error", message: "Informe sua senha.", field: "password" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "O Supabase não está configurado neste projeto. Veja o README para ativar a sincronização.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(next));
}

/* ───────────────────────── Criar conta ───────────────────────── */

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = String(formData.get("next") ?? "/minha-lista");

  if (!email)
    return { status: "error", message: "Informe seu e-mail.", field: "email" };
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Esse e-mail não parece válido.", field: "email" };
  }
  if (password.length < MIN_PASSWORD) {
    return {
      status: "error",
      message: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`,
      field: "password",
    };
  }
  if (password !== confirm) {
    return { status: "error", message: "As senhas não coincidem.", field: "confirm" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "O Supabase não está configurado neste projeto. Veja o README para ativar a sincronização.",
    };
  }

  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Só é usado se a confirmação por e-mail estiver ativada no painel.
      // Levamos o destino adiante para o usuário voltar ao ponto de partida.
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        safeNext(next),
      )}`,
    },
  });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  // Com a confirmação DESATIVADA (recomendado neste projeto), o cadastro já
  // devolve sessão — o usuário entra direto.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(safeNext(next));
  }

  // Sem sessão ⇒ confirmação por e-mail está ativada. Avisamos o usuário.
  return {
    status: "success",
    message:
      "Conta criada. Enviamos um link de confirmação para o seu e-mail — clique nele para entrar.",
  };
}

/* ─────────────────── Recuperar senha ─────────────────── */

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email)
    return { status: "error", message: "Informe seu e-mail.", field: "email" };
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Esse e-mail não parece válido.", field: "email" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "O Supabase não está configurado neste projeto. Veja o README para ativar a sincronização.",
    };
  }

  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // O callback troca o `code` por uma sessão e então manda o usuário
    // para a tela de definir a nova senha.
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  // Resposta sempre igual, exista ou não a conta — evita enumeração de e-mails.
  return {
    status: "success",
    message:
      "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.",
  };
}

/* ─────────────────── Redefinir senha ─────────────────── */

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD) {
    return {
      status: "error",
      message: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`,
      field: "password",
    };
  }
  if (password !== confirm) {
    return { status: "error", message: "As senhas não coincidem.", field: "confirm" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "O Supabase não está configurado neste projeto. Veja o README para ativar a sincronização.",
    };
  }

  // Requer uma sessão válida — o callback a criou a partir do link do e-mail.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message:
        "Seu link expirou ou não é mais válido. Peça um novo e-mail de recuperação.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/minha-lista");
}

/* ───────────────────────── Sair ───────────────────────── */

export async function signOut() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  // Limpa o cache das rotas que dependem da sessão.
  revalidatePath("/", "layout");
  redirect("/");
}

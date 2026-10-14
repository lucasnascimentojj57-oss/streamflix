import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback do magic link.
 *
 * Fluxo: o usuário clica no link do e-mail → o Supabase redireciona para
 * cá com `?code=...` → trocamos o código por uma sessão (que é gravada em
 * cookie httpOnly) → redirecionamos para o destino.
 *
 * Por que a troca acontece no servidor e não no cliente?
 * Porque o cookie de sessão precisa ser httpOnly. Se a troca fosse feita
 * no browser, o token ficaria acessível a JavaScript — e portanto a
 * qualquer XSS.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/minha-lista";

  // O Supabase devolve `error_description` quando o link expirou ou já foi usado.
  const errorDescription = searchParams.get("error_description");
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/entrar?erro=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/entrar?erro=nao_configurado`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/entrar?erro=${encodeURIComponent(error.message)}`,
    );
  }

  // Só aceitamos caminhos relativos — um `next` absoluto seria um
  // open redirect (o atacante usaria nosso domínio para levar o usuário
  // a um site malicioso depois do login).
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/minha-lista";

  return NextResponse.redirect(`${origin}${safeNext}`);
}

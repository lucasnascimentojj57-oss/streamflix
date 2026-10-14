import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 *
 * O `cookies()` do Next é assíncrono (Next 15+). O padrão `getAll`/`setAll`
 * do @supabase/ssr é o que permite ao Supabase renovar o token de sessão
 * durante uma requisição ao servidor.
 *
 * `setAll` falha silenciosamente quando chamado de um Server Component
 * (que não pode escrever cookies). Isso é esperado: quem renova a sessão
 * de fato é o middleware. Aqui só lemos.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não pode escrever cookies — o middleware cuida disso.
        }
      },
    },
  });
}

/**
 * Usuário autenticado, ou `null`.
 *
 * `getUser()` (não `getSession()`) é o método correto no servidor:
 * ele valida o JWT contra o servidor de auth do Supabase, enquanto
 * `getSession()` apenas lê o cookie — que pode ter sido forjado.
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

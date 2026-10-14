import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para o browser.
 *
 * Usa a anon key, que é pública por design — a segurança real vem das
 * políticas de Row Level Security no Postgres (ver supabase/schema.sql).
 *
 * `isSupabaseConfigured()` permite que o app rode sem Supabase — mas
 * nesse caso as áreas que exigem conta mostram um aviso explicando como
 * configurar, em vez de telas de login que falhariam em silêncio. A
 * biblioteca depende do login, então sem Supabase ela fica indisponível.
 */

export const isSupabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

/**
 * Tipado explicitamente como `SupabaseClient`.
 *
 * `ReturnType<typeof createBrowserClient>` parece mais elegante, mas
 * descarta os genéricos — e aí `auth.getUser()` e `onAuthStateChange`
 * perdem a tipagem, fazendo os callbacks caírem em `any` implícito.
 */
let browserClient: SupabaseClient | null = null;

/**
 * Cliente singleton.
 *
 * Criar um cliente novo a cada render causaria múltiplas instâncias
 * disputando o mesmo storage de sessão — e o Supabase emite um aviso
 * explícito sobre isso. O singleton também evita re-subscrever listeners
 * de auth a cada montagem de componente.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return browserClient;
}

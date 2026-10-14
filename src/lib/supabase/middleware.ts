import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de sessão.
 *
 * Por que isto é necessário: o access token do Supabase expira (1h por
 * padrão). Sem renovação, o usuário seria deslogado silenciosamente no
 * meio do uso. O middleware roda em toda navegação e é o único lugar
 * onde podemos escrever cookies de resposta com segurança.
 *
 * Detalhe crítico: a resposta precisa ser criada ANTES do cliente, e os
 * cookies renovados precisam ser copiados para ela. Se criarmos a resposta
 * depois, os cookies novos se perdem e o usuário é deslogado.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem Supabase configurado, o middleware não tem nada a fazer.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Escreve na requisição (para os Server Components desta navegação
        // já enxergarem a sessão renovada)…
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        // …e recria a resposta para propagar os cookies ao browser.
        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Não remova: esta chamada é o que dispara a renovação do token.
  // `getUser()` valida o JWT no servidor de auth.
  await supabase.auth.getUser();

  return response;
}

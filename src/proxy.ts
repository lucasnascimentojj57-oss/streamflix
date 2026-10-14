import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy (antigo "middleware").
 *
 * O Next 16 renomeou a convenção `middleware` para `proxy` — o nome
 * "middleware" era confundido com o do Express e sugeria um uso mais
 * amplo do que o recurso realmente é: um proxy na borda da aplicação.
 *
 * Mantido deliberadamente fino: só delega a renovação de sessão.
 * Toda a lógica vive em `lib/supabase/middleware.ts`, onde é testável
 * e não depende do arquivo de convenção do Next.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Ignora assets estáticos e imagens otimizadas.
   *
   * Sem isso, o middleware rodaria em cada requisição de imagem do TMDB
   * (dezenas por página), adicionando uma chamada de rede ao Supabase
   * para renovar uma sessão que não é usada nessas rotas.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};

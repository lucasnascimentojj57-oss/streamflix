import { redirect } from "next/navigation";

/**
 * Rota legada.
 *
 * `/favoritos` foi renomeada para `/minha-lista` quando a lista única virou
 * duas (quero assistir / já assisti). Mantemos o redirecionamento para não
 * quebrar links salvos, atalhos e o histórico de quem já usava o app.
 */
export default function LegacyFavoritesPage() {
  redirect("/minha-lista");
}

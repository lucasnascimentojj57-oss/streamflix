import { formatRating, ratingLabel } from "@/lib/tmdb/normalize";
import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  voteCount: number;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Nota do TMDB.
 *
 * Acessibilidade: a cor NUNCA é o único portador de informação.
 * Mostramos o número e, no aria-label, o rótulo textual
 * ("7.8 de 10 — Muito bom"). Daltônicos e leitores de tela têm paridade.
 */
export function RatingBadge({
  rating,
  voteCount,
  className,
  size = "sm",
}: RatingBadgeProps) {
  const value = formatRating(rating, voteCount);
  if (!value) return null;

  const strong = rating >= 7.5;

  return (
    <span
      className={cn(
        "label inline-flex items-center tabular-nums",
        strong ? "text-terra" : "text-paper-dim",
        size === "md" && "text-xs",
        className,
      )}
      aria-label={`Nota ${value} de 10 — ${ratingLabel(rating)}`}
    >
      {value}
    </span>
  );
}

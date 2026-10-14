import type { MediaItem } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { MediaCard } from "./media-card";

interface MediaGridProps {
  items: MediaItem[];
  className?: string;
  /** Quantos cards recebem priority (above-the-fold). */
  priorityCount?: number;
}

/**
 * Grid responsivo de pôsteres.
 *
 * `gap-y` maior que `gap-x` de propósito: os metadados abaixo de cada card
 * precisam de respiro vertical para não colar no card seguinte — e isso
 * cria o ritmo editorial do layout.
 */
export function MediaGrid({
  items,
  className,
  priorityCount = 4,
}: MediaGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        className,
      )}
    >
      {items.map((item, index) => (
        <li key={`${item.type}-${item.id}`}>
          <MediaCard
            item={item}
            priority={index < priorityCount}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 23vw, 200px"
          />
        </li>
      ))}
    </ul>
  );
}

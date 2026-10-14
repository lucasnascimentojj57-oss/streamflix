import type { MediaItem } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { MediaCard } from "./media-card";

interface MediaRailProps {
  items: MediaItem[];
  /** Mostra números editoriais grandes sobre os pôsteres (top 10). */
  ranked?: boolean;
  className?: string;
  /** Rótulo acessível — o container é focável por scroll. */
  label: string;
  priority?: boolean;
}

/**
 * Trilha horizontal com scroll-snap.
 *
 * Decisões:
 *  - Scroll nativo em vez de carrossel JS: funciona com trackpad, touch,
 *    teclado (setas quando focado) e não envia ~8kB de JS ao cliente.
 *  - `tabIndex={0}` + `role="group"`: WCAG 2.1 exige que região com scroll
 *    seja alcançável por teclado. Sem isso, usuários de teclado não veem
 *    os itens fora da viewport inicial.
 *  - `fade-r` mascara a borda direita, comunicando "há mais conteúdo".
 */
export function MediaRail({
  items,
  ranked = false,
  className,
  label,
  priority = false,
}: MediaRailProps) {
  if (!items.length) return null;

  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "no-scrollbar fade-r -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={`${item.type}-${item.id}`}
          className="w-[44vw] shrink-0 snap-start sm:w-52 lg:w-56"
        >
          <MediaCard
            item={item}
            rank={ranked ? index + 1 : undefined}
            priority={priority && index < 3}
            sizes="(max-width: 640px) 44vw, 224px"
          />
        </div>
      ))}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { BLUR_DATA_URL, POSTER, posterUrl } from "@/lib/tmdb/images";
import type { MediaItem } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { LibraryButtons } from "./library-buttons";
import { RatingBadge } from "./rating-badge";

interface MediaCardProps {
  item: MediaItem;
  /** Apenas os primeiros itens above-the-fold. Evita 20 imagens `priority`. */
  priority?: boolean;
  /** Índice para o número editorial sobreposto (usado nas trilhas da home). */
  rank?: number;
  className?: string;
  /** Repassado ao next/image — crítico para não baixar w500 no mobile. */
  sizes?: string;
}

/**
 * Card de pôster.
 *
 * Micro-interações (direção Editorial Noir):
 *  - pôster faz zoom sutil de 1.04 (não o card inteiro — evita reflow)
 *  - véu escuro aparece para dar contraste ao texto sobreposto
 *  - título ganha sublinhado que cresce da esquerda
 *  - tudo com ease-out-expo, 400ms+: movimento "caro", nunca saltitante
 *
 * Acessibilidade: o link envolve a imagem e o título, e o `alt` é descritivo.
 * Os botões de status são irmãos (não filhos) do link — botão dentro de link
 * é HTML inválido e quebra a navegação por teclado.
 */
export function MediaCard({
  item,
  priority = false,
  rank,
  className,
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px",
}: MediaCardProps) {
  const poster = posterUrl(item.posterPath, POSTER.lg);
  const href = `/${item.type}/${item.id}`;
  const typeLabel = item.type === "tv" ? "Série" : "Filme";

  return (
    <article className={cn("group relative", className)}>
      <div className="relative overflow-hidden rounded-[2px] bg-ink-raised">
        <Link
          href={href}
          className="block focus-visible:outline-offset-0"
          aria-label={`${item.title}${item.year ? `, ${item.year}` : ""} — ${typeLabel}`}
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            {poster ? (
              <Image
                src={poster}
                alt={`Pôster de ${item.title}`}
                fill
                sizes={sizes}
                priority={priority}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover transition-transform duration-[600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
              />
            ) : (
              <div className="grid size-full place-items-center text-paper-mute">
                <ImageOff aria-hidden="true" className="size-7" />
              </div>
            )}

            {/* Véu de contraste para o conteúdo sobreposto */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95"
            />

            {/* Tipo — ajuda a distinguir filme de série no grid misto da busca */}
            <span className="label absolute bottom-2.5 right-2.5 text-paper/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {typeLabel}
            </span>
          </div>
        </Link>

        <LibraryButtons item={item} />
      </div>

      {/* Metadados fora do pôster — legibilidade garantida, sem depender da imagem */}
      <div className="mt-3 space-y-1">
        <h3 className="text-sm leading-snug font-medium text-paper">
          <Link href={href} className="relative inline-block" tabIndex={-1}>
            <span className="line-clamp-2">{item.title}</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 left-0 h-px w-0 bg-terra transition-all duration-400 ease-[var(--ease-out-expo)] group-hover:w-full"
            />
          </Link>
        </h3>

        <div className="flex items-center gap-2 text-paper-mute">
          {/* Número editorial na linha de metadados, não sobre o pôster.
              Motivo: a arte do pôster é imprevisível — qualquer sobreposição
              corre o risco de colidir com o título impresso na própria arte
              (acontecia com "Sobrevivência", "Carrie"…). Aqui o numeral é
              editorial, nunca colide, e entra na ordem de leitura. */}
          {rank !== undefined && (
            <span className="label shrink-0 tabular-nums text-terra">
              {String(rank).padStart(2, "0")}
            </span>
          )}
          {item.year && (
            <time className="label tabular-nums" dateTime={item.year}>
              {item.year}
            </time>
          )}
          {item.year && item.rating > 0 && (
            <span aria-hidden="true" className="size-0.5 rounded-full bg-current" />
          )}
          <RatingBadge rating={item.rating} voteCount={item.voteCount} />
        </div>
      </div>
    </article>
  );
}

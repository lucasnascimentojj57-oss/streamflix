import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { BACKDROP, backdropUrl } from "@/lib/tmdb/images";
import { ratingLabel } from "@/lib/tmdb/normalize";
import type { MediaItem } from "@/lib/tmdb/types";
import { ButtonLink } from "@/components/ui/button";

/**
 * Hero editorial.
 *
 * Layout assimétrico deliberado: a imagem sangra do lado direito e o texto
 * ocupa as colunas da esquerda sobre ela, com gradiente lateral (não só
 * vertical) garantindo contraste. Isso evita o clichê do "hero centralizado
 * com overlay preto por cima".
 *
 * Performance: backdrop em w1280 (não `original`, que chega a 4MB) com
 * `priority` — é a maior imagem above-the-fold e define o LCP da home.
 *
 * Acessibilidade: o gradiente vai até `from-ink` opaco na área do texto,
 * garantindo contraste real independentemente da imagem. Imagens de
 * backdrop variam muito, então não podemos confiar em overlay translúcido.
 */
export function Hero({ item }: { item: MediaItem }) {
  const backdrop = backdropUrl(item.backdropPath, BACKDROP.lg);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden border-b border-line"
    >
      {/* Imagem */}
      <div className="absolute inset-0 -z-10">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%]"
          />
        )}

        {/* Gradientes de contraste: vertical + lateral */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-transparent md:via-ink/40"
        />
      </div>

      <div className="mx-auto max-w-[1680px] px-5 pb-12 pt-20 md:px-8 md:pb-16 md:pt-28">
        {/* Grid 12 colunas — conteúdo nas 7 primeiras: assimetria editorial */}
        <div className="md:grid md:grid-cols-12">
          <div className="animate-rise md:col-span-7 lg:col-span-6">
            <p className="label mb-5 flex items-center gap-2.5 text-terra">
              Em destaque
              <span aria-hidden="true" className="h-px w-8 bg-terra/40" />
              <span className="text-paper-dim">
                {item.type === "tv" ? "Série" : "Filme"}
              </span>
            </p>

            <h1
              id="hero-title"
              className="font-display text-hero text-balance text-paper"
            >
              {item.title}
            </h1>

            {/* Metadados em mono — a terceira voz tipográfica */}
            <div className="label mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-paper-dim">
              {item.year && <span className="tabular-nums">{item.year}</span>}
              {item.rating > 0 && item.voteCount >= 10 && (
                <>
                  <span aria-hidden="true" className="size-1 rounded-full bg-current" />
                  <span className="tabular-nums text-terra">
                    {item.rating.toFixed(1)}
                    <span className="sr-only"> de 10</span>
                  </span>
                  <span className="text-paper-mute">
                    {ratingLabel(item.rating)}
                  </span>
                </>
              )}
            </div>

            {item.overview && (
              <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-paper-dim line-clamp-4">
                {item.overview}
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/${item.type}/${item.id}`} size="lg">
                Ver detalhes
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>

              <ButtonLink href="/descobrir" variant="outline" size="lg">
                Explorar catálogo
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

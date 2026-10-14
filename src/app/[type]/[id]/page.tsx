import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { LibraryButtons } from "@/components/media/library-buttons";
import { MediaRail } from "@/components/media/media-rail";
import { ProviderList } from "@/components/media/provider-list";
import { RatingBadge } from "@/components/media/rating-badge";
import { TrailerDialog } from "@/components/media/trailer-dialog";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/layout/setup-notice";
import { BACKDROP, POSTER, PROFILE, backdropUrl, posterUrl, profileUrl } from "@/lib/tmdb/images";
import { getRegion } from "@/lib/region-server";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import { getDetails } from "@/lib/tmdb/endpoints";
import {
  formatRuntime,
  includedProviders,
  languageLabel,
  statusLabel,
} from "@/lib/tmdb/normalize";
import type { MediaType } from "@/lib/tmdb/types";

/**
 * Página de detalhes.
 *
 * Rota única `/[type]/[id]` em vez de `/filme/[id]` + `/serie/[id]`:
 * o shape dos dados já foi normalizado, então a UI é idêntica para os dois.
 * Uma rota, um componente, zero duplicação.
 *
 * `generateMetadata` reaproveita o mesmo fetch de `getDetails` — o Next
 * deduplica automaticamente requisições idênticas dentro do mesmo render,
 * então não há custo extra de rede.
 */

const VALID_TYPES = new Set<MediaType>(["movie", "tv"]);

function parseParams(type: string, id: string) {
  if (!VALID_TYPES.has(type as MediaType)) return null;

  const numericId = Number.parseInt(id, 10);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  return { type: type as MediaType, id: numericId };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}): Promise<Metadata> {
  const raw = await params;
  const parsed = parseParams(raw.type, raw.id);
  if (!parsed) return { title: "Não encontrado" };

  const region = await getRegion();
  const details = await getDetails(parsed.type, parsed.id, region);
  if (!details) return { title: "Não encontrado" };

  const backdrop = backdropUrl(details.backdropPath, BACKDROP.md);

  return {
    title: details.title,
    description:
      details.overview.slice(0, 155) ||
      `${details.title} — onde assistir em streaming.`,
    openGraph: {
      title: details.title,
      description: details.overview.slice(0, 155),
      images: backdrop ? [{ url: backdrop }] : undefined,
    },
  };
}

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const raw = await params;
  const parsed = parseParams(raw.type, raw.id);
  if (!parsed) notFound();

  if (!isTmdbConfigured()) return <SetupNotice />;

  const region = await getRegion();
  const details = await getDetails(parsed.type, parsed.id, region);
  if (!details) notFound();

  const backdrop = backdropUrl(details.backdropPath, BACKDROP.lg);
  const poster = posterUrl(details.posterPath, POSTER.lg);
  const runtime = formatRuntime(details.runtime);
  const included = includedProviders(details.providers);
  const rent = details.providers?.rent ?? [];
  const buy = details.providers?.buy ?? [];

  const typeLabel = details.type === "tv" ? "Série" : "Filme";

  return (
    <article>
      {/* ═══════════════ Backdrop + cabeçalho ═══════════════ */}
      <header className="relative isolate overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10">
          {backdrop && (
            <Image
              src={backdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_25%]"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/40"
          />
        </div>

        <div className="mx-auto max-w-[1680px] px-5 pb-12 pt-20 md:px-8 md:pb-16 md:pt-32">
          <nav aria-label="Trilha de navegação" className="label mb-8 text-paper-mute">
            <Link href="/" className="transition-colors hover:text-terra">
              Início
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <Link
              href={`/descobrir?type=${details.type}`}
              className="transition-colors hover:text-terra"
            >
              {typeLabel}s
            </Link>
          </nav>

          <div className="flex flex-col gap-10 md:flex-row md:items-end md:gap-12">
            {/* Pôster — escondido no mobile muito estreito para não empurrar o título */}
            {poster && (
              <div className="hidden w-44 shrink-0 sm:block lg:w-56">
                <Image
                  src={poster}
                  alt={`Pôster de ${details.title}`}
                  width={500}
                  height={750}
                  priority
                  sizes="224px"
                  className="w-full rounded-[2px] ring-1 ring-line-strong"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="label mb-4 flex items-center gap-2.5 text-terra">
                {typeLabel}
                {details.status && (
                  <>
                    <span aria-hidden="true" className="h-px w-6 bg-terra/40" />
                    <span className="text-paper-dim">
                      {statusLabel(details.status)}
                    </span>
                  </>
                )}
              </p>

              <h1 className="font-display text-display text-balance text-paper">
                {details.title}
              </h1>

              {details.tagline && (
                <p className="mt-3 font-display text-lg italic text-paper-dim">
                  {details.tagline}
                </p>
              )}

              {/* Metadados */}
              <div className="label mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-paper-dim">
                {details.year && (
                  <span className="tabular-nums">{details.year}</span>
                )}
                {runtime && (
                  <>
                    <span aria-hidden="true" className="size-1 rounded-full bg-current" />
                    <span className="tabular-nums">{runtime}</span>
                  </>
                )}
                {details.seasons && (
                  <>
                    <span aria-hidden="true" className="size-1 rounded-full bg-current" />
                    <span className="tabular-nums">
                      {details.seasons}{" "}
                      {details.seasons === 1 ? "temporada" : "temporadas"}
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="size-1 rounded-full bg-current" />
                <RatingBadge
                  rating={details.rating}
                  voteCount={details.voteCount}
                  size="md"
                />
                {details.voteCount > 0 && (
                  <span className="text-paper-mute">
                    ({details.voteCount.toLocaleString("pt-BR")} votos)
                  </span>
                )}
              </div>

              {/* Gêneros como links para o catálogo filtrado */}
              {details.genres.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {details.genres.map((genre) => (
                    <li key={genre.id}>
                      <Link
                        href={`/descobrir?type=${details.type}&g=${genre.id}`}
                        className="label inline-block rounded-[3px] border border-line-strong px-3 py-2 text-paper-dim transition-colors duration-200 hover:border-terra hover:text-terra"
                      >
                        {genre.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                {details.trailer && (
                  <TrailerDialog
                    video={details.trailer}
                    title={details.title}
                  />
                )}
                <LibraryButtons item={details} variant="inline" />
                {details.homepage && (
                  <a
                    href={details.homepage}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-11 items-center gap-2 rounded-[3px] border border-line-strong px-4 text-sm font-medium text-paper-dim transition-colors duration-200 hover:border-paper hover:text-paper"
                  >
                    Site oficial
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ Corpo ═══════════════ */}
      <div className="mx-auto max-w-[1680px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Coluna principal — 7 de 12: assimetria editorial */}
          <div className="space-y-14 lg:col-span-7">
            {details.overview && (
              <section aria-labelledby="sinopse">
                <h2 id="sinopse" className="label mb-4 text-paper-mute">
                  Sinopse
                </h2>
                <p className="max-w-prose text-[1.0625rem] leading-[1.75] text-paper-dim">
                  {details.overview}
                </p>
              </section>
            )}

            {details.cast.length > 0 && (
              <section aria-labelledby="elenco">
                <h2 id="elenco" className="label mb-6 text-paper-mute">
                  Elenco principal
                </h2>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
                  {details.cast.slice(0, 9).map((person) => {
                    const photo = profileUrl(person.profilePath, PROFILE.md);

                    return (
                      <li key={person.id} className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-ink-raised">
                          {photo ? (
                            <Image
                              src={photo}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="grid size-full place-items-center text-xs font-semibold text-paper-mute"
                            >
                              {person.name.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-paper">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-paper-mute">
                            {person.role}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          {/* Coluna lateral — 4 de 12, com offset: onde assistir */}
          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            <section
              aria-labelledby="onde-assistir"
              className="rounded-[3px] border border-line bg-ink-raised p-6"
            >
              <h2 id="onde-assistir" className="label mb-6 text-terra">
                Onde assistir no Brasil
              </h2>

              {included.length > 0 ? (
                <ProviderList
                  providers={included}
                  label="Incluído na assinatura"
                />
              ) : (
                <p className="text-sm leading-relaxed text-paper-dim">
                  Não está incluído em nenhum serviço de assinatura no momento.
                </p>
              )}

              {rent.length > 0 && (
                <ProviderList
                  providers={rent}
                  label="Alugar"
                  className="mt-7 border-t border-line pt-6"
                  max={6}
                />
              )}

              {buy.length > 0 && (
                <ProviderList
                  providers={buy}
                  label="Comprar"
                  className="mt-7 border-t border-line pt-6"
                  max={6}
                />
              )}

              {details.providers?.link && (
                <a
                  href={details.providers.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="label mt-7 inline-flex items-center gap-1.5 border-t border-line pt-6 text-paper-mute transition-colors hover:text-terra"
                >
                  Ver todas as opções no TMDB
                  <ExternalLink aria-hidden="true" className="size-3" />
                </a>
              )}
            </section>

            {details.directors.length > 0 && (
              <section aria-labelledby="direcao">
                <h2 id="direcao" className="label mb-4 text-paper-mute">
                  {details.type === "tv" ? "Criação" : "Direção"}
                </h2>
                <ul className="space-y-2">
                  {details.directors.map((person) => (
                    <li key={person.id} className="text-sm text-paper-dim">
                      {person.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <dl className="space-y-3 border-t border-line pt-6">
              {details.originalTitle &&
                details.originalTitle !== details.title && (
                  <div className="flex justify-between gap-4">
                    <dt className="label text-paper-mute">Título original</dt>
                    <dd className="text-right text-xs text-paper-dim">
                      {details.originalTitle}
                    </dd>
                  </div>
                )}
              <div className="flex justify-between gap-4">
                <dt className="label text-paper-mute">Idioma original</dt>
                <dd className="text-right text-xs text-paper-dim">
                  {languageLabel(details.originalLanguage)}
                </dd>
              </div>
            </dl>
          </aside>
        </div>


        {/* ═══════════════ Recomendações ═══════════════ */}
        {details.recommendations.length > 0 && (
          <section className="mt-24" aria-labelledby="similares">
            <SectionHeading
              eyebrow="Se você gostou deste"
              title="Títulos parecidos"
            />
            <div className="mt-8">
              <MediaRail
                items={details.recommendations.slice(0, 12)}
                label={`Títulos parecidos com ${details.title}`}
              />
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

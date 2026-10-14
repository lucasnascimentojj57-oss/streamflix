"use client";

import Link from "next/link";
import { Bookmark, Check, Eye, HardDrive, Cloud, Trash2, TriangleAlert, X } from "lucide-react";
import { useLibrary } from "@/lib/library/provider";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGridSkeleton } from "@/components/ui/skeletons";
import { MediaGrid } from "./media-grid";

/**
 * Lista da biblioteca de um status ("quero assistir" ou "já assisti").
 *
 * O estado de carregamento vem do provider (`loading`), não de um flag
 * local de montagem. Motivo: com Supabase, a lista chega de forma
 * assíncrona — um flag de "montou?" não saberia distinguir "ainda
 * carregando" de "carregou e está vazio", e o usuário veria o estado
 * vazio piscar antes da lista real.
 */

type Status = "want" | "watched";

const COPY: Record<
  Status,
  {
    emptyTitle: string;
    emptyGuest: string;
    emptyUser: string;
    icon: typeof Bookmark;
  }
> = {
  want: {
    emptyTitle: "Nada na lista de quero assistir",
    emptyGuest:
      "Toque no marcador em qualquer pôster para guardar o que você quer ver. Fica salvo neste navegador.",
    emptyUser:
      "Toque no marcador em qualquer pôster para guardar o que você quer ver. Sua lista acompanha você em todos os dispositivos.",
    icon: Bookmark,
  },
  watched: {
    emptyTitle: "Você ainda não marcou nada como assistido",
    emptyGuest:
      "Toque no check em qualquer pôster para dizer que você já assistiu. Assim você evita reencontrar o que já viu.",
    emptyUser:
      "Toque no check em qualquer pôster para registrar o que você já assistiu. Fica sincronizado entre seus dispositivos.",
    icon: Check,
  },
};

export function LibraryView({ status }: { status: Status }) {
  const {
    entries,
    counts,
    clearStatus,
    loading,
    storage,
    user,
    error,
    dismissError,
  } = useLibrary();

  const items = entries.filter((entry) => entry.status === status);
  const count = items.length;
  const copy = COPY[status];
  const Icon = copy.icon;

  if (loading) {
    return <MediaGridSkeleton count={6} />;
  }

  return (
    <div className="space-y-10">
      {/* Erro de sincronização — a UI nunca mente sobre o que foi salvo */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[3px] border border-terra/40 bg-terra/[0.07] p-4"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-terra"
          />
          <p className="flex-1 text-sm leading-relaxed text-paper-dim">
            {error}
          </p>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Fechar aviso"
            className="grid size-6 shrink-0 place-items-center rounded-[2px] text-paper-mute transition-colors hover:bg-ink-raised hover:text-paper"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      )}

      {count === 0 ? (
        <EmptyState
          icon={<Icon className="size-6" />}
          title={copy.emptyTitle}
          description={user ? copy.emptyUser : copy.emptyGuest}
          action={
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/descobrir" variant="outline" size="sm">
                Explorar catálogo
              </ButtonLink>
              {!user && (
                <ButtonLink href="/entrar" size="sm">
                  Sincronizar entre dispositivos
                </ButtonLink>
              )}
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="label text-paper-mute">
                {count} {count === 1 ? "título" : "títulos"}
              </p>

              <span
                className="label inline-flex items-center gap-1.5 text-paper-mute"
                title={
                  storage === "cloud"
                    ? "Salvo na sua conta, disponível em qualquer dispositivo"
                    : "Salvo apenas neste navegador"
                }
              >
                {storage === "cloud" ? (
                  <Cloud aria-hidden="true" className="size-3 text-terra" />
                ) : (
                  <HardDrive aria-hidden="true" className="size-3" />
                )}
                {storage === "cloud" ? "Sincronizado" : "Neste navegador"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Remover todos os ${count} títulos da lista "${
                      status === "want" ? "Quero assistir" : "Já assisti"
                    }"? Esta ação não pode ser desfeita.`,
                  )
                ) {
                  clearStatus(status);
                }
              }}
              className="inline-flex items-center gap-2 rounded-[3px] px-3 py-2 text-xs font-medium text-paper-mute transition-colors duration-200 hover:bg-terra/10 hover:text-terra"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Limpar esta lista
            </button>
          </div>

          <MediaGrid items={items} />

          {storage === "local" && (
            <div className="flex flex-col items-start gap-4 rounded-[3px] border border-line bg-ink-raised p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Eye
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-terra"
                />
                <p className="max-w-prose text-sm leading-relaxed text-paper-dim">
                  Sua lista está salva apenas neste navegador. Entre com um
                  e-mail para levar tudo com você em qualquer dispositivo.
                </p>
              </div>
              <ButtonLink href="/entrar" size="sm" className="shrink-0">
                Entrar
              </ButtonLink>
            </div>
          )}
        </>
      )}

      {/* Ajuda de atalho quando o usuário tem as duas listas */}
      {count > 0 && storage === "cloud" && counts.want + counts.watched > 0 && (
        <p className="text-xs text-paper-mute">
          Mover um título de lista? Abra os detalhes ou use os botões no
          pôster. Veja também{" "}
          <Link
            href="/minha-lista?aba=assistidos"
            className="text-terra underline underline-offset-4"
          >
            outra lista
          </Link>
          .
        </p>
      )}
    </div>
  );
}

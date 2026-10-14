"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Play, X } from "lucide-react";
import { useState } from "react";
import type { TmdbVideo } from "@/lib/tmdb/types";

interface TrailerDialogProps {
  video: TmdbVideo;
  title: string;
}

/**
 * Modal de trailer.
 *
 * Usamos Radix Dialog em vez de um modal caseiro porque acessibilidade de
 * modal é notoriamente difícil de acertar: focus trap, `aria-modal`,
 * retorno de foco ao gatilho, Esc, bloqueio de scroll e inércia do
 * conteúdo de fundo. O Radix entrega tudo isso testado.
 *
 * Performance: o iframe do YouTube (~900kB) só é montado quando o modal
 * abre, e é desmontado ao fechar (`mounted` state). Renderizar o embed
 * junto com a página custaria quase 1MB para um recurso que a maioria
 * dos usuários nunca abre.
 */
export function TrailerDialog({ video, title }: TrailerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="inline-flex h-11 items-center gap-2.5 rounded-[3px] bg-terra px-5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-terra-soft">
        <Play aria-hidden="true" className="size-4 fill-current" />
        Ver trailer
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/92 backdrop-blur-sm data-[state=open]:animate-rise" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 focus:outline-none data-[state=open]:animate-rise">
          <div className="mb-3 flex items-start justify-between gap-6">
            <div>
              <Dialog.Title className="font-display text-xl text-paper">
                {title}
              </Dialog.Title>
              <Dialog.Description className="label mt-1.5 text-paper-mute">
                {video.type === "Teaser" ? "Teaser oficial" : "Trailer oficial"}
              </Dialog.Description>
            </div>

            <Dialog.Close
              aria-label="Fechar trailer"
              className="grid size-10 shrink-0 place-items-center rounded-[3px] border border-line-strong text-paper-dim transition-colors duration-200 hover:border-paper hover:text-paper"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-[3px] bg-ink-raised ring-1 ring-line-strong">
            {open && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0&modestbranding=1`}
                title={`Trailer de ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { cn } from "@/lib/utils";

/** Bloco genérico com brilho percorrendo. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[2px]", className)} />;
}

/**
 * Esqueleto de um card de mídia.
 * As proporções replicam exatamente o MediaCard real (aspect-[2/3] + 2 linhas
 * de texto) — sem isso haveria layout shift ao trocar o skeleton pelo conteúdo.
 */
export function MediaCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MediaRailSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[42vw] shrink-0 sm:w-56 lg:w-60">
          <MediaCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative aspect-[4/5] w-full sm:aspect-[21/9]" aria-hidden="true">
      <Skeleton className="size-full" />
    </div>
  );
}

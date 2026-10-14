import { HeroSkeleton, MediaRailSkeleton } from "@/components/ui/skeletons";

/**
 * Loading global.
 * Replica a estrutura da home (hero + trilhas) para que a transição
 * não cause salto de layout quando o conteúdo real chega.
 */
export default function Loading() {
  return (
    <>
      <HeroSkeleton />

      <div className="mx-auto max-w-[1680px] space-y-20 px-5 py-20 md:px-8 md:py-24">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-8">
            <div className="skeleton h-8 w-64 rounded-[3px]" />
            <MediaRailSkeleton />
          </div>
        ))}
      </div>
    </>
  );
}

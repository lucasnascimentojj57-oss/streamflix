import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn, sectionNumber } from "@/lib/utils";

interface SectionHeadingProps {
  /** Índice da seção — renderizado como "01", "02"… assinatura editorial. */
  index?: number;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
  /** Nível semântico do heading. A home usa h2; a página de detalhes, h2 também. */
  as?: "h2" | "h3";
}

/**
 * Cabeçalho de seção.
 *
 * Decisão de layout: o título e a ação ficam em linha no desktop com
 * a ação empurrada à direita — o "espaço em branco assimétrico" que
 * caracteriza a direção Editorial Noir. No mobile, empilha.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {(index !== undefined || eyebrow) && (
          <p className="label mb-3 flex items-center gap-2.5 text-paper-mute">
            {index !== undefined && (
              <>
                <span className="text-terra">{sectionNumber(index)}</span>
                <span aria-hidden="true" className="h-px w-5 bg-line-strong" />
              </>
            )}
            {eyebrow}
          </p>
        )}

        <Tag className="font-display text-title text-balance text-paper">
          {title}
        </Tag>

        {description && (
          <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-paper-dim">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group label inline-flex shrink-0 items-center gap-1.5 self-start text-paper-dim transition-colors duration-200 hover:text-terra sm:self-end"
        >
          {action.label}
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

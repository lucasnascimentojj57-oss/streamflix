import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vazio.
 * Alinhado à esquerda (não centralizado) para manter a linguagem editorial
 * e o ritmo assimétrico do resto do app.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex max-w-md flex-col items-start gap-4 border-l border-line-strong py-12 pl-6",
        className,
      )}
    >
      {icon && <div className="text-terra" aria-hidden="true">{icon}</div>}

      <div className="space-y-2">
        <p className="font-display text-2xl text-paper">{title}</p>
        {description && (
          <p className="text-sm leading-relaxed text-paper-dim">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

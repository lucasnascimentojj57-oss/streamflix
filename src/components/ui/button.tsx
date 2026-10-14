import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all duration-200 ease-[var(--ease-in-out-soft)] disabled:pointer-events-none disabled:opacity-40 rounded-[3px]";

const variants: Record<Variant, string> = {
  // Acento sólido. Hover escurece de leve em vez de clarear — sensação "impressa".
  primary:
    "bg-terra text-ink hover:bg-terra-soft active:bg-terra-deep active:text-paper",
  outline:
    "border border-line-strong text-paper hover:border-paper hover:bg-paper hover:text-ink",
  ghost: "text-paper-dim hover:bg-ink-raised hover:text-paper",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[0.9375rem]",
};

interface SharedProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: SharedProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: SharedProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Concatena classes resolvendo conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Número de seção no estilo editorial: 1 → "01" */
export const sectionNumber = (n: number) => String(n).padStart(2, "0");

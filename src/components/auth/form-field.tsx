"use client";

import { useId, useState, type ComponentType } from "react";
import { Eye, EyeOff, TriangleAlert, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Campo de formulário de autenticação.
 *
 * Concentra rótulo, ícone, estado de erro e o toggle de "mostrar senha" —
 * usado pelos quatro formulários (entrar, criar conta, recuperar, redefinir)
 * para que fiquem visualmente idênticos.
 *
 * Acessibilidade:
 *  - `label` associado por `htmlFor`/`id` gerados com `useId`;
 *  - erro ligado por `aria-describedby` e sinalizado por `aria-invalid`;
 *  - o botão de mostrar senha é um toggle com `aria-pressed` e `aria-label`.
 */
interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
  icon?: ComponentType<LucideProps>;
  error?: string;
  autoFocus?: boolean;
  minLength?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  icon: Icon,
  error,
  autoFocus,
  minLength,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="label block text-paper-mute">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-paper-mute"
          />
        )}

        <input
          id={id}
          name={name}
          type={inputType}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={minLength}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 w-full rounded-[3px] border bg-ink pr-3.5 text-sm text-paper transition-colors duration-200 placeholder:text-paper-mute hover:border-paper-mute focus:border-terra focus:outline-none",
            Icon ? "pl-10" : "pl-3.5",
            isPassword && "pr-11",
            error ? "border-terra" : "border-line-strong",
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-pressed={revealed}
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[2px] text-paper-mute transition-colors hover:text-paper focus-visible:text-paper"
          >
            {revealed ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-terra"
        >
          <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

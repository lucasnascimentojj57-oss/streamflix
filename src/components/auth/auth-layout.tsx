import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Layout das telas de autenticação.
 *
 * Duas colunas assimétricas (texto à esquerda, formulário à direita) para
 * manter a linguagem "Editorial Noir" do resto do app, em vez da tela de
 * login genérica e centralizada.
 */
interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  children: ReactNode;
  /** Link no rodapé da coluna de texto (ex.: trocar entre entrar/criar). */
  footer?: ReactNode;
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  bullets,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="mx-auto max-w-[1680px] px-5 py-16 md:px-8 md:py-24">
      <div className="grid gap-16 lg:grid-cols-12">
        {/* Coluna de texto — 5 de 12, assimetria editorial */}
        <div className="lg:col-span-5">
          <p className="label mb-5 text-terra">{eyebrow}</p>

          <h1 className="font-display text-display text-balance text-paper">
            {title}
          </h1>

          <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-paper-dim">
            {description}
          </p>

          {bullets && bullets.length > 0 && (
            <ul className="mt-10 space-y-4 border-t border-line pt-8">
              {bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-paper-dim"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terra"
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {footer && (
            <div className="mt-10 text-sm text-paper-dim">{footer}</div>
          )}

          <p className="mt-10 text-xs text-paper-mute">
            <Link href="/" className="underline-offset-4 hover:text-terra hover:underline">
              ← Voltar ao início
            </Link>
          </p>
        </div>

        {/* Formulário — 5 de 12, começando na coluna 8 */}
        <div className="lg:col-span-5 lg:col-start-8">{children}</div>
      </div>
    </div>
  );
}

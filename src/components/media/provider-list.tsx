import Image from "next/image";
import { LOGO, logoUrl } from "@/lib/tmdb/images";
import type { TmdbProvider } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

interface ProviderListProps {
  providers: TmdbProvider[];
  /** Rótulo da categoria: "Incluído na assinatura", "Alugar"… */
  label: string;
  className?: string;
  max?: number;
}

/**
 * Logos dos serviços de streaming.
 *
 * Micro-interação: os logos entram em grayscale e ganham cor no hover.
 * Isso mantém a paleta do app coesa (muitos logos de streaming são
 * saturados e brigariam com o acento terracota), mas permite
 * reconhecimento imediato quando o usuário interage.
 *
 * Acessibilidade: o nome do serviço está no `alt` e também visível
 * como texto em telas maiores — nunca dependemos só do logo.
 */
export function ProviderList({
  providers,
  label,
  className,
  max = 8,
}: ProviderListProps) {
  if (!providers.length) return null;

  const visible = providers.slice(0, max);
  const overflow = providers.length - visible.length;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="label text-paper-mute">{label}</p>

      <ul className="flex flex-wrap items-center gap-2.5">
        {visible.map((provider) => {
          const logo = logoUrl(provider.logo_path, LOGO.md);

          return (
            <li key={provider.provider_id}>
              <span
                className="group flex items-center gap-2.5 rounded-[3px] border border-line bg-ink-raised py-1.5 pl-1.5 pr-3 transition-colors duration-200 hover:border-line-strong"
                title={provider.provider_name}
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 rounded-[2px] grayscale transition-[filter] duration-300 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="grid size-7 place-items-center rounded-[2px] bg-ink-overlay text-[0.625rem] font-semibold">
                    {provider.provider_name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-medium text-paper-dim transition-colors group-hover:text-paper">
                  {provider.provider_name}
                </span>
              </span>
            </li>
          );
        })}

        {overflow > 0 && (
          <li className="label text-paper-mute">+{overflow}</li>
        )}
      </ul>
    </div>
  );
}

/** Variante compacta — só os logos, para usar no hero. */
export function ProviderStrip({
  providers,
  max = 5,
  className,
}: {
  providers: TmdbProvider[];
  max?: number;
  className?: string;
}) {
  if (!providers.length) return null;

  const visible = providers.slice(0, max);

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {visible.map((provider) => {
        const logo = logoUrl(provider.logo_path, LOGO.md);
        if (!logo) return null;

        return (
          <li key={provider.provider_id}>
            <Image
              src={logo}
              alt={provider.provider_name}
              width={32}
              height={32}
              className="size-8 rounded-[2px] ring-1 ring-line-strong"
            />
          </li>
        );
      })}
    </ul>
  );
}

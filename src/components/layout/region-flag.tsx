"use client";

import { useId } from "react";

/**
 * Bandeiras em SVG.
 *
 * Por que não usar o emoji (🇧🇷 / 🇵🇹)? Porque o Windows NÃO tem glifos de
 * bandeira na fonte do sistema: o emoji é composto por dois "Regional
 * Indicator Symbols" e o Windows os exibe como as letras do código — ou
 * seja, "🇧🇷" aparece como "BR". Como o seletor já mostra o código ao lado,
 * o resultado era "BR BR" (duplicado).
 *
 * SVG resolve de vez: mesma aparência em Windows, macOS, Linux, Android —
 * sem dependência externa e sem requisição de rede.
 *
 * São versões simplificadas, desenhadas para serem reconhecíveis a 20px.
 */

interface RegionFlagProps {
  code: string;
  className?: string;
}

export function RegionFlag({ code, className }: RegionFlagProps) {
  // IDs de clip/mask precisam ser únicos: o seletor renderiza a mesma
  // bandeira no gatilho E no menu, e IDs duplicados no DOM são inválidos.
  const uid = useId().replace(/:/g, "");

  if (code === "BR") {
    const clipId = `br-${uid}`;
    return (
      <svg
        viewBox="0 0 100 70"
        className={className}
        role="img"
        aria-label="Bandeira do Brasil"
        focusable="false"
      >
        <rect width="100" height="70" fill="#009C3B" />
        <path d="M50 6 L94 35 L50 64 L6 35 Z" fill="#FFDF00" />
        <circle cx="50" cy="35" r="17" fill="#002776" />
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="35" r="17" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M28 47 Q50 22 73 26"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5"
          />
        </g>
      </svg>
    );
  }

  if (code === "PT") {
    return (
      <svg
        viewBox="0 0 60 40"
        className={className}
        role="img"
        aria-label="Bandeira de Portugal"
        focusable="false"
      >
        <rect width="60" height="40" fill="#DA291C" />
        <rect width="24" height="40" fill="#046A38" />
        {/* Esfera armilar (simplificada) */}
        <circle
          cx="24"
          cy="20"
          r="8.5"
          fill="none"
          stroke="#F1BF00"
          strokeWidth="1.6"
        />
        <ellipse
          cx="24"
          cy="20"
          rx="8.5"
          ry="3.4"
          fill="none"
          stroke="#F1BF00"
          strokeWidth="1"
        />
        {/* Escudo */}
        <path
          d="M24 13.5 L20.5 15.5 L20.5 20 Q20.5 24 24 25 Q27.5 24 27.5 20 L27.5 15.5 Z"
          fill="#FFFFFF"
          stroke="#DA291C"
          strokeWidth="1.2"
        />
        <rect
          x="22.4"
          y="17.2"
          width="3.2"
          height="3.2"
          fill="#FFFFFF"
          stroke="#003399"
          strokeWidth="0.9"
        />
      </svg>
    );
  }

  // Fallback: sem bandeira, mostra o código em texto.
  return (
    <span className={className} aria-hidden="true">
      {code}
    </span>
  );
}

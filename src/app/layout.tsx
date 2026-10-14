import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LibraryProvider } from "@/lib/library/provider";
import { getRegion } from "@/lib/region-server";
import { getServerUser } from "@/lib/supabase/server";
import "./globals.css";

/**
 * Tipografia Editorial Noir.
 *
 * O contraste entre uma serif de display (Instrument Serif) e uma sans
 * neutra de corpo (Geist) é o que produz a sensação de "caderno de cultura"
 * em vez de dashboard. A mono (Geist Mono) carrega todos os metadados —
 * ano, nota, rótulos — criando uma terceira voz tipográfica consistente.
 *
 * `display: "swap"` evita texto invisível durante o carregamento (FOIT).
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StreamFlix — O que assistir agora nos streamings",
    template: "%s · StreamFlix",
  },
  description:
    "Descubra filmes e séries disponíveis na Netflix, Prime Video, Max, Disney+ e mais. Filtre por serviço, gênero, ano e nota.",
  keywords: [
    "streaming",
    "filmes",
    "séries",
    "netflix",
    "prime video",
    "onde assistir",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "StreamFlix",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A região vem do cookie, no servidor — o header já renderiza na região
  // certa sem depender de hidratação (evita flash de país errado).
  const region = await getRegion();

  // O id do usuário vem do servidor pelo mesmo motivo: quem entra ou sai o
  // faz via Server Action, e o cliente só sabe disso pelo cookie. Passar o
  // valor adiante é o que faz o header e as listas reagirem na hora, sem
  // depender de um reload (ver o efeito `serverUserId` no provider).
  const user = await getServerUser();

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* WCAG 2.4.1 — permite pular a navegação repetida */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[3px] focus:bg-terra focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Pular para o conteúdo
        </a>

        {/* Provider no topo: o header mostra o contador da lista e
            qualquer card pode marcar um título como quero/assisti. */}
        <LibraryProvider serverUserId={user?.id ?? null}>
          <Header region={region} />

          <main id="conteudo" className="flex-1">
            {children}
          </main>

          <Footer />
        </LibraryProvider>
      </body>
    </html>
  );
}

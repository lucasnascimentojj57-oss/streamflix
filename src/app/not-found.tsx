import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1680px] flex-col items-start px-5 py-32 md:px-8">
      <p className="label mb-6 text-terra">Erro 404</p>

      <h1 className="font-display text-hero text-paper">
        Fora de cartaz
      </h1>

      <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-paper-dim">
        Esta página não existe ou o título que você procura não está mais
        disponível no catálogo.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/">Voltar ao início</ButtonLink>
        <ButtonLink href="/descobrir" variant="outline">
          Explorar catálogo
        </ButtonLink>
      </div>
    </div>
  );
}

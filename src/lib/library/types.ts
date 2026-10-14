import type { MediaItem, MediaRef } from "@/lib/tmdb/types";

/**
 * Contrato de persistência da biblioteca pessoal.
 *
 * "Biblioteca" é o nome do conceito; a tabela no Supabase continua se
 * chamando `favorites` por compatibilidade com dados já existentes.
 *
 * Dois status, mutuamente exclusivos por construção (é uma única coluna
 * no banco): `want` ("Quero assistir") e `watched` ("Já assisti").
 *
 * Duas implementações: `LocalBackend` (localStorage) e `SupabaseBackend`.
 * O provider escolhe qual usar conforme o usuário estar autenticado.
 *
 * Por que a interface é assíncrona mesmo para o localStorage?
 * Porque o consumidor (o provider) precisa tratar os dois casos com o
 * mesmo código. Se o local fosse síncrono, teríamos dois caminhos de
 * execução na UI — e o caminho síncrono nunca seria exercitado em
 * produção, escondendo bugs.
 *
 * Todas as operações são IDEMPOTENTES: definir o mesmo status duas vezes
 * não gera erro; remover o que não existe não falha. Isso simplifica o
 * retry e a reconciliação após erro.
 */

export const LIBRARY_STATUSES = ["want", "watched"] as const;

export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

/** Um título da biblioteca + o status que ele carrega. */
export interface LibraryEntry extends MediaItem {
  status: LibraryStatus;
  /** ISO — última interação. Ordena as listas. */
  updatedAt: string;
}

export function isLibraryStatus(value: unknown): value is LibraryStatus {
  return value === "want" || value === "watched";
}

export interface LibraryBackend {
  /** Identificador para debug e para a UI indicar onde os dados estão. */
  readonly kind: "local" | "cloud";

  /** Carrega toda a biblioteca, mais recentes primeiro. */
  list(): Promise<LibraryEntry[]>;

  /** Define o status de um título, movendo-o entre as listas. Idempotente. */
  setStatus(item: MediaItem, status: LibraryStatus): Promise<void>;

  /** Adiciona vários de uma vez (usado na migração local → nuvem). */
  addMany(entries: LibraryEntry[]): Promise<void>;

  /** Remove um título de qualquer lista. Idempotente. */
  remove(ref: MediaRef): Promise<void>;

  /** Remove todos os títulos de UMA lista, preservando a outra. */
  clearStatus(status: LibraryStatus): Promise<void>;

  /** Remove todos. */
  clear(): Promise<void>;
}

/** Chave estável de um título. */
export const libraryKey = (ref: MediaRef) => `${ref.type}:${ref.id}`;

/**
 * Remove duplicatas preservando a ordem (mais recente primeiro) e
 * garantindo exclusividade: um título aparece uma única vez.
 */
export function dedupe(entries: LibraryEntry[]): LibraryEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = libraryKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Limite defensivo — evita estourar a quota do localStorage. */
export const MAX_ENTRIES = 1000;

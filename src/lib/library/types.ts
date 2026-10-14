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
 * Há **uma única implementação**: `SupabaseBackend`. A biblioteca exige
 * conta — sem login o usuário é levado para a tela de entrar. (Antes havia
 * um `LocalBackend` para uso sem conta; foi removido de propósito, para não
 * manter dois caminhos de código e para evitar listas "fantasma" que o
 * usuário julgava estar salvas na conta.)
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

export interface LibraryBackend {
  /** Carrega toda a biblioteca, mais recentes primeiro. */
  list(): Promise<LibraryEntry[]>;

  /** Define o status de um título, movendo-o entre as listas. Idempotente. */
  setStatus(item: MediaItem, status: LibraryStatus): Promise<void>;

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

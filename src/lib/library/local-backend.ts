import type { MediaItem, MediaRef } from "@/lib/tmdb/types";
import {
  dedupe,
  isLibraryStatus,
  libraryKey,
  MAX_ENTRIES,
  type LibraryBackend,
  type LibraryEntry,
  type LibraryStatus,
} from "./types";

/**
 * Backend da biblioteca em localStorage.
 *
 * Usado quando o usuário não está autenticado (ou quando o Supabase não
 * está configurado). É o modo padrão do app — funciona sem conta.
 */

const STORAGE_KEY = "streamflix.library.v2";

/**
 * Chave da versão anterior, que guardava só uma lista de favoritos sem
 * status. Lemos uma vez para não perder quem já tinha salvado títulos:
 * tudo vira "quero assistir".
 */
const LEGACY_KEY = "streamflix.favorites.v1";

/** Campos persistidos — subconjunto enxuto do MediaItem + status. */
function serialize(entry: LibraryEntry): LibraryEntry {
  return {
    id: entry.id,
    type: entry.type,
    title: entry.title,
    originalTitle: entry.originalTitle,
    overview: entry.overview.slice(0, 300),
    posterPath: entry.posterPath,
    backdropPath: entry.backdropPath,
    year: entry.year,
    releaseDate: entry.releaseDate,
    rating: entry.rating,
    voteCount: entry.voteCount,
    popularity: entry.popularity,
    genreIds: entry.genreIds,
    status: entry.status,
    updatedAt: entry.updatedAt,
  };
}

function isEntryShape(value: unknown): value is Omit<
  LibraryEntry,
  "status" | "updatedAt"
> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    (v.type === "movie" || v.type === "tv") &&
    typeof v.title === "string"
  );
}

/** Valida e normaliza uma entrada vinda do storage. */
function toEntry(value: unknown, fallbackStatus: LibraryStatus): LibraryEntry | null {
  if (!isEntryShape(value)) return null;
  const v = value as Record<string, unknown>;

  return {
    ...(value as MediaItem),
    status: isLibraryStatus(v.status) ? v.status : fallbackStatus,
    updatedAt:
      typeof v.updatedAt === "string" ? v.updatedAt : new Date(0).toISOString(),
  };
}

/** Lê a versão atual, migrando a antiga se necessário. Tolerante a corrupção. */
export function readLibrary(): LibraryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const entries = parsed
        .map((value) => toEntry(value, "want"))
        .filter((entry): entry is LibraryEntry => entry !== null);

      return dedupe(entries);
    }

    // ── Migração da versão sem status ──
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return [];

    const legacyParsed: unknown = JSON.parse(legacyRaw);
    if (!Array.isArray(legacyParsed)) return [];

    const migrated = legacyParsed
      .map((value) => toEntry(value, "want"))
      .filter((entry): entry is LibraryEntry => entry !== null);

    const result = dedupe(migrated);
    writeLibrary(result);
    window.localStorage.removeItem(LEGACY_KEY);

    return result;
  } catch {
    // Storage corrompido, bloqueado (modo privado) ou quota excedida.
    return [];
  }
}

function writeLibrary(entries: LibraryEntry[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota cheia ou storage indisponível — o estado em memória segue válido.
  }
}

export class LocalBackend implements LibraryBackend {
  readonly kind = "local" as const;

  async list() {
    return readLibrary();
  }

  async setStatus(item: MediaItem, status: LibraryStatus) {
    const key = libraryKey(item);
    const now = new Date().toISOString();

    // Remove a entrada atual (se houver) e reinsere no topo com o novo
    // status — garante exclusividade e "mais recente primeiro".
    const rest = readLibrary().filter((entry) => libraryKey(entry) !== key);
    const entry: LibraryEntry = { ...item, status, updatedAt: now };

    writeLibrary([entry, ...rest].slice(0, MAX_ENTRIES));
  }

  async addMany(entries: LibraryEntry[]) {
    const current = readLibrary();
    const existing = new Set(current.map(libraryKey));

    const fresh = entries
      .filter((entry) => !existing.has(libraryKey(entry)))
      .map(serialize);

    if (!fresh.length) return;

    writeLibrary([...fresh, ...current].slice(0, MAX_ENTRIES));
  }

  async remove(ref: MediaRef) {
    const key = libraryKey(ref);
    writeLibrary(readLibrary().filter((entry) => libraryKey(entry) !== key));
  }

  async clearStatus(status: LibraryStatus) {
    writeLibrary(readLibrary().filter((entry) => entry.status !== status));
  }

  async clear() {
    writeLibrary([]);
  }
}

/** Remove a biblioteca local — usado após migrar para a conta. */
export function clearLocalLibrary() {
  writeLibrary([]);
}

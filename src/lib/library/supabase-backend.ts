import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaItem, MediaRef, MediaType } from "@/lib/tmdb/types";
import {
  dedupe,
  libraryKey,
  type LibraryBackend,
  type LibraryEntry,
  type LibraryStatus,
} from "./types";

/**
 * Backend da biblioteca no Supabase.
 *
 * A tabela chama-se `favorites` (mantido por compatibilidade), mas agora
 * guarda um `status` por linha. A segurança não depende deste código: as
 * políticas de Row Level Security (supabase/schema.sql) garantem que um
 * usuário só enxerga e altera as próprias linhas. Mesmo que alguém
 * manipule o cliente, o Postgres recusa.
 */

/** Formato da linha na tabela `favorites`. */
interface FavoriteRow {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  rating: number;
  vote_count: number;
  genre_ids: number[];
  status: LibraryStatus;
  updated_at: string;
  created_at: string;
}

const COLUMNS =
  "tmdb_id, media_type, title, original_title, overview, poster_path, backdrop_path, release_date, rating, vote_count, genre_ids, status, updated_at, created_at";

/** Linha do banco → entrada da UI. */
function toEntry(row: FavoriteRow): LibraryEntry {
  return {
    id: row.tmdb_id,
    type: row.media_type,
    title: row.title,
    originalTitle: row.original_title ?? "",
    overview: row.overview ?? "",
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    // `release_date` vem como "2010-07-15"; a UI usa só o ano.
    year: row.release_date ? row.release_date.slice(0, 4) : null,
    releaseDate: row.release_date,
    // `numeric` chega como string em alguns drivers — normalizamos.
    rating: Number(row.rating) || 0,
    voteCount: row.vote_count ?? 0,
    popularity: 0, // não persistido: não é usado nas listas
    genreIds: row.genre_ids ?? [],
    status: row.status,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

/** Entrada da UI → linha do banco. */
function toRow(
  entry: MediaItem & { status: LibraryStatus },
  userId: string,
) {
  return {
    user_id: userId,
    tmdb_id: entry.id,
    media_type: entry.type,
    title: entry.title,
    original_title: entry.originalTitle ?? "",
    overview: entry.overview ?? "",
    poster_path: entry.posterPath,
    backdrop_path: entry.backdropPath,
    release_date: entry.releaseDate,
    rating: entry.rating,
    vote_count: entry.voteCount,
    genre_ids: entry.genreIds,
    status: entry.status,
    updated_at: new Date().toISOString(),
  };
}

export class SupabaseBackend implements LibraryBackend {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string,
  ) {}

  async list(): Promise<LibraryEntry[]> {
    const { data, error } = await this.supabase
      .from("favorites")
      .select(COLUMNS)
      .eq("user_id", this.userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`Falha ao carregar sua lista: ${error.message}`);

    return dedupe((data as FavoriteRow[]).map(toEntry));
  }

  async setStatus(item: MediaItem, status: LibraryStatus): Promise<void> {
    // `upsert` na constraint única: se o título já existia em outra lista,
    // a linha é atualizada (e portanto movida de lista, não duplicada).
    const { error } = await this.supabase
      .from("favorites")
      .upsert(toRow({ ...item, status }, this.userId), {
        onConflict: "user_id,tmdb_id,media_type",
      });

    if (error) throw new Error(`Falha ao salvar: ${error.message}`);
  }

  async remove(ref: MediaRef): Promise<void> {
    const { error } = await this.supabase
      .from("favorites")
      .delete()
      .eq("user_id", this.userId)
      .eq("tmdb_id", ref.id)
      .eq("media_type", ref.type);

    if (error) throw new Error(`Falha ao remover: ${error.message}`);
  }

  async clearStatus(status: LibraryStatus): Promise<void> {
    const { error } = await this.supabase
      .from("favorites")
      .delete()
      .eq("user_id", this.userId)
      .eq("status", status);

    if (error) throw new Error(`Falha ao limpar a lista: ${error.message}`);
  }

  async clear(): Promise<void> {
    const { error } = await this.supabase
      .from("favorites")
      .delete()
      .eq("user_id", this.userId);

    if (error) throw new Error(`Falha ao limpar: ${error.message}`);
  }
}

export { libraryKey };

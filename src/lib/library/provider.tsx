"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MediaItem, MediaRef } from "@/lib/tmdb/types";
import {
  clearLocalLibrary,
  LocalBackend,
  readLibrary,
} from "./local-backend";
import { SupabaseBackend } from "./supabase-backend";
import {
  dedupe,
  libraryKey,
  type LibraryBackend,
  type LibraryEntry,
  type LibraryStatus,
} from "./types";

/**
 * Estado da biblioteca pessoal do app.
 *
 * Arquitetura: um único provider no topo da árvore mantém a lista em
 * memória e delega a persistência a um `LibraryBackend`. A UI nunca fala
 * com o Supabase nem com o localStorage — só com este contexto.
 *
 * Dois status mutuamente exclusivos: `want` (quero assistir) e `watched`
 * (já assisti). Definir um remove o outro automaticamente.
 *
 * Por que estado em memória em vez de ler do backend a cada render?
 * Porque a UI precisa ser INSTANTÂNEA. Clicar em "quero assistir" deve
 * mudar o ícone no mesmo frame, não depois de um round-trip. Aplicamos a
 * mudança localmente (otimista) e persistimos em seguida; se falhar,
 * revertemos.
 */

type StorageKind = "local" | "cloud";

interface LibraryContextValue {
  /** Tudo, mais recentes primeiro. */
  entries: LibraryEntry[];
  /** "Quero assistir", mais recentes primeiro. */
  want: LibraryEntry[];
  /** "Já assisti", mais recentes primeiro. */
  watched: LibraryEntry[];
  counts: { want: number; watched: number; total: number };
  /** `true` enquanto a lista inicial está sendo carregada. */
  loading: boolean;
  /** Onde os dados estão agora — a UI usa para informar o usuário. */
  storage: StorageKind;
  user: User | null;
  /** Status atual de um título, ou `null` se ele não está na biblioteca. */
  statusOf: (ref: MediaRef) => LibraryStatus | null;
  /** Define o status, movendo o título entre as listas. */
  setStatus: (item: MediaItem, status: LibraryStatus) => void;
  /** Se o título já tem esse status, remove; senão, define. */
  toggleStatus: (item: MediaItem, status: LibraryStatus) => void;
  remove: (ref: MediaRef) => void;
  /** Esvazia uma lista, preservando a outra. */
  clearStatus: (status: LibraryStatus) => void;
  clear: () => void;
  /** Erro da última operação, para exibir feedback. */
  error: string | null;
  dismissError: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState<StorageKind>("local");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  /**
   * Backend ativo. Fica em ref (não em state) porque as callbacks de
   * setStatus/remove precisam ler o valor atual sem serem recriadas a cada
   * troca de backend — recriá-las causaria re-render de todos os cards.
   *
   * O `kind` é espelhado em state (`storage`) porque a UI precisa dele
   * durante o render, e ler refs durante o render é proibido.
   */
  const backendRef = useRef<LibraryBackend>(new LocalBackend());

  /**
   * Último usuário conhecido, em ref.
   *
   * Os listeners de auth precisam comparar "mudou mesmo de usuário?" sem
   * serem recriados a cada login (o que re-subscreveria os listeners). Ler
   * o estado `user` dentro deles exigiria incluí-lo nas dependências do
   * efeito — daí a ref, que sempre enxerga o valor atual.
   */
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /** Descarta o resultado de um carregamento obsoleto (troca de conta). */
  const loadIdRef = useRef(0);

  /**
   * Sincroniza a lista com o backend adequado ao usuário.
   *
   * Nota de implementação: todos os `setState` acontecem DEPOIS de um
   * `await`. Isso não é acidental — atualizar estado de forma síncrona
   * dentro de um efeito provoca render em cascata (e é o que a regra
   * `react-hooks/set-state-in-effect` sinaliza). Como a leitura do
   * backend é assíncrona de qualquer forma, a espera é natural.
   */
  const sync = useCallback(
    async (nextUser: User | null, isActive: () => boolean) => {
      const loadId = ++loadIdRef.current;

      const backend: LibraryBackend =
        nextUser && supabase
          ? new SupabaseBackend(supabase, nextUser.id)
          : new LocalBackend();

      backendRef.current = backend;

      try {
        let remote = await backend.list();

        // ── Migração: usuário logou e tinha biblioteca local ──
        if (nextUser && backend.kind === "cloud") {
          const local = readLibrary();

          if (local.length > 0) {
            const remoteKeys = new Set(remote.map(libraryKey));
            const missing = local.filter(
              (entry) => !remoteKeys.has(libraryKey(entry)),
            );

            if (missing.length > 0) {
              await backend.addMany(missing);
              remote = dedupe([...missing, ...remote]);
            }

            // Migração concluída: limpa o local para não migrar de novo
            // nem duplicar caso o usuário saia e entre novamente.
            clearLocalLibrary();
          }
        }

        // Descarta resultado obsoleto (usuário trocou de conta no meio).
        if (!isActive() || loadId !== loadIdRef.current) return;

        setStorage(backend.kind);
        setEntries(remote);
        setError(null);
      } catch (cause) {
        if (!isActive() || loadId !== loadIdRef.current) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar sua lista.",
        );
        // Degrada para o que temos em memória em vez de esvaziar a tela.
      } finally {
        if (isActive() && loadId === loadIdRef.current) setLoading(false);
      }
    },
    [supabase],
  );

  /* ─────────────────── Sessão ─────────────────── */

  useEffect(() => {
    let active = true;
    const isActive = () => active;

    /**
     * Aplica um usuário vindo da camada de auth.
     *
     * `settle` é `true` quando o valor é definitivo (início, login/logout,
     * foco). Nesse caso marcamos `loading` para a lista não piscar vazia
     * enquanto o backend responde. O listener de auth pode emitir o MESMO
     * usuário logo após o `init`; aí `settle = false` evita um `loading`
     * desnecessário (e o flicker que ele causaria).
     */
    const applyUser = (nextUser: User | null, settle: boolean) => {
      if (settle) {
        setUser(nextUser);
        setLoading(true);
      }
      void sync(nextUser, isActive);
    };

    /**
     * Um único caminho assíncrono para os dois modos.
     *
     * Manter o modo local dentro de uma função assíncrona não é
     * preciosismo: garante que os `setState` sempre aconteçam após um
     * `await`, evitando render em cascata. Também evita dois fluxos
     * divergentes — o modo local seria o menos exercitado e esconderia
     * bugs que só apareceriam em produção com Supabase.
     */
    const init = async () => {
      if (!supabase) {
        await sync(null, isActive);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!active) return;

      // Aqui o usuário JÁ é conhecido de forma definitiva: refletimos no
      // estado antes de sincronizar (sem isso, o header ficaria "Entrar"
      // até a lista carregar).
      setUser(data.user ?? null);
      setLoading(true);
      await sync(data.user ?? null, isActive);
    };

    void init();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    // Reage a login, logout, refresh de token e troca de conta entre abas.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      // `TOKEN_REFRESHED` dispara de hora em hora sem que nada mude para o
      // usuário; recarregar a lista nesse caso seria trabalho à toa.
      if (event === "TOKEN_REFRESHED") return;

      const nextUser = session?.user ?? null;

      // Sem mudança real de usuário (ex.: `INITIAL_SESSION` logo após o
      // `init`), apenas reconcilia a lista sem piscar o `loading`.
      if ((userRef.current?.id ?? null) === (nextUser?.id ?? null)) {
        void sync(nextUser, isActive);
        return;
      }

      applyUser(nextUser, true);
    });

    /**
     * Revalida a sessão quando a aba volta ao foco.
     *
     * Caso de uso concreto: o usuário entra ou cria conta em outra aba (ou
     * numa janela diferente) e volta para esta — o header atualiza sozinho,
     * sem reload. É barato: `getUser()` lê a sessão local e só bate no
     * servidor se o token precisar ser validado.
     */
    const onFocus = () => {
      void supabase.auth.getUser().then(({ data }) => {
        if (!active) return;
        const nextUser = data.user ?? null;
        if ((userRef.current?.id ?? null) === (nextUser?.id ?? null)) return;
        applyUser(nextUser, true);
      });
    };

    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      subscription.unsubscribe();
    };
  }, [supabase, sync]);

  /* ─────────────────── Mutações otimistas ─────────────────── */

  /**
   * Aplica a mudança no estado local imediatamente e persiste em seguida.
   * Se a persistência falhar, reverte e mostra o erro — o usuário nunca
   * fica com a UI mentindo sobre o que está salvo.
   */
  const runOptimistic = useCallback(
    (
      apply: (current: LibraryEntry[]) => LibraryEntry[],
      persist: () => Promise<void>,
    ) => {
      let snapshot: LibraryEntry[] = [];

      setEntries((current) => {
        snapshot = current;
        return apply(current);
      });

      void persist().catch((cause: unknown) => {
        setEntries(snapshot);
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível salvar. Tente novamente.",
        );
      });
    },
    [],
  );

  const setStatus = useCallback(
    (item: MediaItem, status: LibraryStatus) => {
      const key = libraryKey(item);

      runOptimistic(
        // Reinsere no topo com o novo status e remove a versão antiga —
        // isso é o que torna os dois status mutuamente exclusivos.
        (current) => [
          { ...item, status, updatedAt: new Date().toISOString() },
          ...current.filter((entry) => libraryKey(entry) !== key),
        ],
        () => backendRef.current.setStatus(item, status),
      );
    },
    [runOptimistic],
  );

  const remove = useCallback(
    (ref: MediaRef) => {
      const key = libraryKey(ref);

      runOptimistic(
        (current) => current.filter((entry) => libraryKey(entry) !== key),
        () => backendRef.current.remove(ref),
      );
    },
    [runOptimistic],
  );

  const toggleStatus = useCallback(
    (item: MediaItem, status: LibraryStatus) => {
      const key = libraryKey(item);
      const current = entries.find((entry) => libraryKey(entry) === key);

      if (current?.status === status) {
        remove(item);
      } else {
        setStatus(item, status);
      }
    },
    [entries, remove, setStatus],
  );

  const clear = useCallback(() => {
    runOptimistic(
      () => [],
      () => backendRef.current.clear(),
    );
  }, [runOptimistic]);

  const clearStatus = useCallback(
    (status: LibraryStatus) => {
      runOptimistic(
        (current) => current.filter((entry) => entry.status !== status),
        () => backendRef.current.clearStatus(status),
      );
    },
    [runOptimistic],
  );

  /* ─────────────────── Derivados ─────────────────── */

  // Map de chave → status: lookup O(1). Num grid de 20+ cards, cada card
  // consultaria a lista inteira a cada render sem isso.
  const statusMap = useMemo(
    () => new Map(entries.map((entry) => [libraryKey(entry), entry.status])),
    [entries],
  );

  const statusOf = useCallback(
    (ref: MediaRef) => statusMap.get(libraryKey(ref)) ?? null,
    [statusMap],
  );

  const want = useMemo(
    () => entries.filter((entry) => entry.status === "want"),
    [entries],
  );

  const watched = useMemo(
    () => entries.filter((entry) => entry.status === "watched"),
    [entries],
  );

  const counts = useMemo(
    () => ({ want: want.length, watched: watched.length, total: entries.length }),
    [want.length, watched.length, entries.length],
  );

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      entries,
      want,
      watched,
      counts,
      loading,
      storage,
      user,
      statusOf,
      setStatus,
      toggleStatus,
      remove,
      clearStatus,
      clear,
      error,
      dismissError,
    }),
    [
      entries,
      want,
      watched,
      counts,
      loading,
      storage,
      user,
      statusOf,
      setStatus,
      toggleStatus,
      remove,
      clearStatus,
      clear,
      error,
      dismissError,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error(
      "useLibrary precisa estar dentro de <LibraryProvider>. Verifique se o provider está no layout raiz.",
    );
  }

  return context;
}

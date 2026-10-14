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
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MediaItem, MediaRef } from "@/lib/tmdb/types";
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
 * A biblioteca **exige conta**: todas as mutações passam por `requireBackend`,
 * que redireciona para /entrar com `?next=` quando não há sessão. Abrimos mão
 * do "funciona sem login" em troca de uma garantia simples e honesta: o que o
 * usuário vê na tela é exatamente o que está na conta dele.
 *
 * Por que estado em memória em vez de ler do backend a cada render?
 * Porque a UI precisa ser INSTANTÂNEA. Clicar em "quero assistir" deve mudar
 * o ícone no mesmo frame, não depois de um round-trip. Aplicamos a mudança
 * localmente (otimista) e persistimos em seguida; se falhar, revertemos.
 */

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

export function LibraryProvider({
  children,
  serverUserId,
}: {
  children: ReactNode;
  /**
   * Id do usuário segundo o SERVIDOR (lido do cookie no layout raiz).
   * `null` quando não há sessão.
   *
   * Existe para resolver um problema concreto: entrar e sair acontecem em
   * Server Actions, que gravam o cookie na resposta e redirecionam. O
   * cliente do browser (onde este provider vive) não é avisado —
   * `onAuthStateChange` só dispara para mudanças feitas pelo próprio
   * cliente. Sem este sinal, quem entrava vindo de `/entrar` continuava
   * vendo "Entre para ver..." até dar reload, e quem saía continuava
   * parecendo logado.
   *
   * Como o layout raiz re-renderiza a cada navegação, este valor é o
   * gatilho confiável para reconciliar a sessão — em qualquer rota, tanto
   * no login quanto no logout.
   */
  serverUserId: string | null;
}) {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  /**
   * Backend ativo, em ref.
   *
   * Fica em ref (não em state) porque as callbacks de setStatus/remove
   * precisam ler o valor atual sem serem recriadas a cada login — recriá-las
   * causaria re-render de todos os cards. Fica `null` quando não há sessão.
   */
  const backendRef = useRef<LibraryBackend | null>(null);

  /**
   * Último usuário conhecido, em ref.
   *
   * Os listeners de auth precisam comparar "mudou mesmo de usuário?" sem
   * serem recriados a cada login. Ler o estado `user` dentro deles exigiria
   * incluí-lo nas dependências do efeito — daí a ref.
   */
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /** Descarta o resultado de um carregamento obsoleto (troca de conta). */
  const loadIdRef = useRef(0);

  /**
   * Garante que há sessão antes de qualquer mutação.
   *
   * Sem sessão, manda para o login preservando o destino (`?next=`), para o
   * usuário voltar exatamente onde estava. Devolve o backend, ou `null` se
   * não havia sessão — nesse caso o fluxo foi interrompido e nada é salvo.
   */
  const requireBackend = useCallback((): LibraryBackend | null => {
    if (!backendRef.current) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      router.push(`/entrar?next=${encodeURIComponent(next)}`);
      return null;
    }

    return backendRef.current;
  }, [router]);

  /**
   * Sincroniza a lista com o backend do usuário.
   *
   * Nota de implementação: todos os `setState` acontecem DEPOIS de um
   * `await`. Isso não é acidental — atualizar estado de forma síncrona
   * dentro de um efeito provoca render em cascata (e é o que a regra
   * `react-hooks/set-state-in-effect` sinaliza).
   */
  const sync = useCallback(
    async (nextUser: User | null, isActive: () => boolean) => {
      const loadId = ++loadIdRef.current;

      // Sem usuário (ou sem Supabase configurado) não há biblioteca: fica
      // vazia e somente leitura. O backend continua `null`, então qualquer
      // tentativa de escrita leva ao login.
      if (!nextUser || !supabase) {
        backendRef.current = null;

        // `await` antes dos setState: ver nota acima sobre render em cascata.
        await Promise.resolve();
        if (!isActive() || loadId !== loadIdRef.current) return;

        setEntries([]);
        setError(null);
        setLoading(false);
        return;
      }

      const backend = new SupabaseBackend(supabase, nextUser.id);
      backendRef.current = backend;

      try {
        const remote = await backend.list();

        // Descarta resultado obsoleto (usuário trocou de conta no meio).
        if (!isActive() || loadId !== loadIdRef.current) return;

        setEntries(dedupe(remote));
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
     * enquanto o backend responde.
     */
    const applyUser = (nextUser: User | null, settle: boolean) => {
      if (settle) {
        setUser(nextUser);
        setLoading(true);
      }
      void sync(nextUser, isActive);
    };

    const init = async () => {
      if (!supabase) {
        await sync(null, isActive);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!active) return;

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
     * Caso de uso concreto: o usuário entra em outra aba e volta para esta —
     * o header e a lista atualizam sozinhos, sem reload.
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

  /**
   * Revalida a sessão quando o servidor vê uma sessão diferente.
   *
   * O valor do servidor é só o GATILHO; quem decide é o cliente, que lê o
   * mesmo cookie e é quem de fato usa a biblioteca. Assim cobrimos login,
   * cadastro e logout em qualquer rota, sem depender de reload.
   *
   * A conferência é barata: `getUser()` resolve do cookie local. Não usamos
   * `pathname` como gatilho porque sair da conta na própria home manteria a
   * rota igual — e o header continuaria mostrando a conta antiga.
   */
  useEffect(() => {
    if (!supabase) return;

    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;

      const nextUser = data.user ?? null;
      if ((userRef.current?.id ?? null) === (nextUser?.id ?? null)) return;

      setUser(nextUser);
      setLoading(true);
      void sync(nextUser, () => active);
    });

    return () => {
      active = false;
    };
  }, [supabase, sync, serverUserId]);

  /* ─────────────────── Mutações otimistas ─────────────────── */

  /**
   * Aplica a mudança no estado local imediatamente e persiste em seguida.
   * Se a persistência falhar, reverte e mostra o erro — o usuário nunca
   * fica com a UI mentindo sobre o que está salvo.
   */
  const runOptimistic = useCallback(
    (
      apply: (current: LibraryEntry[]) => LibraryEntry[],
      persist: (backend: LibraryBackend) => Promise<void>,
    ) => {
      const backend = requireBackend();
      if (!backend) return; // sem sessão: já redirecionou para o login

      let snapshot: LibraryEntry[] = [];

      setEntries((current) => {
        snapshot = current;
        return apply(current);
      });

      void persist(backend).catch((cause: unknown) => {
        setEntries(snapshot);
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível salvar. Tente novamente.",
        );
      });
    },
    [requireBackend],
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
        (backend) => backend.setStatus(item, status),
      );
    },
    [runOptimistic],
  );

  const remove = useCallback(
    (ref: MediaRef) => {
      const key = libraryKey(ref);

      runOptimistic(
        (current) => current.filter((entry) => libraryKey(entry) !== key),
        (backend) => backend.remove(ref),
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
      (backend) => backend.clear(),
    );
  }, [runOptimistic]);

  const clearStatus = useCallback(
    (status: LibraryStatus) => {
      runOptimistic(
        (current) => current.filter((entry) => entry.status !== status),
        (backend) => backend.clearStatus(status),
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
    () => ({
      want: want.length,
      watched: watched.length,
      total: entries.length,
    }),
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

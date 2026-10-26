"use client";

import axios from "axios";
import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { getBrowserAuthToken } from "@/lib/auth-cookie";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { patrimonyApi } from "../api/patrimonyApi";
import type { InvestmentCategory, Patrimony, PatrimonyAction } from "../types/patrimony";

type WriteResult = { outcome: "saved" | "review" | "error"; category?: InvestmentCategory };
type State = {
  data: Patrimony | null;
  categories: InvestmentCategory[];
  supported: boolean | null;
  loading: boolean;
  categoriesLoading: boolean;
  saving: boolean;
  error: string | null;
  categoriesError: string | null;
  mutationError: string | null;
  notice: string | null;
  noticeTone: "success" | "info";
  needsReview: boolean;
  load: (force?: boolean) => Promise<void>;
  loadCategories: (force?: boolean) => Promise<void>;
  reconcile: () => Promise<void>;
  write: (action: PatrimonyAction) => Promise<WriteResult>;
  clearMutationError: () => void;
  reset: () => void;
};
const initial = {
  data: null,
  categories: [],
  supported: null,
  loading: false,
  categoriesLoading: false,
  saving: false,
  error: null,
  categoriesError: null,
  mutationError: null,
  notice: null,
  noticeTone: "info" as const,
  needsReview: false,
};
let owner: string | null = null;
let generation = 0;
let loadedAt = 0,
  categoriesAt = 0;
let pending: Promise<void> | null = null,
  categoriesPending: Promise<void> | null = null;
const delays = [500, 1500, 3000];
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const usePatrimonyStore = create<State>((set, get) => {
  function session() {
    const token = getBrowserAuthToken();
    if (token !== owner) {
      get().reset();
      owner = token;
    }
    return { token, version: generation };
  }
  function current(scope: { token: string | null; version: number }) {
    return (
      scope.token === getBrowserAuthToken() && scope.token === owner && scope.version === generation
    );
  }
  function expired(error: unknown) {
    if (![401, 403].includes(getApiErrorStatus(error) ?? 0)) return false;
    const message = getApiErrorMessage(error);
    get().reset();
    useAuthStore.getState().logout(message);
    return true;
  }
  async function read<T>(
    operation: () => Promise<T>,
    scope: { token: string | null; version: number },
  ) {
    for (let attempt = 0; ; attempt++) {
      if (!current(scope)) throw new Error("Sessão alterada.");
      try {
        return await operation();
      } catch (error) {
        if (
          !axios.isAxiosError(error) ||
          error.response ||
          error.code !== "ERR_NETWORK" ||
          attempt >= delays.length
        )
          throw error;
        await pause(delays[attempt]);
      }
    }
  }
  return {
    ...initial,
    reset: () => {
      generation++;
      owner = null;
      loadedAt = 0;
      categoriesAt = 0;
      pending = null;
      categoriesPending = null;
      set({ ...initial, categories: [] });
    },
    clearMutationError: () => set({ mutationError: null }),
    load: (force = false) => {
      const scope = session();
      if (!scope.token) return Promise.resolve();
      if (get().saving) return Promise.resolve();
      if (pending) return pending;
      if (!force && get().data && !get().error && Date.now() - loadedAt < 60000)
        return Promise.resolve();
      set({ loading: true });
      const request = (async () => {
        try {
          const data = await read(patrimonyApi.read, scope);
          if (!current(scope)) return;
          loadedAt = Date.now();
          set({ data, error: null });
        } catch (error) {
          if (!current(scope) || expired(error)) return;
          set({ error: getApiErrorMessage(error, "Não foi possível carregar seu patrimônio.") });
        } finally {
          if (current(scope)) {
            pending = null;
            set({ loading: false });
          }
        }
      })();
      pending = request;
      return request;
    },
    loadCategories: (force = false) => {
      const scope = session();
      if (!scope.token) return Promise.resolve();
      if (get().saving) return Promise.resolve();
      if (categoriesPending) return categoriesPending;
      if (
        !force &&
        get().supported === true &&
        !get().categoriesError &&
        Date.now() - categoriesAt < 60000
      )
        return Promise.resolve();
      set({ categoriesLoading: true });
      const request = (async () => {
        try {
          const categories = await read(patrimonyApi.categories, scope);
          if (!current(scope)) return;
          categoriesAt = Date.now();
          set({ categories, supported: true, categoriesError: null });
        } catch (error) {
          if (!current(scope) || expired(error)) return;
          if (getApiErrorStatus(error) === 404)
            set({ supported: false, categories: [], categoriesError: null });
          else
            set({
              categoriesError: getApiErrorMessage(
                error,
                "Não foi possível carregar as categorias.",
              ),
            });
        } finally {
          if (current(scope)) {
            categoriesPending = null;
            set({ categoriesLoading: false });
          }
        }
      })();
      categoriesPending = request;
      return request;
    },
    reconcile: async () => {
      if (get().saving) return;
      const scope = session();
      await Promise.all([get().load(true), get().loadCategories(true)]);
      if (current(scope) && !get().error && !get().categoriesError) set({ needsReview: false });
    },
    write: async (action) => {
      const scope = session();
      const state = get();
      const isCategory = action.kind === "category" || action.kind === "deleteCategory";
      const requiresCatalog = isCategory || action.kind === "investment";
      if (
        !scope.token ||
        state.saving ||
        state.loading ||
        (requiresCatalog && state.categoriesLoading) ||
        state.needsReview ||
        !state.data ||
        state.error ||
        (isCategory && (state.supported !== true || state.categoriesError))
      ) {
        set({ mutationError: "Aguarde a consulta e confira os dados antes de salvar." });
        return { outcome: "error" };
      }
      if (
        action.kind === "investment" &&
        (state.categoriesError ||
          state.supported === null ||
          (state.supported === true &&
            !state.categories.some((item) => item.id === action.draft.categoryId)) ||
          (state.supported === false && action.draft.categoryId !== undefined))
      ) {
        set({ mutationError: "Consulte e selecione uma categoria disponível antes de salvar." });
        return { outcome: "error" };
      }
      if (
        isCategory &&
        action.id !== undefined &&
        state.categories.find((item) => item.id === action.id)?.is_default
      ) {
        set({ mutationError: "Categorias padrão são protegidas." });
        return { outcome: "error" };
      }
      set({ saving: true, mutationError: null, notice: null });
      let result: WriteResult;
      let reloadCatalog = false;
      try {
        const category = await patrimonyApi.write(action);
        if (!current(scope)) return { outcome: "error" };
        result = { outcome: "saved", ...(category ? { category } : {}) };
      } catch (error) {
        if (!current(scope) || expired(error)) return { outcome: "error" };
        const status = getApiErrorStatus(error);
        if (
          (axios.isAxiosError(error) && (!error.response || (status ?? 0) >= 500)) ||
          (error && typeof error === "object" && "unconfirmedWrite" in error)
        ) {
          set({
            needsReview: true,
            noticeTone: "info",
            notice:
              "A confirmação da alteração não chegou. Confira os dados atualizados antes de tentar novamente. A operação não será repetida automaticamente.",
          });
          result = { outcome: "review" };
        } else {
          const message = getApiErrorMessage(
            error,
            error instanceof Error ? error.message : undefined,
          );
          set({
            mutationError:
              status === 409 && isCategory
                ? `${message} Troque a categoria dos investimentos antes de excluir. Seus investimentos foram preservados.`
                : message,
          });
          if (status === 404 && action.kind === "investment") reloadCatalog = true;
          return { outcome: "error" };
        }
      } finally {
        if (current(scope)) {
          set({ saving: false });
          if (reloadCatalog) await get().loadCategories(true);
        }
      }
      if (!current(scope)) return { outcome: "error" };
      loadedAt = 0;
      categoriesAt = 0;
      await get().reconcile();
      if (current(scope) && result.outcome === "saved")
        set({ notice: "Alteração salva.", noticeTone: "success" });
      return current(scope) ? result : { outcome: "error" };
    },
  };
});

// Financial state and pending results belong exclusively to the current session.
useAuthStore.subscribe((state, previous) => {
  if (!state.isAuthenticated || state.user?.email !== previous.user?.email)
    usePatrimonyStore.getState().reset();
});

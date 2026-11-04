"use client";

import { create } from "zustand";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { balancePreferencesApi } from "@/features/incomes/api/balancePreferencesApi";
import type {
  BalancePreferenceKey,
  BalancePreferences,
} from "@/features/incomes/types/balancePreferences";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { getBrowserAuthSessionEpoch, getBrowserAuthToken } from "@/lib/auth-cookie";

type BalancePreferencesState = {
  preferences: BalancePreferences | null;
  isLoading: boolean;
  isSaving: boolean;
  pendingKey: BalancePreferenceKey | null;
  loadError: string | null;
  saveError: string | null;
  revision: number;
  sessionRevision: number;
  needsReconciliation: boolean;
  loadPreferences: () => Promise<void>;
  setPreference: (key: BalancePreferenceKey, value: boolean) => Promise<boolean>;
};

type SessionScope = {
  token: string;
  epoch: number;
  generation: number;
};

const initial = {
  preferences: null,
  isLoading: false,
  isSaving: false,
  pendingKey: null,
  loadError: null,
  saveError: null,
  needsReconciliation: false,
};

let synchronizeSession = () => {};

export const useBalancePreferencesStore = create<BalancePreferencesState>((set, get) => {
  let owner: SessionScope | null = null;
  let generation = 0;
  let readSequence = 0;
  let pendingRead: Promise<void> | null = null;

  function resetSession() {
    generation++;
    readSequence++;
    owner = null;
    pendingRead = null;
    set((state) => ({
      ...initial,
      revision: state.revision + 1,
      sessionRevision: generation,
    }));
  }

  function session(): SessionScope | null {
    const auth = useAuthStore.getState();
    // Unresolved hydration is not evidence of logout or a different account.
    if (!auth.hasHydrated) return null;
    const token = auth.isAuthenticated ? getBrowserAuthToken() : null;
    const epoch = getBrowserAuthSessionEpoch();

    if (!token) {
      if (owner) resetSession();
      return null;
    }

    if (owner?.token !== token || owner.epoch !== epoch) {
      resetSession();
      owner = { token, epoch, generation };
    }
    return owner;
  }

  synchronizeSession = () => {
    session();
  };

  function current(scope: SessionScope) {
    const auth = useAuthStore.getState();
    return (
      scope.generation === generation &&
      owner?.token === scope.token &&
      owner.epoch === scope.epoch &&
      getBrowserAuthToken() === scope.token &&
      getBrowserAuthSessionEpoch() === scope.epoch &&
      (!auth.hasHydrated || auth.isAuthenticated)
    );
  }

  function expired(error: unknown, scope: SessionScope) {
    if (!current(scope) || ![401, 403].includes(getApiErrorStatus(error) ?? 0)) return false;
    useAuthStore.getState().logout(getApiErrorMessage(error, "Sua sessão expirou."));
    session();
    return true;
  }

  function read(scope: SessionScope): Promise<void> {
    if (pendingRead) return pendingRead;
    const request = ++readSequence;
    const reconciling = get().needsReconciliation;
    set({ isLoading: true, loadError: null });

    const operation = Promise.resolve().then(async () => {
      if (!current(scope) || request !== readSequence) return;
      try {
        const preferences = await balancePreferencesApi.getPreferences();
        if (!current(scope) || request !== readSequence) return;
        const previous = get().preferences;
        const changed =
          !previous ||
          previous.exclude_va_from_available !== preferences.exclude_va_from_available ||
          previous.exclude_vr_from_available !== preferences.exclude_vr_from_available;
        set((state) => ({
          preferences,
          isLoading: false,
          loadError: null,
          needsReconciliation: false,
          revision: state.revision + (changed || reconciling ? 1 : 0),
        }));
      } catch (error) {
        if (!current(scope) || request !== readSequence || expired(error, scope)) return;
        set({
          isLoading: false,
          loadError: getApiErrorMessage(error, "Não foi possível carregar as preferências de saldo."),
        });
      } finally {
        if (current(scope) && request === readSequence) set({ isLoading: false });
      }
    });
    pendingRead = operation;
    void operation.finally(() => {
      if (pendingRead === operation) pendingRead = null;
    });
    return operation;
  }

  return {
    ...initial,
    revision: 0,
    sessionRevision: 0,

    loadPreferences: () => {
      const scope = session();
      if (!scope || get().isSaving) return Promise.resolve();
      return read(scope);
    },

    setPreference: async (key, value) => {
      const scope = session();
      const state = get();
      if (
        !scope ||
        (key !== "exclude_va_from_available" && key !== "exclude_vr_from_available") ||
        typeof value !== "boolean" ||
        !state.preferences ||
        state.isLoading ||
        state.isSaving ||
        state.loadError ||
        state.needsReconciliation
      ) {
        return false;
      }
      if (state.preferences[key] === value) return true;

      readSequence++;
      pendingRead = null;
      set({ isSaving: true, pendingKey: key, saveError: null });
      try {
        const preferences = await balancePreferencesApi.patchPreference(key, value);
        if (!current(scope)) return false;
        set((latest) => ({
          preferences,
          isSaving: false,
          pendingKey: null,
          saveError: null,
          needsReconciliation: false,
          revision: latest.revision + 1,
        }));
        return true;
      } catch (error) {
        if (!current(scope) || expired(error, scope)) return false;
        set({
          isSaving: false,
          pendingKey: null,
          needsReconciliation: true,
          saveError: getApiErrorMessage(error, "Não foi possível confirmar a alteração da preferência."),
        });
        // A lost response may follow a committed write. Reconcile once, never resend.
        await read(scope);
        return false;
      } finally {
        if (current(scope)) set({ isSaving: false, pendingKey: null });
      }
    },
  };
});

useAuthStore.subscribe((state) => {
  if (state.hasHydrated) synchronizeSession();
});

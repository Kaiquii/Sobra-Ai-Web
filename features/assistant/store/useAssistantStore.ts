"use client";

import axios from "axios";
import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useExpenseStore } from "@/features/expenses/store/useExpenseStore";
import { getBrowserAuthToken } from "@/lib/auth-cookie";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { assistantApi } from "../api/assistantApi";
import { assistantErrorDetails } from "../api/assistantErrors";
import type { AssistantConversation, AssistantMessage } from "../types/assistant";

type AssistantState = {
  activeConversationId: number | null;
  conversations: AssistantConversation[];
  draft: string;
  error: string | null;
  errorCode: string | null;
  historyError: string | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  deletingConversationId: number | null;
  messages: AssistantMessage[];
  messagesError: string | null;
  retryAfterSeconds: number | null;
  retryUntil: number | null;
  sessionRevision: number;
  clearError: () => void;
  clearRetry: () => void;
  syncSession: () => void;
  setDraft: (value: string) => void;
  deleteConversation: (id: number) => Promise<boolean>;
  loadConversations: () => Promise<void>;
  loadMessages: (id: number) => Promise<boolean>;
  sendMessage: (message: string) => Promise<boolean>;
  setActiveConversation: (id: number) => Promise<boolean>;
  startNewConversation: () => boolean;
};

const initial = {
  activeConversationId: null,
  conversations: [] as AssistantConversation[],
  draft: "",
  error: null,
  errorCode: null,
  historyError: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  deletingConversationId: null,
  messages: [] as AssistantMessage[],
  messagesError: null,
  retryAfterSeconds: null,
  retryUntil: null,
};

function localMessage(role: "user" | "assistant", content: string): AssistantMessage {
  return { role, content, created_at: new Date().toISOString(), id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}` };
}

export const useAssistantStore = create<AssistantState>((set, get) => {
  let owner: string | null = null;
  let generation = 0;
  let historyRevision = 0;

  function session() {
    const auth = useAuthStore.getState();
    // Initial hydration has not observed a session yet; it is not a logout.
    if (!auth.hasHydrated) return null;
    const token = auth.isAuthenticated ? getBrowserAuthToken() : null;
    if (owner !== token) {
      owner = token;
      generation++;
      historyRevision++;
      set({ ...initial, conversations: [], messages: [], sessionRevision: generation });
    }
    return token ? { token, generation } : null;
  }
  function current(scope: { token: string; generation: number }) {
    const auth = useAuthStore.getState();
    return (
      scope.generation === generation &&
      scope.token === owner &&
      scope.token === getBrowserAuthToken() &&
      (!auth.hasHydrated || auth.isAuthenticated)
    );
  }
  function busy() {
    const state = get();
    return state.isSending || state.isLoadingMessages || state.deletingConversationId !== null;
  }
  function expired(error: unknown) {
    if (![401, 403].includes(getApiErrorStatus(error) ?? 0)) return false;
    useAuthStore.getState().logout(getApiErrorMessage(error, "Sua sessão expirou."));
    get().syncSession();
    return true;
  }
  function failure(value: unknown, fallback: string) {
    const details = assistantErrorDetails(value);
    set({
      error: details.message ?? getApiErrorMessage(value, fallback),
      errorCode: details.code,
      retryAfterSeconds: details.retryAfterSeconds,
      retryUntil:
        details.recognized && details.retryAfterSeconds !== null
          ? Date.now() + details.retryAfterSeconds * 1000
          : null,
    });
  }
  return {
    ...initial,
    sessionRevision: 0,
    syncSession: () => {
      session();
    },
    clearError: () => set({ error: null, errorCode: null }),
    clearRetry: () => {
      if ((get().retryUntil ?? 0) <= Date.now()) set({ retryAfterSeconds: null, retryUntil: null });
    },
    setDraft: (draft) => {
      if (session()) set({ draft });
    },
    loadConversations: async () => {
      const scope = session();
      if (!scope || get().isLoadingConversations || get().deletingConversationId !== null) return;
      const revision = ++historyRevision;
      set({ isLoadingConversations: true });
      try {
        const conversations = await assistantApi.getConversations();
        if (current(scope) && revision === historyRevision)
          set({ conversations, historyError: null });
      } catch (error) {
        if (current(scope) && revision === historyRevision && !expired(error))
          set({
            historyError: getApiErrorMessage(error, "Não foi possível carregar suas conversas."),
          });
      } finally {
        if (current(scope) && revision === historyRevision) set({ isLoadingConversations: false });
      }
    },
    loadMessages: async (id) => {
      const scope = session();
      if (!scope || busy() || !Number.isSafeInteger(id) || id <= 0) return false;
      set({
        activeConversationId: id,
        messages: [],
        messagesError: null,
        error: null,
        errorCode: null,
        isLoadingMessages: true,
      });
      try {
        const messages = await assistantApi.getConversationMessages(id);
        if (!current(scope)) return false;
        set({ messages });
        return true;
      } catch (error) {
        if (current(scope) && !expired(error))
          set({
            messagesError: getApiErrorMessage(error, "Não foi possível carregar esta conversa."),
          });
        return false;
      } finally {
        if (current(scope)) set({ isLoadingMessages: false });
      }
    },
    sendMessage: async (message) => {
      const scope = session();
      const clean = message.trim();
      if (!scope || !clean || busy() || get().messagesError || (get().retryUntil ?? 0) > Date.now())
        return false;
      get().clearRetry();
      const { activeConversationId, messages: previousMessages } = get();
      set({
        error: null,
        errorCode: null,
        isSending: true,
        messages: [...previousMessages, localMessage("user", clean)],
      });
      let refreshHistory = false;
      try {
        // One request only: a lost response may already have executed a financial action.
        const response = await assistantApi.sendMessage({
          message: clean,
          ...(activeConversationId !== null ? { conversation_id: activeConversationId } : {}),
        });
        if (!current(scope)) return false;
        const details = assistantErrorDetails(response);
        const id = response?.conversation_id;
        if (details.code) {
          failure(response, "O Assistente não está disponível agora.");
          set({
            messages: previousMessages,
            ...(typeof id === "number" && Number.isSafeInteger(id) && id > 0
              ? { activeConversationId: id }
              : {}),
          });
          return false;
        }
        if (!Number.isSafeInteger(id) || (id ?? 0) <= 0 || typeof response?.reply !== "string")
          throw new Error("Resposta do Assistente inválida.");
        const reply = {
          ...localMessage("assistant", response.reply),
          tool_call: response.tool_call,
          tool_result: response.tool_result,
        };
        set((state) => ({
          activeConversationId: id!,
          messages: [...state.messages, reply],
          draft: state.draft.trim() === clean ? "" : state.draft,
        }));
        if (
          response.tool_call === "create_expense" &&
          typeof response.tool_result === "object" &&
          response.tool_result !== null &&
          "status" in response.tool_result &&
          response.tool_result.status === "created"
        ) {
          useExpenseStore.setState((state) => ({ revision: state.revision + 1 }));
        }
        refreshHistory = true;
        return true;
      } catch (error) {
        if (!current(scope) || expired(error)) return false;
        failure(error, "Não foi possível enviar a mensagem agora.");
        const unknownResult =
          !axios.isAxiosError(error) || !error.response || error.response.status >= 500;
        if (unknownResult) {
          set((state) => ({
            error:
              state.error +
              " A confirmação não chegou; a mensagem pode ter sido recebida. Confira o histórico antes de tentar novamente. O envio não será repetido automaticamente.",
          }));
        } else set({ messages: previousMessages });
        return false;
      } finally {
        if (current(scope)) {
          set({ isSending: false });
          if (refreshHistory) {
            historyRevision++;
            set({ isLoadingConversations: false });
            void get().loadConversations();
          }
        }
      }
    },
    setActiveConversation: (id) => get().loadMessages(id),
    startNewConversation: () => {
      if (!session() || busy()) return false;
      // Cooldown belongs to the account, not the selected conversation.
      set({
        activeConversationId: null,
        messages: [],
        messagesError: null,
        error: null,
        errorCode: null,
      });
      return true;
    },
    deleteConversation: async (id) => {
      const scope = session();
      if (!scope || busy() || !Number.isSafeInteger(id) || id <= 0) return false;
      ++historyRevision;
      set({
        deletingConversationId: id,
        isLoadingConversations: false,
        error: null,
        errorCode: null,
      });
      try {
        await assistantApi.deleteConversation(id);
        if (!current(scope)) return false;
        set((state) => ({
          conversations: state.conversations.filter((item) => item.id !== id),
          ...(state.activeConversationId === id
            ? { activeConversationId: null, messages: [], messagesError: null }
            : {}),
        }));
        return true;
      } catch (error) {
        if (current(scope) && !expired(error))
          set({ error: getApiErrorMessage(error, "Não foi possível excluir esta conversa.") });
        return false;
      } finally {
        if (current(scope)) set({ deletingConversationId: null });
      }
    },
  };
});

useAuthStore.subscribe((state) => {
  if (state.hasHydrated) useAssistantStore.getState().syncSession();
});

"use client";

import axios from "axios";
import { create } from "zustand";

import { assistantApi } from "@/features/assistant/api/assistantApi";
import type {
  AssistantChatResponse,
  AssistantConversation,
  AssistantMessage,
} from "@/features/assistant/types/assistant";
import { getApiErrorMessage } from "@/lib/api-errors";

type AssistantState = {
  activeConversationId: number | null;
  conversations: AssistantConversation[];
  error: string | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  messages: AssistantMessage[];
  retryAfterSeconds: number | null;
  retryUntil: number | null;
  clearError: () => void;
  clearRetry: () => void;
  deleteConversation: (id: number) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  setActiveConversation: (conversationId: number) => void;
  startNewConversation: () => void;
};

function normalizeMessageContent(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(normalizeMessageContent).filter(Boolean).join("\n");
  }

  return String(value);
}

function createLocalMessage(role: "assistant" | "user", content: unknown) {
  return {
    content: normalizeMessageContent(content),
    created_at: new Date().toISOString(),
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
  };
}

function getRetryUntil(response: Pick<AssistantChatResponse, "retry_after_seconds">) {
  if (!response.retry_after_seconds) {
    return null;
  }

  return Date.now() + response.retry_after_seconds * 1000;
}

function getRetryAfterSeconds(
  response: Pick<AssistantChatResponse, "retry_after_seconds">,
) {
  return response.retry_after_seconds ?? null;
}

function getAssistantErrorPayload(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data;

  if (typeof data !== "object" || data === null) {
    return null;
  }

  return data as Partial<AssistantChatResponse>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  activeConversationId: null,
  conversations: [],
  error: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  messages: [],
  retryAfterSeconds: null,
  retryUntil: null,

  clearError: () => set({ error: null }),

  clearRetry: () => set({ retryAfterSeconds: null, retryUntil: null }),

  deleteConversation: async (id) => {
    set({ error: null });

    try {
      await assistantApi.deleteConversation(id);

      set((state) => {
        const isActive = state.activeConversationId === id;

        return {
          activeConversationId: isActive ? null : state.activeConversationId,
          conversations: state.conversations.filter(
            (conversation) => conversation.id !== id,
          ),
          messages: isActive ? [] : state.messages,
        };
      });
    } catch (error) {
      set({ error: getApiErrorMessage(error) });
      throw error;
    }
  },

  loadConversations: async () => {
    set({ error: null, isLoadingConversations: true });

    try {
      const conversations = await assistantApi.getConversations();
      set({ conversations, isLoadingConversations: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(
          error,
          "Não foi possível carregar suas conversas.",
        ),
        isLoadingConversations: false,
      });
    }
  },

  loadMessages: async (conversationId) => {
    set({
      activeConversationId: conversationId,
      error: null,
      isLoadingMessages: true,
      messages: [],
    });

    try {
      const messages = await assistantApi.getConversationMessages(conversationId);
      set({ isLoadingMessages: false, messages });
    } catch (error) {
      set({
        error: getApiErrorMessage(
          error,
          "Não foi possível carregar as mensagens desta conversa.",
        ),
        isLoadingMessages: false,
      });
    }
  },

  sendMessage: async (message) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const { activeConversationId } = get();
    const userMessage = createLocalMessage("user", trimmedMessage);

    set((state) => ({
      error: null,
      isSending: true,
      messages: [...state.messages, userMessage],
    }));

    try {
      const response = await assistantApi.sendMessage({
        conversation_id: activeConversationId ?? undefined,
        message: trimmedMessage,
      });
      const assistantMessage = createLocalMessage("assistant", response.reply);

      set((state) => ({
        activeConversationId: response.conversation_id,
        isSending: false,
        messages: [...state.messages, assistantMessage],
        retryAfterSeconds: getRetryAfterSeconds(response),
        retryUntil: getRetryUntil(response),
      }));

      void get().loadConversations();
    } catch (error) {
      const payload = getAssistantErrorPayload(error);
      const retryUntil = payload ? getRetryUntil(payload) : null;
      const reply = payload?.reply;

      set((state) => ({
        error: getApiErrorMessage(
          error,
          reply ?? "Não foi possível enviar a mensagem agora.",
        ),
        isSending: false,
        messages: reply
          ? [...state.messages, createLocalMessage("assistant", reply)]
          : state.messages,
        retryAfterSeconds: payload ? getRetryAfterSeconds(payload) : null,
        retryUntil,
      }));
    }
  },

  setActiveConversation: (conversationId) => {
    void get().loadMessages(conversationId);
  },

  startNewConversation: () =>
    set({
      activeConversationId: null,
      error: null,
      messages: [],
      retryAfterSeconds: null,
      retryUntil: null,
    }),
}));

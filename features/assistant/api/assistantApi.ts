import { apiClient } from "@/lib/api";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantConversation,
  AssistantConversationsResponse,
  AssistantMessage,
  AssistantMessagesResponse,
} from "@/features/assistant/types/assistant";

const isAssistantDebugEnabled = process.env.NODE_ENV !== "production";

function logAssistantDebug(label: string, data?: unknown) {
  if (isAssistantDebugEnabled) {
    console.debug(`[assistant] ${label}`, data);
  }
}

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeConversation(conversation: AssistantConversation) {
  const id =
    toNumber(conversation.id) ?? toNumber(conversation.conversation_id) ?? 0;

  return {
    ...conversation,
    conversation_id: toNumber(conversation.conversation_id) ?? id,
    id,
  };
}

function normalizeConversationsResponse(data: AssistantConversationsResponse) {
  const conversations = Array.isArray(data)
    ? data
    : data.conversations ?? data.data ?? [];

  return conversations.map(normalizeConversation);
}

function normalizeTextContent(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextContent(item))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    if ("text" in value) {
      return normalizeTextContent(value.text);
    }

    if ("content" in value) {
      return normalizeTextContent(value.content);
    }
  }

  return String(value);
}

function normalizeMessagesResponse(data: AssistantMessagesResponse) {
  const messages = Array.isArray(data) ? data : data.messages ?? data.data ?? [];

  return messages.map((message) => ({
    ...message,
    content: normalizeTextContent(message.content),
    id: message.id ?? message.message_id,
  }));
}

export const assistantApi = {
  async deleteConversation(id: number) {
    await apiClient.delete(`/api/assistant/conversations/${id}`);
  },

  async getConversationMessages(id: number): Promise<AssistantMessage[]> {
    logAssistantDebug("GET conversation messages:start", {
      conversationId: id,
      url: `/api/assistant/conversations/${id}/messages`,
    });

    const response = await apiClient.get<AssistantMessagesResponse>(
      `/api/assistant/conversations/${id}/messages`,
    );

    const messages = normalizeMessagesResponse(response.data);

    logAssistantDebug("GET conversation messages:success", {
      conversationId: id,
      messageIds: messages.map((message) => ({
        conversation_id: message.conversation_id,
        id: message.id,
        message_id: message.message_id,
        role: message.role,
      })),
      raw: response.data,
    });

    return messages;
  },

  async getConversations(): Promise<AssistantConversation[]> {
    const response = await apiClient.get<AssistantConversationsResponse>(
      "/api/assistant/conversations",
    );

    const conversations = normalizeConversationsResponse(response.data);

    logAssistantDebug("GET conversations:success", {
      conversationIds: conversations.map((conversation) => ({
        conversation_id: conversation.conversation_id,
        id: conversation.id,
        title: conversation.title,
      })),
      raw: response.data,
    });

    return conversations;
  },

  async sendMessage(data: AssistantChatRequest): Promise<AssistantChatResponse> {
    logAssistantDebug("POST chat:start", data);

    const response = await apiClient.post<AssistantChatResponse>(
      "/api/assistant/chat",
      data,
    );

    logAssistantDebug("POST chat:success", response.data);

    return response.data;
  },
};

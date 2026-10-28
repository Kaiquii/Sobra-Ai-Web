import { apiClient } from "@/lib/api";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantConversation,
  AssistantConversationsResponse,
  AssistantMessage,
  AssistantMessagesResponse,
} from "@/features/assistant/types/assistant";

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeConversation(conversation: AssistantConversation) {
  const id = toNumber(conversation.id) ?? toNumber(conversation.conversation_id) ?? 0;

  return {
    ...conversation,
    conversation_id: toNumber(conversation.conversation_id) ?? id,
    id,
  };
}

function normalizeConversationsResponse(data: AssistantConversationsResponse) {
  const conversations = Array.isArray(data) ? data : (data.conversations ?? data.data ?? []);

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
  const messages = Array.isArray(data) ? data : (data.messages ?? data.data ?? []);

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
    const response = await apiClient.get<AssistantMessagesResponse>(
      `/api/assistant/conversations/${id}/messages`,
    );

    const messages = normalizeMessagesResponse(response.data);

    return messages;
  },

  async getConversations(): Promise<AssistantConversation[]> {
    const response = await apiClient.get<AssistantConversationsResponse>(
      "/api/assistant/conversations",
    );

    const conversations = normalizeConversationsResponse(response.data);

    return conversations;
  },

  async sendMessage(data: AssistantChatRequest): Promise<AssistantChatResponse> {
    const response = await apiClient.post<AssistantChatResponse>("/api/assistant/chat", {
      message: data.message,
      ...(data.conversation_id != null ? { conversation_id: data.conversation_id } : {}),
    });

    return response.data;
  },
};

import { apiClient } from "@/lib/api";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantConversation,
  AssistantConversationsResponse,
  AssistantMessage,
  AssistantMessagesResponse,
} from "@/features/assistant/types/assistant";

function normalizeConversationsResponse(data: AssistantConversationsResponse) {
  if (Array.isArray(data)) {
    return data;
  }

  return data.conversations ?? data.data ?? [];
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

    return normalizeMessagesResponse(response.data);
  },

  async getConversations(): Promise<AssistantConversation[]> {
    const response = await apiClient.get<AssistantConversationsResponse>(
      "/api/assistant/conversations",
    );

    return normalizeConversationsResponse(response.data);
  },

  async sendMessage(data: AssistantChatRequest): Promise<AssistantChatResponse> {
    const response = await apiClient.post<AssistantChatResponse>(
      "/api/assistant/chat",
      data,
    );

    return response.data;
  },
};

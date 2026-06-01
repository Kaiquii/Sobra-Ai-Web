export type AssistantRole = "assistant" | "system" | "user" | string;

export type AssistantConversation = {
  conversation_id?: number;
  created_at?: string;
  display_date?: string;
  display_label?: string;
  display_time?: string;
  id: number;
  last_message?: string | null;
  message_count?: number;
  title?: string | null;
  updated_at?: string;
};

export type AssistantMessage = {
  content: string;
  conversation_id?: number;
  created_at?: string;
  display_time?: string;
  id?: number | string;
  message_id?: number;
  role: AssistantRole;
  tool_call?: string | null;
  tool_result?: unknown;
};

export type AssistantChatRequest = {
  conversation_id?: number;
  message: string;
};

export type AssistantChatResponse = {
  conversation_id: number;
  error_code?: string;
  reply: string;
  retry_after_seconds?: number;
  tool_call?: string | null;
  tool_result?: unknown;
};

export type AssistantConversationsResponse =
  | AssistantConversation[]
  | {
      conversations?: AssistantConversation[];
      data?: AssistantConversation[];
      total?: number;
    };

export type AssistantMessagesResponse =
  | AssistantMessage[]
  | {
      data?: AssistantMessage[];
      messages?: AssistantMessage[];
    };

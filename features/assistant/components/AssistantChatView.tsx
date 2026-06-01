"use client";

import {
  Bot,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { useAssistantStore } from "@/features/assistant/store/useAssistantStore";
import type {
  AssistantConversation,
  AssistantMessage,
} from "@/features/assistant/types/assistant";
import { cn } from "@/lib/utils";

type AssistantChatDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatMessageTime(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : timeFormatter.format(date);
}

function getMessageTime(message: AssistantMessage) {
  return message.display_time ?? formatMessageTime(message.created_at);
}

function getConversationLabel(conversation: AssistantConversation) {
  return (
    conversation.title?.trim() ||
    conversation.last_message?.trim() ||
    `Conversa ${conversation.id}`
  );
}

function getConversationDescription(conversation: AssistantConversation) {
  if (conversation.display_label?.trim()) {
    return conversation.display_label;
  }

  if (conversation.display_date?.trim()) {
    return conversation.display_time
      ? `${conversation.display_date} ${conversation.display_time}`
      : conversation.display_date;
  }

  if (conversation.last_message?.trim() && conversation.title?.trim()) {
    return conversation.last_message;
  }

  if (!conversation.updated_at) {
    return "Nova conversa";
  }

  const date = new Date(conversation.updated_at);

  return Number.isNaN(date.getTime())
    ? "Nova conversa"
    : date.toLocaleDateString("pt-BR");
}

function getConversationKey(conversation: AssistantConversation, index: number) {
  return `${conversation.id ?? "conversation"}-${index}`;
}

function getMessageKey(message: AssistantMessage, index: number) {
  return `${message.id ?? message.created_at ?? message.role}-${index}`;
}

function renderText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(renderText).filter(Boolean).join("\n");
  }

  return String(value);
}

type ConversationButtonProps = {
  conversation: AssistantConversation;
  isActive: boolean;
  onDelete: (conversation: AssistantConversation) => void;
  onSelect: (conversationId: number) => void;
};

function ConversationButton({
  conversation,
  isActive,
  onDelete,
  onSelect,
}: ConversationButtonProps) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 transition-colors",
        isActive
          ? "bg-emerald-50 [--conversation-hover-bg:#d1fae5] hover:bg-[var(--conversation-hover-bg)] dark:bg-emerald-950/35 dark:[--conversation-hover-bg:rgb(2_44_34_/_0.45)]"
          : "[--conversation-hover-bg:#ecfdf5] hover:bg-[var(--conversation-hover-bg)] dark:[--conversation-hover-bg:rgb(2_44_34_/_0.4)]",
      )}
    >
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelect(conversation.id)}
        type="button"
      >
        <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
          {getConversationLabel(conversation)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
          {getConversationDescription(conversation)}
        </span>
      </button>
      <button
        aria-label="Excluir conversa"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/35 dark:hover:text-red-300"
        onClick={() => onDelete(conversation)}
        title="Excluir conversa"
        type="button"
      >
        <Trash2 aria-hidden="true" size={15} strokeWidth={2.25} />
      </button>
    </div>
  );
}

function ChatMessage({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  const time = getMessageTime(message);

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[82%]">
        <div
          className={cn(
            "whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-6 shadow-sm",
            isUser
              ? "rounded-br-sm bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950"
              : "rounded-bl-sm bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100",
          )}
        >
          {renderText(message.content)}
        </div>
        {time ? (
          <p
            className={cn(
              "mt-1 text-xs text-slate-400",
              isUser ? "text-right" : "text-left",
            )}
          >
            {time}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="flex h-full items-center justify-center px-4 py-10 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300">
          <Bot aria-hidden="true" size={25} strokeWidth={2.25} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">
          Assistente financeiro
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Envie uma mensagem para começar.
        </p>
      </div>
    </div>
  );
}

export function AssistantChatDialog({ isOpen, onClose }: AssistantChatDialogProps) {
  useLockBodyScroll(isOpen);

  const activeConversationId = useAssistantStore(
    (state) => state.activeConversationId,
  );
  const clearError = useAssistantStore((state) => state.clearError);
  const clearRetry = useAssistantStore((state) => state.clearRetry);
  const conversations = useAssistantStore((state) => state.conversations);
  const deleteConversation = useAssistantStore((state) => state.deleteConversation);
  const error = useAssistantStore((state) => state.error);
  const isLoadingConversations = useAssistantStore(
    (state) => state.isLoadingConversations,
  );
  const isLoadingMessages = useAssistantStore((state) => state.isLoadingMessages);
  const isSending = useAssistantStore((state) => state.isSending);
  const loadConversations = useAssistantStore((state) => state.loadConversations);
  const messages = useAssistantStore((state) => state.messages);
  const retryAfterSeconds = useAssistantStore((state) => state.retryAfterSeconds);
  const retryUntil = useAssistantStore((state) => state.retryUntil);
  const sendMessage = useAssistantStore((state) => state.sendMessage);
  const setActiveConversation = useAssistantStore(
    (state) => state.setActiveConversation,
  );
  const startNewConversation = useAssistantStore((state) => state.startNewConversation);

  const [deleteTarget, setDeleteTarget] = useState<AssistantConversation | null>(null);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      void loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages, isSending]);

  useEffect(() => {
    if (!retryUntil) {
      return;
    }

    const timeoutId = window.setTimeout(
      clearRetry,
      Math.max(retryUntil - Date.now(), 0),
    );

    return () => window.clearTimeout(timeoutId);
  }, [clearRetry, retryUntil]);

  if (!isOpen) {
    return null;
  }

  const isInputDisabled = isSending || isLoadingMessages || Boolean(retryUntil);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim() || isInputDisabled) {
      return;
    }

    const nextMessage = draft;
    setDraft("");
    await sendMessage(nextMessage);
  }

  async function handleDeleteConversation() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteConversation(deleteTarget.id);
      setDeleteTarget(null);
    } catch {}
  }

  return (
    <>
      <div
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-3 py-4 backdrop-blur-sm sm:px-5"
        role="dialog"
      >
        <div className="flex h-[calc(100vh-2rem)] min-h-0 w-[calc(100vw-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900 sm:h-[82vh] sm:min-h-[620px] sm:w-[92vw] sm:max-h-[820px] sm:flex-row">
          <aside className="flex h-48 w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70 sm:h-auto sm:w-80 sm:border-b-0 sm:border-r">
            <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-800">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  Histórico
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Outras conversas
                </p>
              </div>
              <Button
                aria-label="Nova conversa"
                onClick={() => {
                  clearError();
                  startNewConversation();
                }}
                size="iconSm"
                title="Nova conversa"
                type="button"
              >
                <Plus aria-hidden="true" size={17} strokeWidth={2.25} />
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {isLoadingConversations ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  Carregando conversas...
                </div>
              ) : null}

              {!isLoadingConversations && !conversations.length ? (
                <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma conversa ainda.
                </p>
              ) : null}

              {conversations.map((conversation, index) => (
                <div key={getConversationKey(conversation, index)}>
                  <ConversationButton
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onDelete={setDeleteTarget}
                    onSelect={setActiveConversation}
                  />
                </div>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-100 dark:bg-slate-950">
            <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300">
                  <MessageCircle aria-hidden="true" size={21} strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">
                    Chat com IA
                  </h1>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {activeConversationId
                      ? `Conversa ${activeConversationId}`
                      : "Nova conversa"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="Fechar assistente"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  onClick={onClose}
                  title="Fechar"
                  type="button"
                >
                  <X aria-hidden="true" size={19} strokeWidth={2.25} />
                </button>
              </div>
            </div>

            {error ? (
              <div className="shrink-0 px-4 pt-4">
                <Alert variant="error">{renderText(error)}</Alert>
              </div>
            ) : null}

            {retryUntil ? (
              <div className="shrink-0 px-4 pt-4">
                <Alert variant="info">
                  {retryAfterSeconds
                    ? `Aguarde ${retryAfterSeconds}s para enviar uma nova mensagem.`
                    : "Aguarde alguns instantes para enviar uma nova mensagem."}
                </Alert>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 aria-hidden="true" className="animate-spin" size={17} />
                  Carregando mensagens...
                </div>
              ) : null}

              {!isLoadingMessages && !messages.length ? <EmptyConversation /> : null}

              {!isLoadingMessages && messages.length ? (
                <div className="flex flex-col gap-3">
                  {messages.map((message, index) => (
                    <div key={getMessageKey(message, index)}>
                      <ChatMessage message={message} />
                    </div>
                  ))}

                  {isSending ? (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-lg rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        <Loader2
                          aria-hidden="true"
                          className="animate-spin"
                          size={16}
                        />
                        Pensando...
                      </div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              ) : null}
            </div>

            <form
              className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              onSubmit={handleSubmit}
            >
              <div className="flex items-end gap-2">
                <textarea
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950 dark:focus:ring-emerald-950"
                  disabled={isInputDisabled}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Mensagem"
                  rows={1}
                  value={draft}
                />
                <Button
                  aria-label="Enviar mensagem"
                  className="h-11 w-11 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                  disabled={isInputDisabled || !draft.trim()}
                  size="icon"
                  title="Enviar mensagem"
                  type="submit"
                >
                  {isSending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                  ) : (
                    <Send aria-hidden="true" size={18} strokeWidth={2.25} />
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <ConfirmationDialog
        confirmLabel="Excluir"
        description="Essa conversa será removida do seu histórico."
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConversation}
        title="Excluir conversa?"
        tone="danger"
      />
    </>
  );
}

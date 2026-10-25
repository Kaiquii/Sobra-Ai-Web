"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function AppNotification({
  message,
  tone = "success",
}: {
  message: string | null;
  tone?: "success" | "info";
}) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setDismissed(message), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);
  if (!message || dismissed === message) return null;
  const Icon = tone === "success" ? CheckCircle2 : Info;
  return createPortal(
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-80 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:bottom-6"
    >
      <Icon
        aria-hidden="true"
        className={
          tone === "success"
            ? "shrink-0 text-emerald-500"
            : "shrink-0 text-brand"
        }
        size={20}
      />
      <p className="min-w-0 flex-1 wrap-anywhere">{message}</p>
      <button
        aria-label="Fechar aviso"
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        type="button"
        onClick={() => setDismissed(message)}
      >
        <X aria-hidden="true" size={18} />
      </button>
    </div>,
    document.body,
  );
}

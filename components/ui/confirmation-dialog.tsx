"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "default";
};

export function ConfirmationDialog({
  cancelLabel = "Cancelar",
  children,
  confirmLabel = "Confirmar",
  description,
  isOpen,
  onClose,
  onConfirm,
  title,
  tone = "default",
}: ConfirmationDialogProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen) {
    return null;
  }

  const isDanger = tone === "danger";

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex gap-4">
          <div
            className={
              isDanger
                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            }
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {description}
            </p>
            {children ? <div className="mt-4">{children}</div> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            className={
              isDanger
                ? "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus-visible:ring-red-300 dark:bg-red-500 dark:text-white dark:hover:bg-red-400"
                : undefined
            }
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

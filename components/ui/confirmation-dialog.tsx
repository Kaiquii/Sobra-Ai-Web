"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { ModalPanel } from "@/components/ui/modal-panel";

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  children?: ReactNode;
  isSubmitting?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "default";
  nativeModal?: boolean;
};

export function ConfirmationDialog({
  cancelLabel = "Cancelar",
  children,
  confirmLabel = "Confirmar",
  description,
  isSubmitting = false,
  isOpen,
  onClose,
  onConfirm,
  title,
  tone = "default",
  nativeModal = false,
}: ConfirmationDialogProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen) {
    return null;
  }

  const isDanger = tone === "danger";

  if (nativeModal) return <ModalPanel title={title} onClose={onClose} busy={isSubmitting} icon={<AlertTriangle aria-hidden="true" size={24} className={isDanger ? "text-red-600 dark:text-red-300" : "text-brand"} />}>
    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    {children ? <div className="mt-3">{children}</div> : null}
    <div className="mt-5 flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={isSubmitting} onClick={onClose}>{cancelLabel}</Button><Button disabled={isSubmitting} className={isDanger ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-400" : undefined} onClick={onConfirm}>{isSubmitting ? "Aguarde…" : confirmLabel}</Button></div>
  </ModalPanel>;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-6">
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
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            className={
              isDanger
                ? "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus-visible:ring-red-300 dark:bg-red-500 dark:text-white dark:hover:bg-red-400"
                : undefined
            }
            disabled={isSubmitting}
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

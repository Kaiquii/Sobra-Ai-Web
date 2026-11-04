"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { useModalHistory } from "@/components/ui/modal-panel";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";

type ProfilePhotoPreviewDialogProps = {
  avatarUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
};

export function ProfilePhotoPreviewDialog({
  avatarUrl,
  isOpen,
  onClose,
  userName,
}: ProfilePhotoPreviewDialogProps) {
  if (!isOpen || !avatarUrl) {
    return null;
  }

  return <PhotoPreview avatarUrl={avatarUrl} onClose={onClose} userName={userName} />;
}

function PhotoPreview({
  avatarUrl,
  onClose,
  userName,
}: Omit<ProfilePhotoPreviewDialogProps, "isOpen" | "avatarUrl"> & { avatarUrl: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useLockBodyScroll();
  useModalHistory(onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      aria-labelledby={titleId}
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-transparent p-0 text-inherit backdrop:bg-transparent"
    >
      <div
        className="flex min-h-full items-center justify-center bg-slate-900/45 px-[4vw] py-[max(24px,env(safe-area-inset-top),env(safe-area-inset-bottom))] backdrop-blur-sm dark:bg-slate-950/80 sm:px-4 sm:py-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="max-h-[calc(100dvh-48px)] w-full max-w-120 overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/50 sm:max-h-none sm:max-w-2xl sm:overflow-hidden sm:rounded-lg sm:p-0">
          <div className="flex items-center justify-between gap-3 pb-2.5 pl-1.5 sm:gap-0 sm:border-b sm:border-slate-200 sm:px-4 sm:py-3 dark:sm:border-slate-800">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-bold text-slate-950 dark:text-slate-100 sm:text-sm sm:font-semibold"
              >
                Foto de perfil
              </h2>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                {userName?.trim() || "SobraAi"}
              </p>
            </div>

            <button
              aria-label="Fechar visualização da foto"
              className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 sm:h-9 sm:w-9 sm:rounded-md"
              onClick={onClose}
              ref={closeRef}
              type="button"
            >
              <X
                aria-hidden="true"
                className="h-6 w-6 sm:h-4.5 sm:w-4.5"
                size={18}
                strokeWidth={2.25}
              />
            </button>
          </div>

          <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-slate-100 dark:bg-slate-950 sm:aspect-auto sm:h-[min(72vh,620px)] sm:min-h-72 sm:rounded-none">
            <Image
              alt="Foto de perfil ampliada"
              className="object-contain"
              fill
              sizes="(max-width: 639px) 92vw, 672px"
              src={avatarUrl}
            />
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

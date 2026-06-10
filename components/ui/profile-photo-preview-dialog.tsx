"use client";

import { X } from "lucide-react";
import Image from "next/image";

import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";

type ProfilePhotoPreviewDialogProps = {
  avatarUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ProfilePhotoPreviewDialog({
  avatarUrl,
  isOpen,
  onClose,
}: ProfilePhotoPreviewDialogProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen || !avatarUrl) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/80"
      role="dialog"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/50">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Foto de perfil
          </h2>

          <button
            aria-label="Fechar visualização da foto"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={2.25} />
          </button>
        </div>

        <div className="relative h-[min(72vh,620px)] min-h-72 bg-slate-100 dark:bg-slate-950">
          <Image
            alt="Foto de perfil ampliada"
            className="object-contain"
            fill
            sizes="(max-width: 768px) 92vw, 672px"
            src={avatarUrl}
          />
        </div>
      </div>
    </div>
  );
}

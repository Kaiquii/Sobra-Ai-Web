"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";

export function SelectionSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useLockBodyScroll();

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const sheet = sheetRef.current;
    (
      sheet?.querySelector<HTMLElement>('[aria-selected="true"]') ??
      sheet?.querySelector<HTMLElement>("button")
    )?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab" || !sheet) return;
      const items = [
        ...sheet.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], [tabindex="0"]',
        ),
      ];
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-70 flex items-end bg-black/50"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-16px))] w-full flex-col rounded-t-[28px] bg-white text-slate-950 shadow-2xl dark:bg-[#121212] dark:text-white"
      >
        <button
          type="button"
          aria-label="Fechar filtro"
          onClick={onClose}
          className="mx-auto flex h-12 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            aria-hidden="true"
            className="h-1 w-8 rounded-full bg-slate-400 dark:bg-[#CAC4D0]"
          />
        </button>
        <h2 id={titleId} className="mb-4 px-6 text-xl font-bold leading-7">
          {title}
        </h2>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-[max(32px,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

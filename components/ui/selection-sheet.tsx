"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";

export function SelectionSheet({
  title,
  onClose,
  children,
  showCloseButton = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
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
      if (document.querySelector("dialog[open]")) return;
      // A selector can portal its menu outside the sheet. Let its own Escape
      // handler close that menu without discarding the sheet's filter draft.
      const openSelector = sheet?.querySelector<HTMLElement>('[aria-haspopup="listbox"][aria-expanded="true"]');
      if (event.key === "Escape" && openSelector) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab" || !sheet) return;
      const items = [
        ...sheet.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], [tabindex="0"]',
        ),
      ].flatMap((item) => {
        const menuId = item.getAttribute("aria-controls");
        const menu = menuId ? document.getElementById(menuId) : null;
        return menu && !sheet.contains(menu)
          ? [item, ...menu.querySelectorAll<HTMLElement>('button:not(:disabled)')]
          : [item];
      });
      const index = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? (index - 1 + items.length) % items.length
        : (index + 1) % items.length;
      event.preventDefault();
      items[nextIndex]?.focus();
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
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
        className="flex max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-16px))] w-full flex-col rounded-t-[28px] bg-white text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-slate-50"
      >
        <button
          type="button"
          aria-label="Fechar filtro"
          onClick={onClose}
          className="mx-auto flex h-12 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            aria-hidden="true"
            className="h-1 w-8 rounded-full bg-slate-400 dark:bg-slate-500"
          />
        </button>
        <div className="mb-4 flex items-center justify-between gap-3 px-6">
          <h2 id={titleId} className="text-xl font-bold leading-7">{title}</h2>
          {showCloseButton ? <Button aria-label="Fechar filtros" variant="ghost" size="iconSm" onClick={onClose}><X aria-hidden="true" size={22} /></Button> : null}
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-[max(32px,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

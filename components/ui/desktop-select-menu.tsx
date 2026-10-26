"use client";

import { Check } from "lucide-react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function DesktopSelectMenu<T extends string>({
  id,
  label,
  options,
  value,
  triggerRef,
  portalHost,
  onSelect,
  onClose,
}: {
  id: string;
  label: string;
  options: readonly { label: string; value: T }[];
  value: T;
  triggerRef: RefObject<HTMLButtonElement | null>;
  portalHost: HTMLElement | null;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const actions = useRef({ onClose, onSelect });
  useLayoutEffect(() => {
    actions.current = { onClose, onSelect };
  });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;

    function position() {
      if (!menu || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 8,
        padding = 12;
      const below = window.innerHeight - rect.bottom - padding - gap;
      const above = rect.top - padding - gap;
      const openAbove = below < 160 && above > below;
      const height = Math.max(0, Math.min(256, openAbove ? above : below));
      const width = Math.min(rect.width, window.innerWidth - padding * 2);
      Object.assign(menu.style, {
        width: `${width}px`,
        maxHeight: `${height}px`,
        left: `${Math.min(Math.max(padding, rect.left), window.innerWidth - width - padding)}px`,
        top: openAbove ? "auto" : `${rect.bottom + gap}px`,
        bottom: openAbove ? `${window.innerHeight - rect.top + gap}px` : "auto",
        right: "auto",
      });
    }
    position();
    // Non-modal top layer keeps the existing list above dialogs without a backdrop.
    menu.showPopover?.();
    (
      menu.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
      menu.querySelector<HTMLButtonElement>("button")
    )?.focus({ preventScroll: true });

    function outside(event: MouseEvent | FocusEvent) {
      if (
        event.target instanceof Node &&
        !menu?.contains(event.target) &&
        !trigger?.contains(event.target)
      )
        actions.current.onClose();
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      actions.current.onClose();
      trigger?.focus({ preventScroll: true });
    }
    document.addEventListener("mousedown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape, true);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape, true);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      if (typeof menu.showPopover === "function" && menu.matches(":popover-open"))
        menu.hidePopover();
    };
  }, [triggerRef]);

  return createPortal(
    <div
      ref={menuRef}
      id={id}
      role="listbox"
      aria-label={label}
      popover="manual"
      className="fixed z-80 m-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 text-slate-950 shadow-lg shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:shadow-black/30"
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const items = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="option"]'),
        ];
        if (!items.length) return;
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }}
    >
      {options.length ? (
        options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
              option.value === value
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/45 dark:text-blue-200 dark:hover:bg-blue-950/70"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
            )}
            onClick={() => {
              actions.current.onSelect(option.value);
              triggerRef.current?.focus({ preventScroll: true });
            }}
          >
            <span className="min-w-0 truncate">{option.label}</span>
            {option.value === value ? (
              <Check aria-hidden="true" className="shrink-0" size={15} strokeWidth={2.4} />
            ) : null}
          </button>
        ))
      ) : (
        <p role="status" className="p-3 text-sm text-slate-500">
          Nenhuma opção disponível.
        </p>
      )}
    </div>,
    portalHost ?? document.body,
  );
}

"use client";

import { Check, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { filterSelectOptions, selectorHeight } from "@/lib/select-search";
import { cn } from "@/lib/utils";
import { useModalHistory } from "@/components/ui/modal-panel";

export function SelectionDialog<T extends string>({ title, options, value, onSelect, onClose, className }: {
  title: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const titleId = useId();
  const listId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useLockBodyScroll();
  useModalHistory(onClose);
  const filtered = filterSelectOptions(options, query);

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  function updateQuery(next: string) {
    setQuery(next);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  return createPortal(<dialog ref={dialogRef} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}
    style={{ height: selectorHeight(options.length) + 4 }}
    className={cn("selection-dialog fixed inset-0 m-auto w-[calc(100%-40px)] max-w-110 max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-48px)] overflow-hidden rounded-[20px] border border-slate-200 bg-white p-3 text-slate-950 shadow-xl backdrop:bg-black/55 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50", className)}>
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex min-h-12 shrink-0 items-center gap-2 pl-2">
        <h2 id={titleId} className="min-w-0 flex-1 text-lg font-semibold leading-6">{title}</h2>
        <button ref={closeRef} aria-label="Fechar seleção" onClick={onClose} type="button" className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand"><X aria-hidden="true" size={22} /></button>
      </div>
      <div className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-slate-100 pl-3 dark:bg-slate-950">
        <Search aria-hidden="true" className="shrink-0 text-slate-500" size={18} />
        <input ref={searchRef} aria-label="Buscar opções" aria-controls={listId} value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Buscar..." enterKeyHint="done" onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
          if (event.key === "ArrowDown") { event.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); }
        }} className="h-full w-full min-w-0 bg-transparent text-sm outline-none" />
        <div className="h-12 w-12 shrink-0">
          <Button aria-label="Limpar busca" className={cn("h-12 w-12", !query && "invisible")} onClick={() => { updateQuery(""); searchRef.current?.focus({ preventScroll: true }); }} size="icon" variant="ghost" type="button"><X aria-hidden="true" size={18} /></Button>
        </div>
      </div>
      <div ref={listRef} id={listId} role="listbox" aria-label={title} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="option"]')];
        if (!items.length) return;
        event.preventDefault();
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }}>
        {!filtered.length ? <p role="status" className="p-3 text-sm text-slate-500">{options.length ? "Nenhuma opção encontrada." : "Nenhuma opção disponível."}</p> : filtered.map((option) => <button key={option.value} role="option" aria-selected={option.value === value} onClick={() => onSelect(option.value)} type="button" className={cn("flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-base outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand", option.value === value ? "bg-brand/12 font-semibold text-brand hover:bg-brand/20" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
          <span className="min-w-0 flex-1 wrap-anywhere">{option.label}</span>
          {option.value === value ? <Check aria-hidden="true" className="shrink-0" size={20} /> : null}
        </button>)}
      </div>
    </div>
  </dialog>, document.body);
}

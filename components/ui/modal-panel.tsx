"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { cn } from "@/lib/utils";

type ModalEntry = { dismiss: () => void };
const modalStack: ModalEntry[] = [];
let ignoredPops = 0;
let historyArmed = false;
let armTimer: ReturnType<typeof setTimeout> | undefined;
function armHistory() {
  if (historyArmed || ignoredPops || !modalStack.length) return;
  window.history.pushState({ ...window.history.state, modalPanel: true }, "");
  historyArmed = true;
}
function handleModalBack() {
  historyArmed = false;
  if (ignoredPops) {
    ignoredPops--;
    armHistory();
    return;
  }
  const active = modalStack.at(-1);
  if (!active) return;
  armHistory();
  active.dismiss();
}

export function useModalHistory(onBack: () => void) {
  const callback = useRef(onBack);
  useEffect(() => {
    callback.current = onBack;
  }, [onBack]);
  useEffect(() => {
    const entry = { dismiss: () => callback.current() };
    modalStack.push(entry);
    window.addEventListener("popstate", handleModalBack);
    // Defer the push so React's development effect rehearsal adds no history.
    armTimer = setTimeout(armHistory, 0);
    return () => {
      modalStack.splice(modalStack.indexOf(entry), 1);
      if (modalStack.length) return;
      clearTimeout(armTimer);
      if (historyArmed) {
        ignoredPops++;
        historyArmed = false;
        window.history.back();
      }
      setTimeout(() => {
        if (!modalStack.length) {
          window.removeEventListener("popstate", handleModalBack);
          ignoredPops = 0;
        }
      }, 100);
    };
  }, []);
}

/** Native modal isolation, focus restoration and one viewport owner for form sheets. */
export function ModalPanel({
  title,
  children,
  onClose,
  busy = false,
  sheet = false,
  icon,
  headerActions,
  className,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  sheet?: boolean;
  icon?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const keyboard = useRef(false);
  const drag = useRef<{ y: number; pointer: number } | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useLockBodyScroll();
  useModalHistory(() => {
    if (!busy && !(sheet && keyboard.current)) onClose();
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    closeButton.current?.focus({ preventScroll: true });
    const viewport = window.visualViewport;
    let baselineHeight = Math.max(window.innerHeight, viewport?.height ?? 0);
    let baselineWidth = viewport?.width ?? window.innerWidth;
    let baselineScale = viewport?.scale ?? 1;
    const update = () => {
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      const scale = viewport?.scale ?? 1;
      const focused = document.activeElement;
      const editable =
        focused instanceof HTMLInputElement ||
        focused instanceof HTMLTextAreaElement ||
        (focused instanceof HTMLElement && focused.isContentEditable);
      const geometryChanged =
        Math.abs(width - baselineWidth) > baselineWidth * 0.15 ||
        Math.abs(scale - baselineScale) > 0.05;
      if (geometryChanged || !editable) {
        baselineWidth = width;
        baselineScale = scale;
        // Rotation/zoom changes geometry, never the mounted form or its draft.
        if (geometryChanged || height > baselineHeight) baselineHeight = height;
      }
      keyboard.current =
        (editable || keyboard.current) &&
        !geometryChanged &&
        baselineHeight - height > Math.max(120, baselineHeight * 0.18);
      if (dialog) {
        dialog.style.setProperty("--panel-height", `${height}px`);
        dialog.style.setProperty("--panel-top", `${viewport?.offsetTop ?? 0}px`);
        dialog.style.setProperty(
          "--panel-bottom",
          `${Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))}px`,
        );
      }
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [id, sheet]);

  function dismiss() {
    if (!busy && !(sheet && keyboard.current)) onClose();
  }
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={id}
      onTouchStart={(event) => {
        const target = event.target;
        const scroll = dialogRef.current?.querySelector<HTMLElement>("[data-panel-scroll]");
        if (
          !sheet ||
          event.touches.length !== 1 ||
          (scroll?.scrollTop ?? 0) > 0 ||
          !(target instanceof HTMLElement) ||
          target.closest("button,input,textarea,a,[role=button]")
        ) {
          touch.current = null;
          return;
        }
        touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        touch.current = null;
        const end = event.changedTouches[0];
        if (
          start &&
          end &&
          end.clientY - start.y > 72 &&
          end.clientY - start.y > Math.abs(end.clientX - start.x) * 1.3
        )
          dismiss();
      }}
      onTouchCancel={() => {
        touch.current = null;
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dismiss();
      }}
      className={cn(
        "modal-panel fixed m-auto max-h-[calc(var(--panel-height,100dvh)-env(safe-area-inset-top)-env(safe-area-inset-bottom)-48px)] w-[calc(100%-40px)] max-w-110 overflow-hidden rounded-[20px] border-0 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-black/55 dark:bg-slate-900 dark:text-slate-50 sm:w-[calc(100%-32px)] sm:max-w-md sm:rounded-lg sm:border sm:border-slate-200 sm:backdrop:bg-slate-950/75 sm:backdrop:backdrop-blur-sm dark:sm:border-slate-800",
        sheet ? "modal-panel-sheet" : "inset-x-0 top-(--panel-top) bottom-(--panel-bottom)",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-col",
          sheet ? "max-h-[inherit]" : "h-full max-h-[inherit]",
        )}
      >
        {sheet ? (
          <button
            type="button"
            aria-label="Fechar painel"
            disabled={busy}
            onClick={dismiss}
            onPointerDown={(event) => {
              drag.current = { y: event.clientY, pointer: event.pointerId };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              if (drag.current?.pointer === event.pointerId && event.clientY - drag.current.y > 72)
                dismiss();
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            className="mx-auto flex h-9 w-16 shrink-0 touch-none cursor-pointer items-center justify-center disabled:cursor-not-allowed sm:hidden"
          >
            <span aria-hidden="true" className="h-1 w-8 rounded-full bg-slate-400" />
          </button>
        ) : null}
        <div className="flex shrink-0 items-center gap-2.5 px-5 pb-3.5 pt-4 sm:px-6 sm:pb-5 sm:pt-6">
          {icon ? <span className={sheet ? "sm:hidden" : undefined}>{icon}</span> : null}
          <h2
            id={id}
            className="min-w-0 flex-1 wrap-anywhere text-xl font-bold leading-7 sm:font-semibold"
          >
            {title}
          </h2>
          <button
            ref={closeButton}
            type="button"
            aria-label={`Fechar ${title}`}
            disabled={busy}
            onClick={() => {
              if (!busy) onClose();
            }}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 sm:-mr-1 sm:-mt-1 sm:h-10 sm:w-10 sm:rounded-lg"
          >
            <X aria-hidden="true" size={24} />
          </button>
        </div>
        {headerActions ? <div className="shrink-0 px-5 pb-3 sm:px-6">{headerActions}</div> : null}
        <div
          data-panel-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
        >
          {children}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

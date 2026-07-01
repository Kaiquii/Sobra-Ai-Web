"use client";

import { ChevronDown, Check } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type DropdownIconProps = {
  "aria-hidden"?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
};

type DropdownOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type DropdownSelectProps<TValue extends string> = {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ComponentType<DropdownIconProps>;
  id?: string;
  onChange: (value: TValue) => void;
  options: DropdownOption<TValue>[];
  triggerClassName?: string;
  value: TValue;
};

export function DropdownSelect<TValue extends string>({
  ariaLabel,
  className,
  disabled = false,
  icon: Icon,
  id,
  onChange,
  options,
  triggerClassName,
  value,
}: DropdownSelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const maxMenuHeight = 256;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
    const spaceAbove = rect.top - viewportPadding - gap;
    const shouldOpenAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      120,
      Math.min(maxMenuHeight, shouldOpenAbove ? spaceAbove : spaceBelow),
    );
    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding,
    );

    setMenuStyle({
      left,
      maxHeight: availableHeight,
      width,
      ...(shouldOpenAbove
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !dropdownRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useLayoutEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen, updateMenuPosition]);

  function selectOption(nextValue: TValue) {
    if (disabled) {
      return;
    }

    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-800 outline-none hover:border-slate-300 hover:bg-white focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-950 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-950/60",
          triggerClassName,
        )}
        disabled={disabled}
        id={id}
        onClick={() => {
          updateMenuPosition();
          setIsOpen((current) => !current);
        }}
        ref={triggerRef}
        type="button"
      >
        {Icon ? (
          <Icon
            aria-hidden={true}
            className="shrink-0 text-slate-400"
            size={16}
            strokeWidth={2.25}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("shrink-0 text-slate-400", isOpen && "rotate-180")}
          size={16}
          strokeWidth={2.25}
        />
      </button>

      {isOpen && menuStyle
        ? createPortal(
            <div
              className="fixed z-[70] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
              id={listboxId}
              ref={menuRef}
              role="listbox"
              style={menuStyle}
            >
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold",
                      isSelected
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-200"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                    key={option.value}
                    onClick={() => selectOption(option.value)}
                    role="option"
                    type="button"
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {isSelected ? (
                      <Check
                        aria-hidden="true"
                        className="shrink-0"
                        size={15}
                        strokeWidth={2.4}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>,
          document.body,
        )
        : null}
    </div>
  );
}

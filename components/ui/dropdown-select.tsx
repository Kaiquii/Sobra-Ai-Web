"use client";

import { ChevronDown, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

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
          "flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 hover:bg-white focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-950 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-950/60",
          triggerClassName,
        )}
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
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
          className={cn("shrink-0 text-slate-400 transition", isOpen && "rotate-180")}
          size={16}
          strokeWidth={2.25}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 top-12 z-50 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
          id={listboxId}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
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
        </div>
      ) : null}
    </div>
  );
}

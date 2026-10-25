"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SelectionDialog } from "@/components/ui/selection-dialog";
import { cn } from "@/lib/utils";

type DropdownIconProps = {
  "aria-hidden"?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
};

type DropdownSelectProps<TValue extends string> = {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ComponentType<DropdownIconProps>;
  id?: string;
  onChange: (value: TValue) => void;
  options: { label: string; value: TValue }[];
  triggerClassName?: string;
  presentation?: "popover" | "sheet";
  variant?: "default" | "filter";
  sheetTitle?: string;
  triggerLabel?: string;
  trailingAction?: ReactNode;
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
  variant = "default",
  sheetTitle,
  triggerLabel,
  trailingAction,
  value,
}: DropdownSelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const isFilter = variant === "filter";
  const isActive = value !== options[0]?.value;

  return (
    <div className={cn("relative", className)}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={cn(
          isFilter
            ? "flex h-8 w-full cursor-pointer items-center gap-1 whitespace-nowrap rounded-2xl px-3 text-left text-xs font-normal outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
            : "flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-800 outline-none transition-colors enabled:hover:border-slate-300 enabled:hover:bg-white focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:enabled:hover:border-slate-700 dark:enabled:hover:bg-slate-950 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-950/60",
          isFilter &&
            (isActive
              ? "bg-brand/20 text-brand enabled:hover:bg-brand/30"
              : "bg-slate-100 text-slate-500 enabled:hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:enabled:hover:bg-slate-800"),
          triggerClassName,
          Boolean(trailingAction) && "pr-14",
        )}
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {Icon ? (
          <Icon
            aria-hidden={true}
            className={isFilter ? "shrink-0" : "shrink-0 text-slate-400"}
            size={16}
            strokeWidth={2.25}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">
          {triggerLabel ?? selectedOption?.label ?? value}
        </span>
        {!isFilter ? (
          <ChevronDown
            aria-hidden="true"
            className="shrink-0 text-slate-400"
            size={16}
            strokeWidth={2.25}
          />
        ) : null}
      </button>
      {trailingAction ? (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {trailingAction}
        </div>
      ) : null}
      {isOpen ? (
        <SelectionDialog
          title={sheetTitle ?? ariaLabel}
          options={options}
          value={value}
          onClose={() => setIsOpen(false)}
          onSelect={(next) => {
            onChange(next);
            setIsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

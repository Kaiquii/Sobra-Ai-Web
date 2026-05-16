"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

export type MonthReference = {
  month: number;
  year: number;
};

type MonthSwitcherProps = MonthReference & {
  className?: string;
  onChange: (date: MonthReference) => void;
};

export function getCurrentMonthReference() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function addMonths(month: number, year: number, amount: number) {
  const date = new Date(year, month - 1 + amount, 1);

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function formatShortMonth(month: number, year: number) {
  const date = new Date(year, month - 1, 1);
  const label = shortMonthFormatter.format(date).replace(".", "");

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatMonthYear(month: number, year: number) {
  return `${formatShortMonth(month, year)}/${String(year).slice(-2)}`;
}

export function MonthSwitcher({
  className,
  month,
  onChange,
  year,
}: MonthSwitcherProps) {
  const previousMonth = addMonths(month, year, -1);
  const nextMonth = addMonths(month, year, 1);

  return (
    <div
      className={cn(
        "w-full max-w-xs rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:max-w-sm",
        className,
      )}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <button
          className="inline-flex h-8 items-center justify-start gap-0.5 rounded-full px-1.5 text-left text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          onClick={() => onChange(previousMonth)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          <span className="text-xs font-medium sm:text-sm">
            {formatShortMonth(previousMonth.month, previousMonth.year)}
          </span>
        </button>

        <div className="flex min-w-20 items-center justify-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <CalendarDays aria-hidden="true" size={14} strokeWidth={2.3} />
          <strong className="text-xs font-semibold sm:text-sm">
            {formatMonthYear(month, year)}
          </strong>
        </div>

        <button
          className="inline-flex h-8 items-center justify-end gap-0.5 rounded-full px-1.5 text-right text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          onClick={() => onChange(nextMonth)}
          type="button"
        >
          <span className="text-xs font-medium sm:text-sm">
            {formatShortMonth(nextMonth.month, nextMonth.year)}
          </span>
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}

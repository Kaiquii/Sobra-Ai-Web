"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type DatePickerProps = {
  ariaLabel?: string;
  className?: string;
  id?: string;
  onChange: (value: string) => void;
  value: string;
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate(),
  )}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string) {
  const date = parseDateInputValue(value);

  return `${padDatePart(date.getDate())}/${padDatePart(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
}

function getCalendarDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);

  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function DatePicker({
  ariaLabel = "Selecionar data",
  className,
  id,
  onChange,
  value,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateInputValue(value));
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => parseDateInputValue(value), [value]);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
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

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth((current) => {
      const nextDate = new Date(current);
      nextDate.setMonth(current.getMonth() + direction);

      return nextDate;
    });
  }

  function selectDate(date: Date) {
    onChange(toDateInputValue(date));
    setIsOpen(false);
  }

  function selectToday() {
    const currentDate = new Date();
    onChange(toDateInputValue(currentDate));
    setVisibleMonth(currentDate);
    setIsOpen(false);
  }

  return (
    <div className={cn("relative", className)} ref={pickerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="flex h-11 w-full items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-semibold text-slate-950 shadow-sm outline-none transition hover:bg-slate-50 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900 dark:focus-visible:border-emerald-400 dark:focus-visible:ring-emerald-950"
        id={id}
        onClick={() => {
          setVisibleMonth(selectedDate);
          setIsOpen((current) => !current);
        }}
        type="button"
      >
        <span className="min-w-0 flex-1">{formatDisplayDate(value)}</span>
        <CalendarDays
          aria-hidden="true"
          className="shrink-0 text-slate-400"
          size={17}
          strokeWidth={2.25}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-13 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/40"
          role="dialog"
        >
          <div className="flex items-center justify-between gap-2">
            <strong className="px-2 text-sm font-semibold capitalize text-slate-950 dark:text-slate-50">
              {monthFormatter.format(visibleMonth)}
            </strong>
            <div className="flex items-center gap-1">
              <button
                aria-label="Mês anterior"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={() => moveMonth(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={17} strokeWidth={2.4} />
              </button>
              <button
                aria-label="Próximo mês"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={() => moveMonth(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={17} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            {weekDays.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dateValue = toDateInputValue(date);
              const isOutsideMonth = date.getMonth() !== visibleMonth.getMonth();
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);

              return (
                <button
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition",
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 dark:bg-blue-500 dark:text-slate-950"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                    isOutsideMonth && !isSelected && "text-slate-400 dark:text-slate-600",
                    isToday &&
                      !isSelected &&
                      "ring-1 ring-blue-300 dark:ring-blue-700",
                  )}
                  key={dateValue}
                  onClick={() => selectDate(date)}
                  type="button"
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
              onClick={selectToday}
              type="button"
            >
              Hoje
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

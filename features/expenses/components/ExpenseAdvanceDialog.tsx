"use client";

import { CalendarClock, CalendarDays, FastForward, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import type { Expense } from "@/features/expenses/types/expense";

type ExpenseAdvanceDialogProps = {
  expense: Expense | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (advancedAt: string) => void;
};

function toDateValue(value: string) {
  return value.includes("T") ? value.split("T")[0] : value;
}

function formatDate(value: string) {
  const [year, month, day] = toDateValue(value).split("-");

  return year && month && day ? `${day}/${month}/${year}` : "--/--/----";
}

function getPreviousDate(value: string) {
  const [year, month, day] = toDateValue(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() - 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function getInitialAdvancedDate(maxDate: string) {
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  return todayValue <= maxDate ? todayValue : maxDate;
}

export function ExpenseAdvanceDialog({
  expense,
  isSubmitting,
  onClose,
  onConfirm,
}: ExpenseAdvanceDialogProps) {
  const maximumDate = useMemo(
    () => (expense ? getPreviousDate(expense.date) : ""),
    [expense],
  );
  const [advancedAt, setAdvancedAt] = useState(() =>
    maximumDate ? getInitialAdvancedDate(maximumDate) : "",
  );
  const isValidDate = Boolean(advancedAt && advancedAt <= maximumDate);

  useLockBodyScroll(Boolean(expense));

  if (!expense) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isValidDate) {
      onConfirm(advancedAt);
    }
  }

  return (
    <div
      aria-labelledby="expense-advance-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      role="dialog"
    >
      <form
        className="my-auto w-full max-w-md rounded-2xl border border-slate-200 border-t-4 border-t-amber-500 bg-white p-5 shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:border-t-amber-400 dark:bg-slate-900 sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <FastForward aria-hidden="true" size={15} />
              Planejamento financeiro
            </p>
            <h2
              className="mt-2 text-xl font-semibold text-slate-950 dark:text-white sm:text-2xl"
              id="expense-advance-title"
            >
              Adiantar despesa
            </h2>
          </div>
          <Button
            aria-label="Fechar adiantamento da despesa"
            className="-mr-1 -mt-1 shrink-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            disabled={isSubmitting}
            onClick={onClose}
            size="icon"
            title="Fechar"
            variant="ghost"
          >
            <X aria-hidden="true" size={20} />
          </Button>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          A despesa continuará pendente e prevista na agenda original. Apenas o
          impacto no planejamento financeiro será antecipado.
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <CalendarDays aria-hidden="true" size={15} />
              Data prevista
            </div>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-50">
              {formatDate(expense.date)}
            </p>
          </div>

          <div>
            <Label htmlFor="expense-advanced-at">Nova data financeira</Label>
            <DatePicker
              ariaLabel="Selecionar nova data financeira"
              className="mt-1.5"
              id="expense-advanced-at"
              maxDate={maximumDate}
              onChange={setAdvancedAt}
              value={advancedAt}
            />
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <CalendarClock aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
              Escolha uma data até {formatDate(maximumDate)}, antes da data prevista.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button disabled={isSubmitting || !isValidDate} type="submit">
            <FastForward aria-hidden="true" size={16} />
            {isSubmitting ? "Adiantando..." : "Confirmar adiantamento"}
          </Button>
        </div>
      </form>
    </div>
  );
}

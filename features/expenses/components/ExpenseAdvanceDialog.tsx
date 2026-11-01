"use client";

import { CalendarClock, CalendarDays, FastForward, Undo2, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { FinancialValue } from "@/components/ui/financial-value";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import type { Expense } from "@/features/expenses/types/expense";

type ExpenseAdvanceDialogProps = {
  expense: Expense | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (advancedAt: string) => void;
  onRemoveAdvance: () => void;
};

function toDateValue(value: string) {
  return value.includes("T") ? value.split("T")[0] : value;
}

function formatDate(value: string) {
  const [year, month, day] = toDateValue(value).split("-");

  return year && month && day ? `${day}/${month}/${year}` : "--/--/----";
}

function formatPeriod(value: string) {
  const [year, month] = toDateValue(value).split("-").map(Number);
  return year && month
    ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
    : "o período escolhido";
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
  onRemoveAdvance,
}: ExpenseAdvanceDialogProps) {
  const maximumDate = useMemo(
    () => (expense ? getPreviousDate(expense.date) : ""),
    [expense],
  );
  const [advancedAt, setAdvancedAt] = useState(() =>
    expense?.is_advanced && expense.advanced_at ? toDateValue(expense.advanced_at) : maximumDate ? getInitialAdvancedDate(maximumDate) : "",
  );
  const isValidDate = Boolean(advancedAt && advancedAt <= maximumDate);

  useLockBodyScroll(Boolean(expense));

  if (!expense) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isValidDate && !isSubmitting) {
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
        className="mobile-compact-dialog my-auto w-full max-w-md rounded-2xl border border-slate-200 border-t-4 border-t-amber-500 bg-white p-5 shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:border-t-amber-400 dark:bg-slate-900 max-sm:border-t max-sm:border-t-slate-200 dark:max-sm:border-t-slate-800 sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 sm:flex">
              <FastForward aria-hidden="true" size={15} />
              Planejamento financeiro
            </p>
            <h2
              className="mt-2 text-xl font-semibold text-slate-950 dark:text-white max-sm:mt-0 max-sm:text-[22px] max-sm:leading-7 sm:text-2xl"
              id="expense-advance-title"
            >
              {expense.is_advanced ? "Alterar adiantamento" : "Adiantar despesa"}
            </h2>
          </div>
          <Button
            aria-label="Fechar adiantamento da despesa"
            className="-mr-1 -mt-1 hidden shrink-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 sm:inline-flex"
            disabled={isSubmitting}
            onClick={onClose}
            size="icon"
            title="Fechar"
            variant="ghost"
          >
            <X aria-hidden="true" size={20} />
          </Button>
        </div>

        <p className="mt-3 hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block">
          A data prevista e o status de pagamento serão preservados. Apenas o impacto no planejamento financeiro será antecipado.
        </p>

        <div className="mt-4 space-y-3 text-sm leading-5.25 sm:hidden">
          <p className="wrap-anywhere text-slate-950 dark:text-slate-50">{expense.description} está prevista para {formatPeriod(expense.date)}.</p>
          <p className="text-slate-500 dark:text-slate-400"><FinancialValue value={expense.amount} /> entrarão no cálculo de {formatPeriod(advancedAt)}, sem desconto duplicado no mês previsto.</p>
        </div>

        <div className="mt-5 space-y-4 max-sm:mt-4 max-sm:space-y-3">
          <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50 sm:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <CalendarDays aria-hidden="true" size={15} />
              Data prevista
            </div>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-50">
              {formatDate(expense.date)}
            </p>
          </div>

          <div>
            <Label htmlFor="expense-advanced-at"><span className="sm:hidden">Data do adiantamento</span><span className="hidden sm:inline">Nova data financeira</span></Label>
            <DatePicker
              ariaLabel="Selecionar nova data financeira"
              className="mt-1.5 max-sm:[&>button]:h-13 max-sm:[&>button]:rounded-[14px] max-sm:[&>button]:text-base"
              id="expense-advanced-at"
              maxDate={maximumDate}
              onChange={setAdvancedAt}
              value={advancedAt}
            />
            <p className="mt-2 text-xs leading-4.5 text-slate-500 dark:text-slate-400 sm:hidden">Esta ação não altera o status Paga.</p>
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400 max-sm:leading-4.5">
              <CalendarClock aria-hidden="true" className="mt-0.5 hidden shrink-0 sm:block" size={14} />
              Escolha uma data até {formatDate(maximumDate)}, antes da data prevista.
            </p>
          </div>

          {expense.is_advanced ? (
            <Button
              className="w-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 max-sm:min-h-12 max-sm:rounded-[14px]"
              disabled={isSubmitting}
              onClick={onRemoveAdvance}
              variant="secondary"
            >
              <Undo2 aria-hidden="true" className="max-sm:hidden" size={16} />
              Remover adiantamento
            </Button>
          ) : null}
        </div>

        <div className="mobile-compact-dialog-actions mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button className="max-sm:border-0 max-sm:bg-transparent max-sm:px-3 max-sm:text-blue-600 dark:max-sm:bg-transparent dark:max-sm:text-blue-400" disabled={isSubmitting} onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button className="max-sm:bg-brand max-sm:px-3 max-sm:text-white max-sm:hover:bg-brand-hover dark:max-sm:bg-brand dark:max-sm:text-white" disabled={isSubmitting || !isValidDate} type="submit">
            <FastForward aria-hidden="true" className="max-sm:hidden" size={16} />
            {isSubmitting ? "Atualizando..." : <><span className="sm:hidden">Confirmar</span><span className="hidden sm:inline">Confirmar adiantamento</span></>}
          </Button>
        </div>
      </form>
    </div>
  );
}

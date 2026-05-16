"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { useExpenseStore } from "@/features/expenses/store/useExpenseStore";
import type { Expense } from "@/features/expenses/types/expense";
import { cn } from "@/lib/utils";

type ExpenseDeleteDialogProps = {
  expense: Expense | null;
  onClose: () => void;
  onSuccess: () => void;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isInstallmentExpense(expense: Expense) {
  return normalizeText(expense.type) === "parcelada";
}

function isFixedExpense(expense: Expense) {
  return normalizeText(expense.type) === "fixa";
}

export function ExpenseDeleteDialog({
  expense,
  onClose,
  onSuccess,
}: ExpenseDeleteDialogProps) {
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);
  const error = useExpenseStore((state) => state.error);
  const isSubmitting = useExpenseStore((state) => state.isSubmitting);
  const [deleteFuture, setDeleteFuture] = useState(false);
  useLockBodyScroll(Boolean(expense));

  if (!expense) {
    return null;
  }

  const currentExpense = expense;
  const showFutureOption = isInstallmentExpense(currentExpense);
  const fixedExpense = isFixedExpense(currentExpense);

  async function handleDelete() {
    try {
      await deleteExpense(currentExpense.id, fixedExpense || (showFutureOption && deleteFuture));
      onSuccess();
    } catch {}
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
          Excluir despesa
        </h2>

        <div className="mt-6 space-y-5">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <p className="text-base leading-7 text-slate-700 dark:text-slate-200">
            Tem certeza que deseja remover {currentExpense.description}?
          </p>

          {showFutureOption ? (
            <label className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
              <input
                checked={deleteFuture}
                className="h-6 w-6 rounded border-slate-400 bg-transparent accent-red-500"
                disabled={isSubmitting}
                onChange={(event) => setDeleteFuture(event.target.checked)}
                type="checkbox"
              />
              Excluir esta e todas as futuras
            </label>
          ) : null}

          {fixedExpense ? (
            <Alert variant="info">
              Despesa fixa: ao excluir, esta despesa também será removida dos
              próximos meses.
            </Alert>
          ) : null}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500 disabled:opacity-60 dark:text-blue-400 dark:hover:bg-blue-950/35"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 dark:bg-red-500 dark:hover:bg-red-400",
            )}
            disabled={isSubmitting}
            onClick={handleDelete}
            type="button"
          >
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={15} />
            ) : null}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

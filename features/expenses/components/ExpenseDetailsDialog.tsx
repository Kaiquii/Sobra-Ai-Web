"use client";

import {
  CalendarDays,
  FileText,
  ListFilter,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";

import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import type { Expense } from "@/features/expenses/types/expense";
import { formatMoney } from "@/lib/formatters";

type ExpenseDetailsDialogProps = {
  categoryName: string;
  expense: Expense | null;
  onClose: () => void;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatExpenseFullDate(date: string) {
  const inputDate = date.includes("T") ? date.split("T")[0] : date;
  const [year, month, day] = inputDate.split("-");

  if (!year || !month || !day) {
    return "--/--/----";
  }

  return `${day}/${month}/${year}`;
}

function getPaymentSourceLabel(source: string) {
  const normalized = normalizeText(source);

  if (normalized.includes("adiantamento")) {
    return "Adiantamento";
  }

  if (normalized.includes("renda extra")) {
    return "Renda Extra";
  }

  return "Salário";
}

function getInstallmentLabel(expense: Expense) {
  if (normalizeText(expense.type) !== "parcelada") {
    return null;
  }

  const current = expense.current_installment ?? 1;

  return `${current}/${expense.installments}`;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Icon aria-hidden="true" className="text-blue-500" size={15} />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
        {value}
      </p>
    </div>
  );
}

export function ExpenseDetailsDialog({
  categoryName,
  expense,
  onClose,
}: ExpenseDetailsDialogProps) {
  useLockBodyScroll(Boolean(expense));

  if (!expense) {
    return null;
  }

  const notes = expense.notes?.trim();
  const installmentLabel = getInstallmentLabel(expense);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="my-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Detalhes da despesa
            </p>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
              {expense.description}
            </h2>
          </div>

          <button
            aria-label="Fechar detalhes da despesa"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            onClick={onClose}
            title="Fechar"
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-950/70 dark:bg-red-950/35">
          <p className="text-xs font-medium text-red-700 dark:text-red-300">Valor</p>
          <strong className="mt-1 block text-2xl font-semibold text-red-700 dark:text-red-200">
            - {formatMoney(expense.amount)}
          </strong>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailItem icon={ListFilter} label="Categoria" value={categoryName} />
          <DetailItem
            icon={WalletCards}
            label="Origem"
            value={getPaymentSourceLabel(expense.payment_source)}
          />
          <DetailItem
            icon={CalendarDays}
            label="Data de pagamento"
            value={formatExpenseFullDate(expense.date)}
          />
          <DetailItem icon={ReceiptText} label="Tipo" value={expense.type} />
          {installmentLabel ? (
            <DetailItem icon={FileText} label="Parcela" value={installmentLabel} />
          ) : null}
        </div>

        <div className="mt-4 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <FileText aria-hidden="true" className="text-blue-500" size={16} />
            Observações
          </div>
          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-600 wrap-anywhere dark:text-slate-300">
            {notes || "Nenhuma observação informada."}
          </p>
        </div>
      </div>
    </div>
  );
}

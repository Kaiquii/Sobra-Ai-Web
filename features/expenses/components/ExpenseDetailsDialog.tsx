"use client";

import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ListFilter,
  ReceiptText,
  TrendingDown,
  WalletCards,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import type { Expense } from "@/features/expenses/types/expense";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

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

function formatPaidAt(date: string | null) {
  if (!date) {
    return "Data não informada.";
  }

  const paidAt = new Date(date);

  if (Number.isNaN(paidAt.getTime())) {
    return "Data não informada.";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(paidAt);
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

function getInstallmentDetails(expense: Expense) {
  if (normalizeText(expense.type) !== "parcelada") {
    return null;
  }

  const current = Math.max(expense.current_installment ?? 1, 1);
  const total = Math.max(expense.installments, 1);

  return {
    current,
    progress: Math.min((current / total) * 100, 100),
    total,
  };
}

function DetailItem({
  className,
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-20 min-w-0 items-center gap-3 p-4",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/70 dark:bg-blue-950/60 dark:text-blue-400">
        <Icon aria-hidden="true" size={17} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </dt>
        <dd className="mt-0.5 wrap-break-word text-sm font-semibold text-slate-950 dark:text-slate-50">
          {value}
        </dd>
      </div>
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
  const installmentDetails = getInstallmentDetails(expense);

  return (
    <div
      aria-labelledby="expense-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      role="dialog"
    >
      <div
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 border-t-4 border-t-blue-600 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:border-t-blue-500 dark:bg-slate-900 sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                <ReceiptText aria-hidden="true" size={15} />
                Detalhes da despesa
              </p>
              <h2
                className="mt-2 wrap-break-word text-2xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-3xl"
                id="expense-details-title"
              >
                {expense.description}
              </h2>
            </div>

            <Button
              aria-label="Fechar detalhes da despesa"
              className="-mr-1 -mt-1 shrink-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              onClick={onClose}
              size="icon"
              title="Fechar"
              variant="ghost"
            >
              <X aria-hidden="true" size={20} />
            </Button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-5 border-y border-dashed border-slate-200 py-4 dark:border-slate-700">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor da despesa
              </p>
              <strong className="mt-1 block wrap-break-word text-3xl font-semibold tabular-nums text-red-700 dark:text-red-300 sm:text-4xl">
                - {formatMoney(expense.amount)}
              </strong>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 shadow-sm dark:border-red-950/80 dark:bg-red-950/40 dark:text-red-300">
              <TrendingDown aria-hidden="true" size={22} />
            </span>
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Informações
          </p>

          <dl className="mt-2 grid overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm dark:border-slate-800 dark:bg-slate-950/45 sm:grid-cols-2">
            <DetailItem
              className="border-b border-slate-200 dark:border-slate-800 sm:border-r"
              icon={ListFilter}
              label="Categoria"
              value={categoryName}
            />
            <DetailItem
              className="border-b border-slate-200 dark:border-slate-800"
              icon={WalletCards}
              label="Origem"
              value={getPaymentSourceLabel(expense.payment_source)}
            />
            <DetailItem
              className="border-b border-slate-200 dark:border-slate-800 sm:border-r sm:border-b-0"
              icon={CalendarDays}
              label="Data de pagamento"
              value={formatExpenseFullDate(expense.date)}
            />
            <DetailItem icon={ReceiptText} label="Tipo" value={expense.type} />

            {expense.is_paid ? (
              <DetailItem
                className="border-t border-emerald-200 bg-emerald-50/60 dark:border-emerald-950/70 dark:bg-emerald-950/20 sm:col-span-2"
                icon={CheckCircle2}
                label="Status de pagamento"
                value={`Paga em ${formatPaidAt(expense.paid_at)}`}
              />
            ) : null}

            {installmentDetails ? (
              <div className="border-t border-blue-200 bg-blue-50/70 p-4 dark:border-blue-950/70 dark:bg-blue-950/25 sm:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300">
                      <FileText aria-hidden="true" size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Parcelamento
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                        {Math.round(installmentDetails.progress)}% concluído
                      </p>
                    </div>
                  </div>
                  <strong className="shrink-0 text-lg font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                    {installmentDetails.current} de {installmentDetails.total}
                  </strong>
                </div>

                <div
                  aria-label={`Progresso do parcelamento: ${installmentDetails.current} de ${installmentDetails.total}`}
                  aria-valuemax={installmentDetails.total}
                  aria-valuemin={0}
                  aria-valuenow={Math.min(
                    installmentDetails.current,
                    installmentDetails.total,
                  )}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                    style={{ width: `${installmentDetails.progress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <FileText aria-hidden="true" className="text-blue-500" size={15} />
            Observações
          </div>

          <div className="mt-2 max-w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50/40 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-950/30">
            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-600 wrap-anywhere dark:text-slate-300">
              {notes || "Nenhuma observação informada."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

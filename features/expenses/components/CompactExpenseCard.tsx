"use client";

import {
  CalendarCheck,
  Eye,
  WalletCards,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { FinancialValue } from "@/components/ui/financial-value";
import type { Expense } from "@/features/expenses/types/expense";
import { expenseTypeAccent } from "@/features/expenses/utils/expensePresentation";

export function normalizeExpenseText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getExpensePaymentSources(expense: Expense) {
  return [
    ...new Set(
      (expense.payment_splits?.length
        ? expense.payment_splits.map((split) => split.payment_source)
        : [expense.payment_source]
      )
        .filter((source) => typeof source === "string" && source.trim())
        .map((source) => {
          switch (normalizeExpenseText(source.trim())) {
            case "salario":
              return "Salário";
            case "adiantamento":
              return "Adiantamento";
            case "renda extra":
              return "Renda Extra";
            default:
              return source.trim();
          }
        }),
    ),
  ];
}

function Chip({
  children,
  color = "#7A849E",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{ "--chip-color": color } as CSSProperties}
      className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded bg-(--chip-color)/18 px-1.5 py-0.5 text-[10px] leading-4 text-(--chip-color)"
    >
      {children}
    </span>
  );
}

export function CompactExpenseCard({
  expense,
  categoryName,
  onView,
}: {
  expense: Expense;
  categoryName: string;
  onView: (expense: Expense) => void;
}) {
  const paymentSources = getExpensePaymentSources(expense);
  const source =
    paymentSources.length > 1
      ? "Pagamento dividido"
      : (paymentSources[0] ?? "Não informado");
  const sourceColor =
    paymentSources.length > 1 || normalizeExpenseText(source) === "salario"
      ? "#1877F2"
      : normalizeExpenseText(source) === "adiantamento"
        ? "#8B5CF6"
        : normalizeExpenseText(source) === "renda extra"
          ? "#4CAF50"
          : "#7A849E";
  const [, month, day] = expense.date.split("T")[0].split("-");
  const type =
    normalizeExpenseText(expense.type) === "parcelada"
      ? `Parc. ${expense.current_installment ?? 1}/${expense.installments}`
      : expense.type;

  return (
    <article className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 p-4 text-slate-950 dark:bg-slate-900 dark:text-slate-50">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold leading-5">
          {expense.description?.trim() || "Despesa sem descrição"}
        </h3>
        <p className="truncate text-xs leading-5 text-slate-500 dark:text-slate-400">
          {categoryName}
        </p>
        <div className="scrollbar-none mt-2 flex min-w-0 items-center gap-1.5 overflow-x-auto">
          <span className={`${expenseTypeAccent(expense.type)} inline-flex shrink-0 whitespace-nowrap rounded bg-(--expense-accent)/18 px-1.5 py-0.5 text-[10px] leading-4 text-(--expense-accent)`}>{type}</span>
          {expense.is_paid ? <Chip color="#4CAF50">Paga</Chip> : null}
          {expense.is_advanced ? (
            <Chip color="#1877F2">
              <CalendarCheck
                aria-label={
                  expense.advanced_at
                    ? `Adiantada em ${expense.advanced_at.split("T")[0].split("-").reverse().join("/")}`
                    : "Despesa adiantada"
                }
                size={11}
              />
              <span>Adiantada</span>
            </Chip>
          ) : (
            <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400">
              {day}/{month}
            </span>
          )}
        </div>
      </div>
      <div className="flex max-w-[55%] shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
          <strong className="whitespace-nowrap text-sm font-bold tabular-nums">
            <FinancialValue prefix="- " value={expense.amount} />
          </strong>
          <button
            type="button"
            aria-label={`Visualizar despesa ${expense.description}`}
            onClick={() => onView(expense)}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:text-slate-400 dark:hover:text-brand"
          >
            <Eye aria-hidden="true" size={18} />
          </button>
        </div>
        <span
          style={{ "--source-color": sourceColor } as CSSProperties}
          className="inline-flex max-w-full items-center gap-1 rounded-lg bg-(--source-color)/14 px-1.75 py-0.75 text-[10px] text-(--source-color)"
        >
          <WalletCards aria-hidden="true" className="shrink-0" size={11} />
          <span className="truncate">{source}</span>
        </span>
      </div>
    </article>
  );
}

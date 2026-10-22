"use client";

import {
  BarChart3,
  ChevronRight,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getCurrentMonthReference,
  MonthSwitcher,
} from "@/components/ui/month-switcher";
import {
  ExpenseFormDialog,
  type ExpenseFormMode,
} from "@/features/expenses/components/ExpenseFormDialog";
import { expensesApi } from "@/features/expenses/api/expensesApi";
import { useExpenseStore } from "@/features/expenses/store/useExpenseStore";
import {
  IncomeShortcutDialog,
  type IncomeShortcut,
  type IncomeShortcutAction,
} from "@/features/incomes/components/IncomeShortcutDialog";
import type { IncomeSource } from "@/features/incomes/types/income";
import { summaryApi } from "@/features/summary/api/summaryApi";
import type { MonthlySummary } from "@/features/summary/types/summary";
import { FinancialValue } from "@/components/ui/financial-value";
import { useFinancialPrivacyStore } from "@/store/useFinancialPrivacyStore";
import {
  MonthlyExpensesSection,
  type MonthlyExpensesData,
} from "@/features/summary/components/MonthlyExpensesSection";
import { cn } from "@/lib/utils";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

type SummaryCardProps = {
  action?: React.ReactNode;
  className?: string;
  hint?: string;
  icon?: React.ReactNode;
  label: string;
  tone?:
    | "balance"
    | "expense"
    | "extra"
    | "income"
    | "remaining"
    | "source"
    | "spent";
  value: number;
};

type AmountState = "negative" | "positive" | "zero";

function getAmountState(value: number): AmountState {
  if (value < 0) {
    return "negative";
  }

  if (value === 0) {
    return "zero";
  }

  return "positive";
}

function getSpentPercentage(expense: number, income: number) {
  if (income <= 0) {
    return 0;
  }

  return Math.round((expense / income) * 100);
}

function SummaryCard({
  action,
  className,
  hint,
  icon,
  label,
  tone = "balance",
  value,
}: SummaryCardProps) {
  const hidden = useFinancialPrivacyStore((state) => state.valuesHidden);
  const amountState = hidden ? "zero" : getAmountState(value);
  const isFeatured = tone === "balance";
  const isRemaining = tone === "remaining";
  const isExtra = tone === "extra";
  const isExpenseTone = tone === "expense" || tone === "spent";

  return (
    <article
      className={cn(
        "max-sm:rounded-xl max-sm:p-4 relative min-h-24 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700/45 dark:bg-slate-800/75",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/40 after:content-[''] dark:after:bg-white/5",
        isFeatured &&
          "min-h-28 bg-blue-100 p-4 dark:border-blue-900/45 dark:bg-blue-950",
        isRemaining &&
          "border-violet-200 bg-violet-100/85 dark:border-violet-900/35 dark:bg-violet-950/70",
        isExtra &&
          "border-slate-200 bg-slate-50 dark:border-slate-700/45 dark:bg-slate-800/75",
        isExpenseTone &&
          "border-slate-200 bg-slate-50 dark:border-slate-700/45 dark:bg-slate-800/75",
        amountState === "negative" &&
          "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/25",
        "max-sm:min-h-0 max-sm:border-0 max-sm:shadow-none max-sm:after:hidden",
        isFeatured
          ? "max-sm:bg-[#E0F2FE]! max-sm:p-[18px]! dark:max-sm:bg-[#13325B]!"
          : isRemaining
            ? "max-sm:bg-[#F3E8FF]! dark:max-sm:bg-[#221A36]!"
            : "max-sm:bg-[#F8F9FA]! dark:max-sm:bg-[#202934]!",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col justify-between gap-3 max-sm:gap-1",
          Boolean(action) && "max-sm:gap-2.5",
          isFeatured && "max-sm:gap-1.5",
        )}
      >
        <div className="flex items-start justify-between gap-3 max-sm:gap-1">
          <p
            className={cn(
              "max-sm:min-w-0 max-sm:truncate max-sm:text-xs text-sm font-medium leading-tight text-slate-500 dark:text-slate-400",
              isFeatured && "text-blue-700/70 dark:text-blue-200/55",
              isRemaining && "text-violet-700/70 dark:text-violet-200/55",
              amountState === "negative" &&
                "text-red-700/80 dark:text-red-200/75",
              "max-sm:text-[#7A849E]!",
            )}
          >
            {label}
          </p>
          {action ? (
            <div className="flex shrink-0 items-center gap-1">{action}</div>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <strong
              className={cn(
                "max-sm:text-lg max-sm:font-bold max-sm:leading-tight block wrap-break-word text-2xl font-semibold leading-none tracking-normal text-slate-950 dark:text-white sm:text-[1.875rem]",
                isFeatured &&
                  "max-sm:text-[1.625rem] text-[2rem] text-blue-700 dark:text-blue-400 sm:text-4xl",
                isExtra && "text-emerald-600 dark:text-emerald-400",
                isRemaining && "text-violet-950 dark:text-white",
                isExpenseTone && "text-slate-950 dark:text-white",
                amountState === "zero" &&
                  isExtra &&
                  "text-emerald-600 dark:text-emerald-400",
                amountState === "negative" && "text-red-600 dark:text-red-300",
                amountState === "negative"
                  ? "max-sm:text-[#FF6B6B]!"
                  : isFeatured
                    ? "max-sm:text-brand!"
                    : isExtra
                      ? "max-sm:text-[#4CAF50]!"
                      : "max-sm:text-slate-950! dark:max-sm:text-white!",
              )}
            >
              <FinancialValue value={value} />
            </strong>
            {hint ? (
              <p
                className={cn(
                  "mt-1.5 text-sm font-medium leading-tight text-slate-500 dark:text-slate-500",
                  isFeatured && "text-blue-700/60 dark:text-blue-200/45",
                  amountState === "negative" &&
                    "text-red-700/70 dark:text-red-200/60",
                  "max-sm:mt-1 max-sm:text-[11px] max-sm:text-[#7A849E]!",
                )}
              >
                {hidden ? "Saldo do mês" : hint}
              </p>
            ) : null}
          </div>
          {icon ? (
            <div
              className={cn(
                "shrink-0 text-slate-500 dark:text-slate-100",
                isFeatured && "text-blue-700 dark:text-blue-500",
                isExtra && "text-emerald-600 dark:text-emerald-500",
                amountState === "negative" && "text-red-500 dark:text-red-400",
                isFeatured &&
                  "max-sm:absolute max-sm:right-[18px] max-sm:top-1/2 max-sm:-translate-y-1/2 max-sm:text-brand!",
                isExtra && "max-sm:text-[#4CAF50]!",
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type IncomeActionProps = {
  amount: number;
  month: number;
  onOpen: (shortcut: IncomeShortcut) => void;
  source: IncomeSource;
  year: number;
};

function getShortcut({
  action,
  amount,
  month,
  source,
  year,
}: Omit<IncomeActionProps, "onOpen"> & { action: IncomeShortcutAction }) {
  return {
    action,
    amount,
    month,
    source,
    year,
  };
}

function IncomeActions({
  amount,
  month,
  onOpen,
  source,
  year,
}: IncomeActionProps) {
  const hidden = useFinancialPrivacyStore((state) => state.valuesHidden);
  if (amount <= 0) {
    return (
      <button
        disabled={hidden}
        aria-label={`Criar ${source}`}
        className="inline-flex h-8 w-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 max-sm:h-6 max-sm:w-6 items-center justify-center rounded-full text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
        onClick={() =>
          onOpen(getShortcut({ action: "create", amount, month, source, year }))
        }
        title={`Criar ${source}`}
        type="button"
      >
        <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
      </button>
    );
  }

  return (
    <>
      <button
        disabled={hidden}
        aria-label={`Editar ${source}`}
        className="inline-flex h-8 w-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 max-sm:h-6 max-sm:w-6 items-center justify-center rounded-full text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
        onClick={() =>
          onOpen(getShortcut({ action: "edit", amount, month, source, year }))
        }
        title={`Editar ${source}`}
        type="button"
      >
        <Pencil aria-hidden="true" size={18} strokeWidth={2.4} />
      </button>
      <button
        disabled={hidden}
        aria-label={`Excluir ${source}`}
        className="inline-flex h-8 w-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 max-sm:h-6 max-sm:w-6 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={() =>
          onOpen(getShortcut({ action: "delete", amount, month, source, year }))
        }
        title={`Excluir ${source}`}
        type="button"
      >
        <Trash2 aria-hidden="true" size={18} strokeWidth={2.4} />
      </button>
    </>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          className={cn(
            "h-24 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            index === 0 &&
              "col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-4",
            (index === 1 || index === 2) && "lg:col-span-2",
            (index === 5 || index === 8 || index === 11) &&
              "col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2",
          )}
          key={index}
        />
      ))}
    </div>
  );
}

export function MonthlySummaryView() {
  const [{ month, year }, setSelectedDate] = useState(getCurrentMonthReference);
  const hidden = useFinancialPrivacyStore((state) => state.valuesHidden);
  const [error, setError] = useState<string | null>(null);
  const [expenseFormMode, setExpenseFormMode] =
    useState<ExpenseFormMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeShortcut, setIncomeShortcut] = useState<IncomeShortcut | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [overview, setOverview] = useState<{
    month: number;
    year: number;
    summary: MonthlySummary;
    expensesData: MonthlyExpensesData | null;
  } | null>(null);
  const summary =
    overview?.month === month && overview?.year === year
      ? overview.summary
      : null;
  const loadCategories = useExpenseStore((state) => state.loadCategories);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        setError(null);
        setIsLoading(true);
        const mobile = window.matchMedia("(max-width: 639px)").matches;
        const [response, expensesData] = await Promise.all([
          summaryApi.getMonthlySummary(month, year),
          mobile
            ? Promise.all([
                expensesApi.getExpenses(month, year),
                expensesApi.getCategories(),
              ]).then(([expenses, categories]) => ({
                expenses: expenses.expenses,
                categories: categories.categories,
              }))
            : Promise.resolve(null),
        ]);

        if (isMounted) {
          setOverview({ month, year, summary: response, expensesData });
        }
      } catch {
        if (isMounted) {
          setError(
            "Não foi possível atualizar a visão mensal. Tente novamente.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [month, refreshKey, year]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const reloadLayout = () => setRefreshKey((value) => value + 1);
    media.addEventListener("change", reloadLayout);
    return () => media.removeEventListener("change", reloadLayout);
  }, []);

  const monthLabel = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return monthFormatter.format(date);
  }, [month, year]);

  const salario = summary?.salario ?? 0;
  const adiantamento = summary?.adiantamento ?? 0;
  const rendaExtra = summary?.renda_extra_amt ?? 0;
  const restanteSalario = summary?.restante_salario ?? 0;
  const restanteAdiantamento = summary?.restante_adiantamento ?? 0;
  const restanteRendaExtra = summary?.restante_renda_extra ?? 0;
  const gastoSalario =
    summary?.total_gasto_salario ?? Math.max(salario - restanteSalario, 0);
  const gastoAdiantamento =
    summary?.total_gasto_adiantamento ??
    Math.max(adiantamento - restanteAdiantamento, 0);
  const gastoRendaExtra = summary?.total_gasto_renda_extra ?? 0;
  const spentPercentage = summary
    ? getSpentPercentage(summary.total_expense, summary.total_income)
    : null;
  const spentProgressPercentage =
    spentPercentage !== null ? Math.min(spentPercentage, 100) : 0;

  async function openExpenseDialog() {
    await loadCategories();
    setExpenseFormMode("create");
  }

  function closeExpenseDialog() {
    setExpenseFormMode(null);
  }

  function handleExpenseSuccess() {
    closeExpenseDialog();
    setRefreshKey((current) => current + 1);
  }

  return (
    <>
      <section
        aria-busy={isLoading}
        className="mx-auto flex w-full max-w-6xl flex-col gap-4"
      >
        <div className="sm:hidden">
          <MonthSwitcher
            variant="android"
            month={month}
            onChange={setSelectedDate}
            year={year}
          />
          <h2 className="mt-4 text-lg font-bold">Resumo Financeiro</h2>
        </div>
        <div className="hidden flex-col gap-2.5 sm:flex sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-emerald-700 dark:text-emerald-300">
              Visão Mensal
            </p>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="shrink-0 whitespace-nowrap text-xl font-semibold leading-tight capitalize text-slate-950 dark:text-slate-50 sm:text-2xl">
                {monthLabel}
              </h1>
              {!hidden && spentPercentage !== null ? (
                <span className="inline-flex h-7 min-w-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 text-xs font-semibold text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/45 dark:text-blue-300 sm:gap-2 sm:px-2.5">
                  <span className="shrink-0 whitespace-nowrap">
                    Gasto: {spentPercentage}%
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1 w-16 min-w-0 shrink overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950"
                  >
                    <span
                      className="block h-full rounded-full bg-blue-500 dark:bg-blue-400"
                      style={{ width: `${spentProgressPercentage}%` }}
                    />
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <MonthSwitcher
              className="w-72! max-w-none! sm:w-80!"
              month={month}
              onChange={setSelectedDate}
              year={year}
            />
            <button
              className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/45 dark:text-blue-300 dark:hover:bg-blue-950"
              onClick={() => void openExpenseDialog()}
              type="button"
            >
              <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
              Adicionar despesa
            </button>
            <Link
              className="inline-flex h-8 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              href="/despesas"
            >
              Ver despesas
              <ChevronRight aria-hidden="true" size={14} strokeWidth={2.4} />
            </Link>
          </div>
        </div>

        {!summary && isLoading ? <SummarySkeleton /> : null}

        {error || (!isLoading && !summary) ? (
          <div>
            <Alert variant="error">
              {error ?? "Resumo mensal indisponível."}
            </Alert>
            <Button
              className="mt-4"
              onClick={() => setRefreshKey((current) => current + 1)}
              type="button"
            >
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {summary ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              className="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-4"
              hint="Saldo livre no mês."
              icon={
                <PiggyBank
                  aria-hidden="true"
                  className="max-sm:size-7"
                  size={42}
                />
              }
              label="Total Geral Disponível"
              tone="balance"
              value={summary.total_geral_disponivel}
            />

            <SummaryCard
              className="lg:col-span-2"
              icon={
                <TrendingUp
                  aria-hidden="true"
                  className="max-sm:size-5"
                  size={30}
                />
              }
              label="Total Recebido"
              tone="income"
              value={summary.total_income}
            />
            <SummaryCard
              className="lg:col-span-2"
              icon={
                <Wallet
                  aria-hidden="true"
                  className="max-sm:size-5"
                  size={30}
                />
              }
              label="Total Gasto"
              tone="expense"
              value={summary.total_expense}
            />

            <SummaryCard
              action={
                <IncomeActions
                  amount={salario}
                  month={month}
                  onOpen={setIncomeShortcut}
                  source="Salario"
                  year={year}
                />
              }
              label="Salário"
              tone="source"
              value={salario}
            />
            <SummaryCard
              action={
                <IncomeActions
                  amount={adiantamento}
                  month={month}
                  onOpen={setIncomeShortcut}
                  source="Adiantamento"
                  year={year}
                />
              }
              label="Adiantamento"
              tone="source"
              value={adiantamento}
            />

            <SummaryCard
              action={
                <IncomeActions
                  amount={rendaExtra}
                  month={month}
                  onOpen={setIncomeShortcut}
                  source="Renda Extra"
                  year={year}
                />
              }
              className="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2"
              icon={
                <BarChart3
                  aria-hidden="true"
                  className="max-sm:size-6"
                  size={34}
                />
              }
              label="Renda Extra"
              tone="extra"
              value={rendaExtra}
            />

            <SummaryCard
              label="Restante Salário"
              tone="remaining"
              value={restanteSalario}
            />
            <SummaryCard
              label="Restante Adiant."
              tone="remaining"
              value={restanteAdiantamento}
            />
            <SummaryCard
              className="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2"
              label="Restante Renda Extra"
              tone="remaining"
              value={restanteRendaExtra}
            />

            <SummaryCard
              icon={
                <ReceiptText
                  aria-hidden="true"
                  className="max-sm:hidden"
                  size={28}
                />
              }
              label="Gasto Salário"
              tone="spent"
              value={gastoSalario}
            />
            <SummaryCard
              icon={
                <ReceiptText
                  aria-hidden="true"
                  className="max-sm:hidden"
                  size={28}
                />
              }
              label="Gasto Adiant."
              tone="spent"
              value={gastoAdiantamento}
            />
            <SummaryCard
              className="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2"
              icon={
                <ReceiptText
                  aria-hidden="true"
                  className="max-sm:hidden"
                  size={28}
                />
              }
              label="Gasto Renda Extra"
              tone="spent"
              value={gastoRendaExtra}
            />
          </div>
        ) : null}
        {summary && overview?.expensesData ? (
          <div className="sm:hidden">
            <MonthlyExpensesSection
              key={`${month}-${year}`}
              data={overview.expensesData}
              onAdd={() => void openExpenseDialog()}
            />
          </div>
        ) : null}
      </section>

      {incomeShortcut ? (
        <IncomeShortcutDialog
          onClose={() => setIncomeShortcut(null)}
          onSuccess={() => {
            setIncomeShortcut(null);
            setRefreshKey((current) => current + 1);
          }}
          shortcut={incomeShortcut}
        />
      ) : null}
      {expenseFormMode ? (
        <ExpenseFormDialog
          expense={null}
          mode={expenseFormMode}
          month={month}
          onClose={closeExpenseDialog}
          onSuccess={handleExpenseSuccess}
          year={year}
        />
      ) : null}
    </>
  );
}

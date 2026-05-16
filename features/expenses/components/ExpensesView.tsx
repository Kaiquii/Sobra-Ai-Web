"use client";

import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ListFilter,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  getCurrentMonthReference,
  MonthSwitcher,
} from "@/components/ui/month-switcher";
import { ExpenseDeleteDialog } from "@/features/expenses/components/ExpenseDeleteDialog";
import {
  ExpenseFormDialog,
  type ExpenseFormMode,
} from "@/features/expenses/components/ExpenseFormDialog";
import { useExpenseStore } from "@/features/expenses/store/useExpenseStore";
import type {
  Category,
  Expense,
  ExpenseTypeFilter,
} from "@/features/expenses/types/expense";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

type PaymentSourceFilter = "Adiantamento" | "Renda Extra" | "Salario" | "Todas";

const typeFilters: ExpenseTypeFilter[] = ["Todas", "Parceladas", "\u00danicas", "Fixas"];
const paymentSourceFilters: PaymentSourceFilter[] = [
  "Todas",
  "Salario",
  "Adiantamento",
  "Renda Extra",
];

const typeFilterOptions = typeFilters.map((filter) => ({
  label: filter,
  value: filter,
}));

const paymentSourceFilterOptions = paymentSourceFilters.map((source) => ({
  label:
    source === "Todas"
      ? "Todas origens"
      : source === "Salario"
        ? "Sal\u00e1rio"
        : source,
  value: source,
}));

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesTypeFilter(expense: Expense, filter: ExpenseTypeFilter) {
  const type = normalizeText(expense.type);

  if (filter === "Todas") {
    return true;
  }

  if (filter === "Parceladas") {
    return type === "parcelada";
  }

  if (filter === "Fixas") {
    return type === "fixa";
  }

  return type === "unica";
}

function matchesPaymentSourceFilter(expense: Expense, filter: PaymentSourceFilter) {
  if (filter === "Todas") {
    return true;
  }

  const source = normalizeText(expense.payment_source);

  if (filter === "Salario") {
    return source === "salario";
  }

  return source === normalizeText(filter);
}

function matchesCategoryFilter(expense: Expense, selectedCategoryId: string) {
  if (selectedCategoryId === "Todas") {
    return true;
  }

  return expense.category_id === Number(selectedCategoryId);
}

function getCategoryName(expense: Expense, categoriesById: Map<number, string>) {
  if (expense.category) {
    return expense.category;
  }

  if (typeof expense.category_id === "number") {
    return categoriesById.get(expense.category_id) ?? "Sem categoria";
  }

  return "Sem categoria";
}

function formatExpenseDate(date: string) {
  const inputDate = date.includes("T") ? date.split("T")[0] : date;
  const [year, month, day] = inputDate.split("-");

  if (!year || !month || !day) {
    return "--/--";
  }

  return `${day}/${month}`;
}

function getPaymentSourceLabel(source: string) {
  const normalized = normalizeText(source);

  if (normalized.includes("adiantamento")) {
    return "Adiantamento";
  }

  if (normalized.includes("renda extra")) {
    return "Renda Extra";
  }

  return "Sal\u00e1rio";
}

function getInstallmentLabel(expense: Expense) {
  if (normalizeText(expense.type) !== "parcelada") {
    return null;
  }

  const current = expense.current_installment ?? 1;

  return `${current}/${expense.installments}`;
}

function getCategoriesMap(categories: Category[]) {
  return new Map(categories.map((category) => [category.id, category.name]));
}

type ExpenseCardProps = {
  categoryName: string;
  expense: Expense;
  onDelete: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
};

function ExpenseCard({ categoryName, expense, onDelete, onEdit }: ExpenseCardProps) {
  const installmentLabel = getInstallmentLabel(expense);

  return (
    <article className="grid gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/85 dark:hover:border-blue-900/70 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-4 sm:py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/55 dark:text-blue-300">
        <ReceiptText aria-hidden="true" size={19} />
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
          {expense.description}
        </h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
          {categoryName}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700/65 dark:text-slate-300">
            {expense.type}
          </span>
          {installmentLabel ? (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              {installmentLabel}
            </span>
          ) : null}
          <span>• {formatExpenseDate(expense.date)}</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-end">
        <div className="flex items-center gap-0.5">
          <button
            aria-label={`Editar ${expense.description}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
            onClick={() => onEdit(expense)}
            title="Editar"
            type="button"
          >
            <Pencil aria-hidden="true" size={16} strokeWidth={2.4} />
          </button>
          <button
            aria-label={`Excluir ${expense.description}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => onDelete(expense)}
            title="Excluir"
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex flex-col items-end gap-1.5 text-right">
          <strong className="text-base font-semibold text-red-600 dark:text-red-200 sm:text-lg">
            - {formatMoney(expense.amount)}
          </strong>
          <p className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:text-sm">
            <WalletCards aria-hidden="true" className="text-blue-500" size={14} />
            {getPaymentSourceLabel(expense.payment_source)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ExpensesSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          key={index}
        />
      ))}
    </div>
  );
}

export function ExpensesView() {
  const [{ month, year }, setSelectedDate] = useState(getCurrentMonthReference);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [formExpense, setFormExpense] = useState<Expense | null>(null);
  const [formMode, setFormMode] = useState<ExpenseFormMode | null>(null);
  const [paymentSourceFilter, setPaymentSourceFilter] =
    useState<PaymentSourceFilter>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("Todas");
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>("Todas");

  const categories = useExpenseStore((state) => state.categories);
  const clearFeedback = useExpenseStore((state) => state.clearFeedback);
  const error = useExpenseStore((state) => state.error);
  const expenses = useExpenseStore((state) => state.expenses);
  const isLoading = useExpenseStore((state) => state.isLoading);
  const loadInitialData = useExpenseStore((state) => state.loadInitialData);
  const message = useExpenseStore((state) => state.message);

  useEffect(() => {
    void loadInitialData(month, year);
  }, [loadInitialData, month, year]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearFeedback();
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [clearFeedback, message]);

  const categoriesById = useMemo(() => getCategoriesMap(categories), [categories]);
  const filteredExpenses = useMemo(() => {
    const search = normalizeText(searchQuery);

    return expenses.filter((expense) => {
      const matchesSearch = normalizeText(expense.description).includes(search);
      const matchesType = matchesTypeFilter(expense, typeFilter);
      const matchesPaymentSource = matchesPaymentSourceFilter(
        expense,
        paymentSourceFilter,
      );
      const matchesCategory = matchesCategoryFilter(expense, selectedCategoryId);

      return matchesSearch && matchesType && matchesPaymentSource && matchesCategory;
    });
  }, [expenses, paymentSourceFilter, searchQuery, selectedCategoryId, typeFilter]);

  const totalAmount = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  function openCreateDialog() {
    setFormExpense(null);
    setFormMode("create");
  }

  function openEditDialog(expense: Expense) {
    setFormExpense(expense);
    setFormMode("edit");
  }

  function closeFormDialog() {
    setFormExpense(null);
    setFormMode(null);
  }

  function refreshExpenses() {
    closeFormDialog();
    setDeleteTarget(null);
    void loadInitialData(month, year);
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[11rem_13rem_14rem_minmax(14rem,1fr)_auto] lg:items-center">
            <DropdownSelect
              ariaLabel="Filtrar por tipo"
              icon={ReceiptText}
              onChange={setTypeFilter}
              options={typeFilterOptions}
              value={typeFilter}
            />

            <DropdownSelect
              ariaLabel="Filtrar por origem"
              icon={WalletCards}
              onChange={setPaymentSourceFilter}
              options={paymentSourceFilterOptions}
              value={paymentSourceFilter}
            />

            <DropdownSelect
              ariaLabel="Filtrar por categoria"
              className="sm:col-span-2 lg:col-span-1"
              icon={ListFilter}
              onChange={setSelectedCategoryId}
              options={[
                { label: "Todas categorias", value: "Todas" },
                ...categories.map((category) => ({
                  label: category.name,
                  value: String(category.id),
                })),
              ]}
              value={selectedCategoryId}
            />

            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-950 dark:focus:ring-blue-950/60"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar..."
                value={searchQuery}
              />
            </div>

            <Button
              className="hidden rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400 sm:col-span-2 sm:inline-flex lg:col-span-1"
              onClick={openCreateDialog}
              size="sm"
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Nova despesa
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <MonthSwitcher
            className="border-transparent bg-transparent shadow-none dark:border-transparent dark:bg-transparent"
            month={month}
            onChange={setSelectedDate}
            year={year}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <FileText aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Exibindo
              </p>
              <strong className="text-base font-semibold text-slate-950 dark:text-slate-50">
                {filteredExpenses.length} despesas
              </strong>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <CalendarDays aria-hidden="true" className="text-slate-400" size={18} />
            <strong className="text-lg font-semibold text-red-600 dark:text-red-300">
              - {formatMoney(totalAmount)}
            </strong>
          </div>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        {isLoading ? <ExpensesSkeleton /> : null}

        {!isLoading && !filteredExpenses.length ? (
          <div className="rounded-[1.35rem] border border-slate-200 bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <ReceiptText aria-hidden="true" size={28} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">
              Nenhuma despesa encontrada
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Ajuste os filtros ou cadastre uma nova despesa para este mes.
            </p>
          </div>
        ) : null}

        {!isLoading && filteredExpenses.length ? (
          <div className="space-y-2.5">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                categoryName={getCategoryName(expense, categoriesById)}
                expense={expense}
                key={expense.id}
                onDelete={setDeleteTarget}
                onEdit={openEditDialog}
              />
            ))}
          </div>
        ) : null}
      </section>

      <button
        aria-label="Nova despesa"
        className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-950/25 hover:bg-blue-700 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400 sm:hidden"
        onClick={openCreateDialog}
        type="button"
      >
        <Plus aria-hidden="true" size={30} strokeWidth={2.4} />
      </button>

      {message ? (
        <div
          aria-live="polite"
          className="fixed right-4 top-20 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl shadow-slate-950/20 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 sm:right-8"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
              strokeWidth={2.25}
            />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <ExpenseFormDialog
        expense={formExpense}
        mode={formMode}
        month={month}
        onClose={closeFormDialog}
        onSuccess={refreshExpenses}
        year={year}
      />

      <ExpenseDeleteDialog
        expense={deleteTarget}
        key={deleteTarget?.id ?? "empty-delete-dialog"}
        onClose={() => setDeleteTarget(null)}
        onSuccess={refreshExpenses}
      />
    </>
  );
}

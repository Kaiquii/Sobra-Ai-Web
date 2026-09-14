"use client";

import {
  ListFilter,
  Loader2,
  Minus,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { useExpenseStore } from "@/features/expenses/store/useExpenseStore";
import type {
  Category,
  CreateExpenseRequest,
  Expense,
  ExpenseType,
  PaymentSource,
  UpdateExpenseRequest,
} from "@/features/expenses/types/expense";
import { formatAmountInput, formatMoney, parseAmountInput } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export type ExpenseFormMode = "create" | "edit";

type ExpenseFormDialogProps = {
  expense: Expense | null;
  mode: ExpenseFormMode | null;
  month: number;
  onClose: () => void;
  onSuccess: () => void;
  year: number;
};

type ExpenseDraft = {
  amount: string;
  categoryId: number | null;
  date: string;
  description: string;
  installments: number;
  notes: string;
  paymentSource: PaymentSource;
  type: ExpenseType;
  updateFuture: boolean;
};

type PaymentSplitDraft = {
  amount: string;
  paymentSource: PaymentSource;
};

const NOTES_MAX_LENGTH = 500;
const paymentSources: PaymentSource[] = ["Sal\u00e1rio", "Adiantamento", "Renda Extra"];
const expenseTypes: ExpenseType[] = ["\u00danica", "Parcelada", "Fixa"];

const dropdownTriggerClassName =
  "h-11 rounded-md border-slate-300 bg-white text-slate-950 shadow-sm focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus-visible:border-emerald-400 dark:focus-visible:bg-slate-950 dark:focus-visible:ring-emerald-950";

const paymentSourceOptions = paymentSources.map((source) => ({
  label: source,
  value: source,
}));

const expenseTypeOptions = expenseTypes.map((type) => ({
  label: type,
  value: type,
}));

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeType(value: string): ExpenseType {
  const normalized = normalizeText(value);

  if (normalized === "parcelada") {
    return "Parcelada";
  }

  if (normalized === "fixa") {
    return "Fixa";
  }

  return "\u00danica";
}

function normalizePaymentSource(value: string): PaymentSource {
  const normalized = normalizeText(value);

  if (normalized.includes("adiantamento")) {
    return "Adiantamento";
  }

  if (normalized.includes("renda extra")) {
    return "Renda Extra";
  }

  return "Sal\u00e1rio";
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function getDefaultDate(month: number, year: number) {
  const now = new Date();
  const day =
    now.getMonth() + 1 === month && now.getFullYear() === year ? now.getDate() : 1;

  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

function getDateInputValue(date: string, month: number, year: number) {
  return date.includes("T") ? date.split("T")[0] : date || getDefaultDate(month, year);
}

function toApiDate(date: string) {
  return `${date}T00:00:00-03:00`;
}

function resolveCategoryId(expense: Expense, categories: Category[]) {
  if (typeof expense.category_id === "number") {
    return expense.category_id;
  }

  if (expense.category) {
    const category = categories.find(
      (item) => normalizeText(item.name) === normalizeText(expense.category ?? ""),
    );

    return category?.id ?? null;
  }

  return null;
}

function buildCreateDraft(month: number, year: number): ExpenseDraft {
  return {
    amount: "",
    categoryId: null,
    date: getDefaultDate(month, year),
    description: "",
    installments: 1,
    notes: "",
    paymentSource: "Sal\u00e1rio",
    type: "\u00danica",
    updateFuture: false,
  };
}

function buildEditDraft(
  expense: Expense,
  categories: Category[],
  month: number,
  year: number,
): ExpenseDraft {
  return {
    amount: formatAmountInput(expense.amount),
    categoryId: resolveCategoryId(expense, categories),
    date: getDateInputValue(expense.date, month, year),
    description: expense.description,
    installments: expense.installments || 1,
    notes: expense.notes ?? "",
    paymentSource:
      getExpensePaymentSplits(expense)[0]?.paymentSource ??
      normalizePaymentSource(expense.payment_source),
    type: normalizeType(expense.type),
    updateFuture: false,
  };
}

function getExpensePaymentSplits(expense: Expense): PaymentSplitDraft[] {
  const splits = expense.payment_splits?.length
    ? expense.payment_splits
    : [{ amount: expense.amount, payment_source: expense.payment_source }];

  return splits.map((split) => ({
    amount: formatAmountInput(split.amount),
    paymentSource: normalizePaymentSource(split.payment_source),
  }));
}

function getUpdateFuture(type: ExpenseType, updateFuture: boolean) {
  if (type === "\u00danica") {
    return null;
  }

  return updateFuture;
}

export function ExpenseFormDialog({
  expense,
  mode,
  month,
  onClose,
  onSuccess,
  year,
}: ExpenseFormDialogProps) {
  if (!mode) {
    return null;
  }

  return (
    <ExpenseFormDialogContent
      key={`${mode}-${expense?.id ?? "new"}-${month}-${year}`}
      expense={expense}
      mode={mode}
      month={month}
      onClose={onClose}
      onSuccess={onSuccess}
      year={year}
    />
  );
}

function ExpenseFormDialogContent({
  expense,
  mode,
  month,
  onClose,
  onSuccess,
  year,
}: Required<ExpenseFormDialogProps>) {
  useLockBodyScroll();

  const categories = useExpenseStore((state) => state.categories);
  const createCategory = useExpenseStore((state) => state.createCategory);
  const createExpense = useExpenseStore((state) => state.createExpense);
  const error = useExpenseStore((state) => state.error);
  const isSubmitting = useExpenseStore((state) => state.isSubmitting);
  const loadExpense = useExpenseStore((state) => state.loadExpense);
  const updateExpense = useExpenseStore((state) => state.updateExpense);

  const [draft, setDraft] = useState<ExpenseDraft>(() =>
    mode === "edit" && expense
      ? buildEditDraft(expense, categories, month, year)
      : buildCreateDraft(month, year),
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isFixedUpdateDialogOpen, setIsFixedUpdateDialogOpen] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(() =>
    Boolean(expense && getExpensePaymentSplits(expense).length > 1),
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplitDraft[]>(() =>
    expense ? getExpensePaymentSplits(expense) : [],
  );

  useEffect(() => {
    if (mode !== "edit" || !expense) {
      return;
    }

    let isMounted = true;

    void loadExpense(expense.id).then((loadedExpense) => {
      if (isMounted && loadedExpense) {
        setDraft(buildEditDraft(loadedExpense, categories, month, year));
        const splits = getExpensePaymentSplits(loadedExpense);
        setIsSplitPayment(splits.length > 1);
        setPaymentSplits(splits);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [categories, expense, loadExpense, mode, month, year]);

  const selectedCategoryId = draft.categoryId ?? categories[0]?.id ?? null;
  const showInstallments = draft.type === "Parcelada";
  const showUpdateFuture = mode === "edit" && draft.type !== "\u00danica";
  const updateFutureLabel =
    draft.type === "Parcelada"
      ? "Atualizar parcelas futuras?"
      : "Atualizar despesas futuras?";
  const splitTotal = paymentSplits.reduce((total, split) => {
    const splitAmount = parseAmountInput(split.amount);
    return total + (Number.isFinite(splitAmount) ? splitAmount : 0);
  }, 0);
  const hasValidSplitAmounts = paymentSplits.every((split) => {
    const splitAmount = parseAmountInput(split.amount);
    return Number.isFinite(splitAmount) && splitAmount > 0;
  });
  const hasUniqueSplitSources =
    new Set(paymentSplits.map((split) => normalizePaymentSource(split.paymentSource))).size ===
    paymentSplits.length;
  const expenseAmount = parseAmountInput(draft.amount);
  const displayedExpenseAmount = Number.isFinite(expenseAmount) ? expenseAmount : 0;
  const isDistributionValid =
    paymentSplits.length >= 2 &&
    hasValidSplitAmounts &&
    hasUniqueSplitSources &&
    Number.isFinite(expenseAmount) &&
    Math.abs(splitTotal - displayedExpenseAmount) < 0.005;

  const categoryOptions = useMemo(
    () =>
      categories.length
        ? categories.map((category) => ({
            label: category.name,
            value: String(category.id),
          }))
        : [{ label: "Cadastre uma categoria", value: "" }],
    [categories],
  );

  function updateDraft(nextDraft: Partial<ExpenseDraft>) {
    setDraft((current) => ({ ...current, ...nextDraft }));
  }

  function toggleSplitPayment(nextValue: boolean) {
    setIsSplitPayment(nextValue);

    if (nextValue) {
      setPaymentSplits([
        {
          amount: draft.amount,
          paymentSource: draft.paymentSource,
        },
      ]);
      return;
    }

    const firstSplit = paymentSplits[0];
    if (firstSplit) {
      updateDraft({ paymentSource: firstSplit.paymentSource });
    }
  }

  function updatePaymentSplit(index: number, nextSplit: Partial<PaymentSplitDraft>) {
    setPaymentSplits((current) =>
      current.map((split, splitIndex) =>
        splitIndex === index ? { ...split, ...nextSplit } : split,
      ),
    );
  }

  function addPaymentSplit() {
    const nextSource = paymentSources.find(
      (source) =>
        !paymentSplits.some(
          (split) => normalizePaymentSource(split.paymentSource) === source,
        ),
    );

    if (nextSource) {
      setPaymentSplits((current) => [
        ...current,
        { amount: "", paymentSource: nextSource },
      ]);
    }
  }

  function removePaymentSplit(index: number) {
    const nextSplits = paymentSplits.filter((_, splitIndex) => splitIndex !== index);

    if (nextSplits.length <= 1) {
      const remainingSplit = nextSplits[0];
      setIsSplitPayment(false);
      setPaymentSplits(nextSplits);
      if (remainingSplit) {
        updateDraft({ paymentSource: remainingSplit.paymentSource });
      }
      return;
    }

    setPaymentSplits(nextSplits);
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();

    if (!name) {
      setLocalError("Informe o nome da categoria.");
      return;
    }

    try {
      setLocalError(null);
      const category = await createCategory({ name });

      if (category) {
        updateDraft({ categoryId: category.id });
        setIsAddingCategory(false);
        setNewCategoryName("");
      }
    } catch {}
  }

  async function submitExpense(confirmedFixedFuture = false) {
    const amount = parseAmountInput(draft.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalError("Informe um valor maior que zero.");
      return;
    }

    if (!draft.description.trim()) {
      setLocalError("Informe a descrição da despesa.");
      return;
    }

    if (!selectedCategoryId) {
      setLocalError("Cadastre ou selecione uma categoria.");
      return;
    }

    if (isSplitPayment && !isDistributionValid) {
      setLocalError("Distribua o valor total entre origens diferentes antes de salvar.");
      return;
    }

    if (draft.notes.length > NOTES_MAX_LENGTH) {
      setLocalError("Observa\u00e7\u00f5es devem ter no m\u00e1ximo 500 caracteres.");
      return;
    }

    if (mode === "edit" && draft.type === "Fixa" && draft.updateFuture && !confirmedFixedFuture) {
      setIsFixedUpdateDialogOpen(true);
      return;
    }

    try {
      setLocalError(null);
      const notes = draft.notes.trim();

      if (mode === "create") {
        const basePayload = {
          amount,
          category_id: selectedCategoryId,
          date: toApiDate(draft.date),
          description: draft.description.trim(),
          installments: draft.type === "Parcelada" ? draft.installments : 1,
          notes,
          type: draft.type,
        };
        const payload: CreateExpenseRequest = isSplitPayment
          ? {
              ...basePayload,
              payment_splits: paymentSplits.map((split) => ({
                amount: parseAmountInput(split.amount),
                payment_source: split.paymentSource,
              })),
            }
          : { ...basePayload, payment_source: draft.paymentSource };

        await createExpense(payload);
      } else if (expense) {
        const basePayload = {
          amount,
          category_id: selectedCategoryId,
          date: toApiDate(draft.date),
          description: draft.description.trim(),
          notes,
          update_future: getUpdateFuture(draft.type, draft.updateFuture),
        };
        const payload: UpdateExpenseRequest = isSplitPayment
          ? {
              ...basePayload,
              payment_splits: paymentSplits.map((split) => ({
                amount: parseAmountInput(split.amount),
                payment_source: split.paymentSource,
              })),
            }
          : { ...basePayload, payment_source: draft.paymentSource };

        await updateExpense(expense.id, payload);
      }

      onSuccess();
    } catch {}
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitExpense();
  }

  return (
    <>
      <div
        aria-labelledby="expense-form-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-slate-950/75 backdrop-blur-sm sm:items-center sm:px-4 sm:py-3"
        role="dialog"
      >
        <form
          className="flex h-dvh w-full flex-col bg-white pt-[env(safe-area-inset-top)] dark:bg-slate-950 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:rounded-lg sm:border sm:border-slate-200 sm:p-6 sm:shadow-xl sm:dark:border-slate-800 sm:dark:bg-slate-900"
          onSubmit={handleSubmit}
        >
          <div className="grid h-14 shrink-0 grid-cols-[48px_1fr_48px] items-center px-2 sm:h-auto sm:grid-cols-[1fr_auto] sm:px-0">
            <Button aria-label="Fechar despesa" className="sm:col-start-2 sm:row-start-1" disabled={isSubmitting} onClick={onClose} size="icon" type="button" variant="ghost">
              <X aria-hidden="true" size={24} />
            </Button>
            <h2 id="expense-form-title" className="text-center text-lg font-bold text-slate-950 dark:text-white sm:col-start-1 sm:row-start-1 sm:text-left sm:text-2xl">
              {mode === "create" ? "Nova Despesa" : "Editar Despesa"}
            </h2>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 sm:mt-4 sm:space-y-3 sm:px-0 sm:py-0 sm:pr-1">
            {error || localError ? (
              <Alert variant="error">{localError ?? error}</Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 pb-3 text-center sm:pb-0 sm:text-left">
                <Label htmlFor="expense-amount">Valor da Despesa</Label>
                <div className="flex min-w-0 items-center justify-center gap-2 sm:block">
                <span aria-hidden="true" className="text-2xl font-bold text-slate-500 sm:hidden">R$</span>
                <Input
                  className="max-sm:h-16 max-sm:w-auto max-sm:min-w-0 max-sm:max-w-[calc(100%-3rem)] max-sm:border-0 max-sm:bg-transparent max-sm:px-0 max-sm:text-center max-sm:text-4xl! max-sm:font-bold max-sm:shadow-none max-sm:dark:bg-transparent"
                  size={Math.max(4, draft.amount.length)}
                  id="expense-amount"
                  inputMode="decimal"
                  onChange={(event) => updateDraft({ amount: event.target.value })}
                  placeholder="0,00"
                  value={draft.amount}
                />
                </div>
              </div>

              <div className="hidden space-y-2 sm:block">
                <Label htmlFor="expense-date">Data de pagamento</Label>
                <DatePicker
                  id="expense-date"
                  onChange={(date) => updateDraft({ date })}
                  value={draft.date}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-description">Descrição</Label>
              <Input
                id="expense-description"
                onChange={(event) => updateDraft({ description: event.target.value })}
                placeholder="Ex: Supermercado"
                value={draft.description}
              />
            </div>



            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Categoria</Label>
                <DropdownSelect
                  ariaLabel="Selecionar categoria"
                  id="expense-category"
                  icon={ListFilter}
                  disabled={!categories.length}
                  onChange={(value) => updateDraft({ categoryId: Number(value) })}
                  options={categoryOptions}
                  triggerClassName={dropdownTriggerClassName}
                  value={selectedCategoryId ? String(selectedCategoryId) : ""}
                />
              </div>

              <button
                aria-label="Criar categoria"
                title="Criar categoria"
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsAddingCategory((current) => !current)}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                <span className="hidden sm:inline">Categoria</span>
              </button>
            </div>

            {isAddingCategory ? (
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70 sm:grid-cols-[1fr_auto]">
                <Input
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Nome da categoria"
                  value={newCategoryName}
                />
                <button
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
                  disabled={isSubmitting}
                  onClick={handleCreateCategory}
                  type="button"
                >
                  Criar
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className={isSplitPayment ? "space-y-3 sm:col-span-3" : "space-y-2"}>
                <Label htmlFor="expense-source">Origem do pagamento</Label>

                {!isSplitPayment ? (
                  <div className="space-y-2">
                    <DropdownSelect
                      ariaLabel="Selecionar origem"
                      id="expense-source"
                      icon={WalletCards}
                      onChange={(value) => updateDraft({ paymentSource: value })}
                      options={paymentSourceOptions}
                      triggerClassName={dropdownTriggerClassName}
                      value={draft.paymentSource}
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200">
                      <input
                        checked={isSplitPayment}
                        className="h-4 w-4 rounded border-slate-400 accent-blue-600"
                        onChange={(event) => toggleSplitPayment(event.target.checked)}
                        type="checkbox"
                      />
                      Dividir pagamento
                    </label>
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-950/70 dark:bg-blue-950/20">
                    <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200">
                      <input
                        checked={isSplitPayment}
                        className="h-4 w-4 rounded border-slate-400 accent-blue-600"
                        onChange={(event) => toggleSplitPayment(event.target.checked)}
                        type="checkbox"
                      />
                      Pagamento dividido
                    </label>
                    <div className="hidden grid-cols-[minmax(0,1fr)_minmax(8rem,0.7fr)_auto] gap-3 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:grid">
                      <span>Origem</span>
                      <span>Valor</span>
                      <span className="sr-only">Remover</span>
                    </div>

                    <div className="space-y-2">
                      {paymentSplits.map((split, index) => {
                        const selectedSources = paymentSplits
                          .filter((_, splitIndex) => splitIndex !== index)
                          .map((item) => normalizePaymentSource(item.paymentSource));
                        const options = paymentSourceOptions.filter(
                          (option) =>
                            option.value === split.paymentSource ||
                            !selectedSources.includes(normalizePaymentSource(option.value)),
                        );

                        return (
                          <div
                            className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.7fr)_auto] sm:items-end"
                            key={split.paymentSource}
                          >
                            <div className="space-y-1.5">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:hidden">
                                Origem
                              </span>
                              <DropdownSelect
                                ariaLabel={`Selecionar origem ${index + 1}`}
                                icon={WalletCards}
                                onChange={(value) => updatePaymentSplit(index, { paymentSource: value })}
                                options={options}
                                triggerClassName={dropdownTriggerClassName}
                                value={split.paymentSource}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:hidden">
                                Valor
                              </span>
                              <Input
                                inputMode="decimal"
                                onChange={(event) => updatePaymentSplit(index, { amount: event.target.value })}
                                placeholder="0,00"
                                value={split.amount}
                              />
                            </div>
                            <Button
                              aria-label={`Remover ${split.paymentSource}`}
                              className="justify-self-end rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
                              onClick={() => removePaymentSplit(index)}
                              size="icon"
                              title="Remover origem"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 aria-hidden="true" size={17} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {paymentSplits.length < paymentSources.length ? (
                      <Button
                        className="mt-3 h-9 border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-900/80 dark:text-blue-300 dark:hover:bg-blue-950/50"
                        onClick={addPaymentSplit}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Plus aria-hidden="true" size={15} />
                        Adicionar origem
                      </Button>
                    ) : null}

                    <p
                      className={cn(
                        "mt-3 text-sm font-semibold tabular-nums",
                        isDistributionValid
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-700 dark:text-amber-300",
                      )}
                    >
                      Total distribuído: {formatMoney(splitTotal)} de {formatMoney(displayedExpenseAmount)}
                    </p>
                    {!hasUniqueSplitSources ? (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-300">
                        Escolha uma origem diferente em cada linha.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:hidden">
                <Label htmlFor="expense-date-mobile">Data de pagamento</Label>
                <DatePicker
                  id="expense-date-mobile"
                  onChange={(date) => updateDraft({ date })}
                  value={draft.date}
                />
              </div>

              <div className={cn("space-y-2", mode === "edit" && "max-sm:hidden")}>
                <Label htmlFor="expense-type">Tipo de pagamento</Label>
                <div className="grid grid-cols-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 sm:hidden" role="group" aria-label="Tipo da despesa">
                  {expenseTypes.map((type) => (
                    <button key={type} type="button" disabled={mode === "edit"} aria-pressed={draft.type === type} onClick={() => updateDraft({ type, installments: 1 })} className={cn("h-12 min-w-0 cursor-pointer px-1 text-sm font-semibold disabled:cursor-not-allowed", draft.type === type ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300")}>
                      {type}
                    </button>
                  ))}
                </div>
                <DropdownSelect
                  className="hidden sm:block"
                  ariaLabel="Selecionar tipo"
                  id="expense-type"
                  disabled={mode === "edit"}
                  icon={ReceiptText}
                  onChange={(value) => updateDraft({ installments: 1, type: value })}
                  options={expenseTypeOptions}
                  triggerClassName={dropdownTriggerClassName}
                  value={draft.type}
                />
              </div>

              <div className={cn("space-y-2", (!showInstallments || mode === "edit") && "max-sm:hidden")}>
                <Label htmlFor="expense-installments">Parcelas</Label>
                <div className="flex h-14 items-center justify-between rounded-xl bg-slate-100 px-2 dark:bg-slate-900 sm:hidden">
                  <Button aria-label="Diminuir parcelas" disabled={mode === "edit" || draft.installments <= 1} onClick={() => updateDraft({ installments: draft.installments - 1 })} size="icon" variant="ghost" type="button"><Minus aria-hidden="true" size={22} /></Button>
                  <output aria-label="Número de parcelas" className="font-semibold tabular-nums">{draft.installments}x</output>
                  <Button aria-label="Aumentar parcelas" disabled={mode === "edit"} onClick={() => updateDraft({ installments: draft.installments + 1 })} size="icon" variant="ghost" type="button"><Plus aria-hidden="true" size={22} /></Button>
                </div>
                <Input
                  className="hidden sm:block"
                  disabled={!showInstallments || mode === "edit"}
                  id="expense-installments"
                  min={1}
                  onChange={(event) =>
                    updateDraft({ installments: Number(event.target.value) })
                  }
                  type="number"
                  value={showInstallments ? draft.installments : 1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="expense-notes">Observações</Label>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {draft.notes.length} / {NOTES_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                className="min-h-20"
                id="expense-notes"
                maxLength={NOTES_MAX_LENGTH}
                onChange={(event) => updateDraft({ notes: event.target.value })}
                placeholder="Ex: Divisão do valor, motivo ou lembrete."
                value={draft.notes}
              />
            </div>

            {showUpdateFuture ? (
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                <input
                  aria-label={updateFutureLabel}
                  checked={draft.updateFuture}
                  className="hidden h-5 w-5 rounded border-slate-400 bg-transparent accent-blue-600 sm:block"
                  onChange={(event) => updateDraft({ updateFuture: event.target.checked })}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">{updateFutureLabel}</span>
                <Switch ariaLabel={updateFutureLabel} className="sm:hidden" checked={draft.updateFuture} disabled={isSubmitting} onCheckedChange={(updateFuture) => updateDraft({ updateFuture })} />
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-6 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:mt-4 sm:p-0">
            <button
              className="hidden cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:cursor-not-allowed dark:text-blue-500 sm:block"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-500 max-sm:h-13 max-sm:w-full max-sm:rounded-xl max-sm:bg-blue-600 max-sm:text-white max-sm:dark:text-white max-sm:hover:text-white max-sm:hover:bg-blue-700",
              )}
              disabled={isSubmitting || (isSplitPayment && !isDistributionValid)}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={15} />
              ) : (
                <Save aria-hidden="true" size={15} />
              )}
              {mode === "edit" ? "Salvar alterações" : "Salvar despesa"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationDialog
        confirmLabel="Sim, atualizar futuras"
        description="Essa despesa é fixa. Confirmando, a atualização será aplicada nas despesas futuras conforme o back-end."
        isOpen={isFixedUpdateDialogOpen}
        onClose={() => setIsFixedUpdateDialogOpen(false)}
        onConfirm={() => {
          setIsFixedUpdateDialogOpen(false);
          void submitExpense(true);
        }}
        title="Atualizar despesas futuras?"
      />
    </>
  );
}

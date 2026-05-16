"use client";

import { ListFilter, Loader2, Plus, ReceiptText, Save, WalletCards } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  paymentSource: PaymentSource;
  type: ExpenseType;
  updateFuture: boolean;
};

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

function parseAmountInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return Number.NaN;
  }

  if (trimmed.includes(",")) {
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }

  return Number(trimmed);
}

function formatAmountInput(value: number) {
  return String(value).replace(".", ",");
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
    paymentSource: normalizePaymentSource(expense.payment_source),
    type: normalizeType(expense.type),
    updateFuture: false,
  };
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !expense) {
      return;
    }

    let isMounted = true;

    void loadExpense(expense.id).then((loadedExpense) => {
      if (isMounted && loadedExpense) {
        setDraft(buildEditDraft(loadedExpense, categories, month, year));
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
    } catch {
      // A store mostra a mensagem no modal.
    }
  }

  async function submitExpense(confirmedFixedFuture = false) {
    const amount = parseAmountInput(draft.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalError("Informe um valor maior que zero.");
      return;
    }

    if (!draft.description.trim()) {
      setLocalError("Informe a descricao da despesa.");
      return;
    }

    if (!selectedCategoryId) {
      setLocalError("Cadastre ou selecione uma categoria.");
      return;
    }

    if (mode === "edit" && draft.type === "Fixa" && draft.updateFuture && !confirmedFixedFuture) {
      setIsFixedUpdateDialogOpen(true);
      return;
    }

    try {
      setLocalError(null);

      if (mode === "create") {
        const payload: CreateExpenseRequest = {
          amount,
          category_id: selectedCategoryId,
          date: toApiDate(draft.date),
          description: draft.description.trim(),
          installments: draft.type === "Parcelada" ? draft.installments : 1,
          payment_source: draft.paymentSource,
          type: draft.type,
        };

        await createExpense(payload);
      } else if (expense) {
        const payload: UpdateExpenseRequest = {
          amount,
          category_id: selectedCategoryId,
          date: toApiDate(draft.date),
          description: draft.description.trim(),
          payment_source: draft.paymentSource,
          update_future: getUpdateFuture(draft.type, draft.updateFuture),
        };

        await updateExpense(expense.id, payload);
      }

      onSuccess();
    } catch {
      // A store mostra a mensagem no modal.
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitExpense();
  }

  return (
    <>
      <div
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
        role="dialog"
      >
        <form
          className="my-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          onSubmit={handleSubmit}
        >
          <h2 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
            {mode === "create" ? "Nova despesa" : "Editar despesa"}
          </h2>

          <div className="mt-7 space-y-5">
            {error || localError ? (
              <Alert variant="error">{localError ?? error}</Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Valor</Label>
                <Input
                  autoFocus
                  id="expense-amount"
                  inputMode="decimal"
                  onChange={(event) => updateDraft({ amount: event.target.value })}
                  placeholder="Ex: 150,75"
                  value={draft.amount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-date">Data de pagamento</Label>
                <DatePicker
                  id="expense-date"
                  onChange={(date) => updateDraft({ date })}
                  value={draft.date}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-description">Descricao</Label>
              <Input
                id="expense-description"
                onChange={(event) => updateDraft({ description: event.target.value })}
                placeholder="Ex: Supermercado"
                value={draft.description}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsAddingCategory((current) => !current)}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Categoria
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
                  className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
                  disabled={isSubmitting}
                  onClick={handleCreateCategory}
                  type="button"
                >
                  Criar
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="expense-source">Origem</Label>
                <DropdownSelect
                  ariaLabel="Selecionar origem"
                  id="expense-source"
                  icon={WalletCards}
                  onChange={(value) => updateDraft({ paymentSource: value })}
                  options={paymentSourceOptions}
                  triggerClassName={dropdownTriggerClassName}
                  value={draft.paymentSource}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-type">Tipo</Label>
                <DropdownSelect
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

              <div className="space-y-2">
                <Label htmlFor="expense-installments">Parcelas</Label>
                <Input
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

            {showUpdateFuture ? (
              <label className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                <input
                  checked={draft.updateFuture}
                  className="h-5 w-5 rounded border-slate-400 bg-transparent accent-blue-600"
                  onChange={(event) => updateDraft({ updateFuture: event.target.checked })}
                  type="checkbox"
                />
                {updateFutureLabel}
              </label>
            ) : null}
          </div>

          <div className="mt-8 flex justify-end gap-8">
            <button
              className="text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-500"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-60 dark:text-blue-500",
              )}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={15} />
              ) : (
                <Save aria-hidden="true" size={15} />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>

      <ConfirmationDialog
        confirmLabel="Sim, atualizar futuras"
        description="Essa despesa e fixa. Confirmando, a atualizacao sera aplicada nas despesas futuras conforme o back-end."
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

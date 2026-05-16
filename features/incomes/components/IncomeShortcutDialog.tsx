"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { useIncomeStore } from "@/features/incomes/store/useIncomeStore";
import type { Income, IncomeSource } from "@/features/incomes/types/income";
import { cn } from "@/lib/utils";

export type IncomeShortcutAction = "create" | "delete" | "edit";

export type IncomeShortcut = {
  action: IncomeShortcutAction;
  amount: number;
  month: number;
  source: IncomeSource;
  year: number;
};

type IncomeShortcutDialogProps = {
  onClose: () => void;
  onSuccess: () => void;
  shortcut: IncomeShortcut | null;
};

const sourceLabels: Record<IncomeSource, string> = {
  Adiantamento: "adiantamento",
  "Renda Extra": "renda extra",
  Salario: "salario",
};

function formatAmountInput(value: number) {
  return String(value).replace(".", ",");
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

function normalizeSource(source: string): IncomeSource {
  const normalized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("adiantamento")) {
    return "Adiantamento";
  }

  if (normalized.includes("renda extra")) {
    return "Renda Extra";
  }

  return "Salario";
}

function findIncome(
  incomes: Income[],
  source: IncomeSource,
  month: number,
  year: number,
) {
  return incomes.find(
    (income) =>
      normalizeSource(income.source) === source &&
      income.month === month &&
      income.year === year,
  );
}

function getTitle({ action, source }: IncomeShortcut) {
  if (action === "create") {
    return `Criar ${sourceLabels[source]}`;
  }

  if (action === "edit") {
    return `Editar ${sourceLabels[source]}`;
  }

  return "Excluir renda";
}

function getDefaultFuture({ action, source }: IncomeShortcut) {
  if (action === "edit") {
    return true;
  }

  if (action === "delete") {
    return false;
  }

  return source !== "Renda Extra";
}

export function IncomeShortcutDialog({
  onClose,
  onSuccess,
  shortcut,
}: IncomeShortcutDialogProps) {
  if (!shortcut) {
    return null;
  }

  return (
    <IncomeShortcutDialogContent
      key={`${shortcut.action}-${shortcut.source}-${shortcut.month}-${shortcut.year}-${shortcut.amount}`}
      onClose={onClose}
      onSuccess={onSuccess}
      shortcut={shortcut}
    />
  );
}

type IncomeShortcutDialogContentProps = {
  onClose: () => void;
  onSuccess: () => void;
  shortcut: IncomeShortcut;
};

function IncomeShortcutDialogContent({
  onClose,
  onSuccess,
  shortcut,
}: IncomeShortcutDialogContentProps) {
  useLockBodyScroll();

  const clearFeedback = useIncomeStore((state) => state.clearFeedback);
  const createIncome = useIncomeStore((state) => state.createIncome);
  const deleteIncome = useIncomeStore((state) => state.deleteIncome);
  const error = useIncomeStore((state) => state.error);
  const incomes = useIncomeStore((state) => state.incomes);
  const isLoading = useIncomeStore((state) => state.isLoading);
  const isSubmitting = useIncomeStore((state) => state.isSubmitting);
  const loadIncomes = useIncomeStore((state) => state.loadIncomes);
  const updateIncome = useIncomeStore((state) => state.updateIncome);

  const [amount, setAmount] = useState(
    shortcut.action === "edit" ? formatAmountInput(shortcut.amount) : "",
  );
  const [applyFuture, setApplyFuture] = useState(getDefaultFuture(shortcut));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void loadIncomes();
  }, [loadIncomes]);

  const selectedIncome = useMemo(
    () => findIncome(incomes, shortcut.source, shortcut.month, shortcut.year),
    [incomes, shortcut.month, shortcut.source, shortcut.year],
  );

  const isDelete = shortcut.action === "delete";
  const needsExistingIncome = shortcut.action === "edit" || shortcut.action === "delete";
  const missingIncome = !isLoading && needsExistingIncome && !selectedIncome;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    clearFeedback();

    if (missingIncome) {
      setLocalError("Nao encontrei essa renda para aplicar o atalho.");
      return;
    }

    try {
      if (shortcut.action === "delete") {
        await deleteIncome(selectedIncome!.id, applyFuture);
        onSuccess();
        return;
      }

      const parsedAmount = parseAmountInput(amount);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setLocalError("Informe um valor maior que zero.");
        return;
      }

      if (shortcut.action === "create") {
        const createPayload =
          shortcut.source === "Renda Extra"
            ? {
                amount: parsedAmount,
                month: shortcut.month,
                repeat_future: applyFuture,
                source: shortcut.source,
                type: "Fixa" as const,
                year: shortcut.year,
              }
            : {
                amount: parsedAmount,
                month: shortcut.month,
                repeat_future: null,
                source: shortcut.source,
                type: "Fixa" as const,
                year: shortcut.year,
              };

        await createIncome(createPayload);
      } else {
        await updateIncome(selectedIncome!.id, {
          amount: parsedAmount,
          update_future: applyFuture,
        });
      }

      onSuccess();
    } catch {
      // A store ja mostra a mensagem de erro no modal.
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <form
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
          {getTitle(shortcut)}
        </h2>

        <div className="mt-7 space-y-5">
          {error || localError ? (
            <Alert variant="error">{localError ?? error}</Alert>
          ) : null}

          {missingIncome ? (
            <Alert variant="info">
              Ainda nao existe registro para este mes. Use o atalho de criar.
            </Alert>
          ) : null}

          {isDelete ? (
            <p className="text-base leading-7 text-slate-700 dark:text-slate-200">
              Tem certeza que deseja remover o {sourceLabels[shortcut.source]}?
            </p>
          ) : (
            <div className="relative">
              <Input
                autoFocus
                className="h-14 rounded-md border-slate-400 bg-transparent px-4 text-base dark:border-slate-500 dark:bg-transparent"
                inputMode="decimal"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Valor"
                value={amount}
              />
              {shortcut.action === "edit" ? (
                <span className="absolute -top-3 left-4 bg-white px-1 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                  Valor
                </span>
              ) : null}
            </div>
          )}

          <label
            className={cn(
              "flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300",
              isSubmitting && "opacity-70",
            )}
          >
            <input
              checked={applyFuture}
              className={cn(
                "h-6 w-6 rounded border-slate-400 bg-transparent accent-blue-600",
                isDelete && "accent-red-500",
              )}
              disabled={isSubmitting}
              onChange={(event) => setApplyFuture(event.target.checked)}
              type="checkbox"
            />
            {shortcut.action === "create"
              ? "Repetir nos proximos meses"
              : shortcut.action === "edit"
                ? "Atualizar este e os proximos meses"
                : "Excluir esta e as proximas"}
          </label>
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
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400",
              isDelete &&
                "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-400",
            )}
            disabled={isSubmitting || missingIncome}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={15} />
            ) : null}
            {isDelete ? "Excluir" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

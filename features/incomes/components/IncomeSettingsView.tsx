"use client";

import {
  ArrowLeft,
  Banknote,
  CircleDollarSign,
  Gift,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { buttonClassName, Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCurrentMonthReference,
  MonthReference,
  MonthSwitcher,
} from "@/components/ui/month-switcher";
import { useIncomeStore } from "@/features/incomes/store/useIncomeStore";
import type { Income, IncomeSource } from "@/features/incomes/types/income";
import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

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

function formatAmountInput(value: number | undefined) {
  if (!value) {
    return "";
  }

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

type IncomeCardProps = {
  existingIncome: Income | undefined;
  icon: React.ReactNode;
  isSubmitting: boolean;
  onDelete: () => void;
  onSave: (amount: number, applyFuture: boolean, repeatFuture: boolean) => Promise<void>;
  showRepeatFutureOption?: boolean;
  title: string;
};

function IncomeCard({
  existingIncome,
  icon,
  isSubmitting,
  onDelete,
  onSave,
  showRepeatFutureOption = false,
  title,
}: IncomeCardProps) {
  const [amount, setAmount] = useState(formatAmountInput(existingIncome?.amount));
  const [repeatFuture, setRepeatFuture] = useState(false);
  const [updateFuture, setUpdateFuture] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasExistingIncome = Boolean(existingIncome);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const parsedAmount = parseAmountInput(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Informe um valor maior que zero.");
      return;
    }

    await onSave(parsedAmount, updateFuture, repeatFuture);
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {title}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasExistingIncome
              ? `Atual: ${moneyFormatter.format(existingIncome?.amount ?? 0)}`
              : "Nenhum valor cadastrado neste mes"}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {icon}
        </div>
      </div>

      {validationError ? (
        <div className="mt-4">
          <Alert variant="error">{validationError}</Alert>
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        <Label htmlFor={`${title}-amount`}>Valor</Label>
        <Input
          id={`${title}-amount`}
          inputMode="decimal"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0,00"
          value={amount}
        />
      </div>

      <div className="mt-4 space-y-3">
        {hasExistingIncome ? (
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <input
              checked={updateFuture}
              className="h-4 w-4 accent-blue-600"
              onChange={(event) => setUpdateFuture(event.target.checked)}
              type="checkbox"
            />
            Atualizar este e os proximos meses
          </label>
        ) : null}

        {!hasExistingIncome && showRepeatFutureOption ? (
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <input
              checked={repeatFuture}
              className="h-4 w-4 accent-blue-600"
              onChange={(event) => setRepeatFuture(event.target.checked)}
              type="checkbox"
            />
            Repetir nos proximos meses
          </label>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {hasExistingIncome ? (
          <Button
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
            disabled={isSubmitting}
            onClick={onDelete}
            type="button"
            variant="secondary"
          >
            <Trash2 aria-hidden="true" size={16} strokeWidth={2.25} />
            Excluir
          </Button>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
          ) : null}
          {hasExistingIncome ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}

type DeleteTarget = {
  income: Income;
  title: string;
} | null;

export function IncomeSettingsView() {
  const [{ month, year }, setSelectedDate] = useState<MonthReference>(
    getCurrentMonthReference,
  );
  const clearFeedback = useIncomeStore((state) => state.clearFeedback);
  const createIncome = useIncomeStore((state) => state.createIncome);
  const deleteIncome = useIncomeStore((state) => state.deleteIncome);
  const error = useIncomeStore((state) => state.error);
  const incomes = useIncomeStore((state) => state.incomes);
  const isLoading = useIncomeStore((state) => state.isLoading);
  const isSubmitting = useIncomeStore((state) => state.isSubmitting);
  const loadIncomes = useIncomeStore((state) => state.loadIncomes);
  const message = useIncomeStore((state) => state.message);
  const updateIncome = useIncomeStore((state) => state.updateIncome);

  const [deleteFuture, setDeleteFuture] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  useEffect(() => {
    void loadIncomes();

    return () => clearFeedback();
  }, [clearFeedback, loadIncomes]);

  const currentIncomes = useMemo(
    () => ({
      adiantamento: findIncome(incomes, "Adiantamento", month, year),
      rendaExtra: findIncome(incomes, "Renda Extra", month, year),
      salario: findIncome(incomes, "Salario", month, year),
    }),
    [incomes, month, year],
  );

  async function handleSave(
    source: IncomeSource,
    existingIncome: Income | undefined,
    amount: number,
    updateFuture: boolean,
    repeatFuture: boolean,
  ) {
    clearFeedback();

    try {
      if (existingIncome) {
        await updateIncome(existingIncome.id, {
          amount,
          update_future: updateFuture,
        });
        return;
      }

      await createIncome({
        amount,
        month,
        repeat_future: source === "Renda Extra" ? repeatFuture : null,
        source,
        type: "Fixa",
        year,
      });
    } catch {
      // Feedback is handled by the income store.
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    clearFeedback();

    try {
      await deleteIncome(deleteTarget.income.id, deleteFuture);
      setDeleteTarget(null);
      setDeleteFuture(false);
    } catch {
      // Feedback is handled by the income store.
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Configuracoes de Renda
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Salario, Adiantamento e Renda Extra
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Referencia selecionada: {String(month).padStart(2, "0")}/{year}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Link
              className={buttonClassName({ className: "self-start sm:self-end", variant: "secondary" })}
              href="/perfil"
            >
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
              Voltar
            </Link>
            <MonthSwitcher
              className="sm:max-w-xs"
              month={month}
              onChange={setSelectedDate}
              year={year}
            />
          </div>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {message ? <Alert variant="success">{message}</Alert> : null}
        {isLoading ? <Alert>Carregando rendas...</Alert> : null}

        <div className={cn("grid gap-4 lg:grid-cols-3", isLoading && "opacity-70")}>
          <IncomeCard
            existingIncome={currentIncomes.salario}
            icon={<Banknote aria-hidden="true" size={22} strokeWidth={2.25} />}
            isSubmitting={isSubmitting}
            key={`salario-${month}-${year}-${currentIncomes.salario?.id ?? "new"}`}
            onDelete={() =>
              currentIncomes.salario
                ? setDeleteTarget({
                    income: currentIncomes.salario,
                    title: "salario",
                  })
                : undefined
            }
            onSave={(amount, updateFuture, repeatFuture) =>
              handleSave(
                "Salario",
                currentIncomes.salario,
                amount,
                updateFuture,
                repeatFuture,
              )
            }
            title="Salario"
          />

          <IncomeCard
            existingIncome={currentIncomes.adiantamento}
            icon={<CircleDollarSign aria-hidden="true" size={22} strokeWidth={2.25} />}
            isSubmitting={isSubmitting}
            key={`adiantamento-${month}-${year}-${currentIncomes.adiantamento?.id ?? "new"}`}
            onDelete={() =>
              currentIncomes.adiantamento
                ? setDeleteTarget({
                    income: currentIncomes.adiantamento,
                    title: "adiantamento",
                  })
                : undefined
            }
            onSave={(amount, updateFuture, repeatFuture) =>
              handleSave(
                "Adiantamento",
                currentIncomes.adiantamento,
                amount,
                updateFuture,
                repeatFuture,
              )
            }
            title="Adiantamento"
          />

          <IncomeCard
            existingIncome={currentIncomes.rendaExtra}
            icon={<Gift aria-hidden="true" size={22} strokeWidth={2.25} />}
            isSubmitting={isSubmitting}
            key={`renda-extra-${month}-${year}-${currentIncomes.rendaExtra?.id ?? "new"}`}
            onDelete={() =>
              currentIncomes.rendaExtra
                ? setDeleteTarget({
                    income: currentIncomes.rendaExtra,
                    title: "renda extra",
                  })
                : undefined
            }
            onSave={(amount, updateFuture, repeatFuture) =>
              handleSave(
                "Renda Extra",
                currentIncomes.rendaExtra,
                amount,
                updateFuture,
                repeatFuture,
              )
            }
            showRepeatFutureOption={!currentIncomes.rendaExtra}
            title="Renda Extra"
          />
        </div>
      </section>

      <ConfirmationDialog
        confirmLabel="Excluir"
        description={
          deleteTarget
            ? `Tem certeza que deseja remover o ${deleteTarget.title}?`
            : "Tem certeza que deseja remover esta renda?"
        }
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteFuture(false);
        }}
        onConfirm={handleDelete}
        title="Remover renda?"
        tone="danger"
      >
        {deleteTarget ? (
          <label className="flex items-center gap-3 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-lg dark:border-red-950 dark:bg-slate-950 dark:text-red-300">
            <input
              checked={deleteFuture}
              className="h-4 w-4 accent-red-600"
              onChange={(event) => setDeleteFuture(event.target.checked)}
              type="checkbox"
            />
            Excluir esta e as proximas
          </label>
        ) : null}
      </ConfirmationDialog>
    </>
  );
}

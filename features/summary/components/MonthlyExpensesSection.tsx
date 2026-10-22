"use client";

import {
  CheckCircle2,
  CirclePlus,
  ListFilter,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  CompactExpenseCard,
  getExpensePaymentSources,
  normalizeExpenseText,
} from "@/features/expenses/components/CompactExpenseCard";
import { ExpenseDetailsDialog } from "@/features/expenses/components/ExpenseDetailsDialog";
import type { Category, Expense } from "@/features/expenses/types/expense";

export type MonthlyExpensesData = {
  expenses: Expense[];
  categories: Category[];
};

export function MonthlyExpensesSection({
  data,
  onAdd,
}: {
  data: MonthlyExpensesData;
  onAdd: () => void;
}) {
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Expense | null>(null);
  const categories = new Map(
    data.categories.map((item) => [item.id, item.name]),
  );
  const filtered = data.expenses.filter(
    (expense) =>
      (!category || String(expense.category_id) === category) &&
      (!source ||
        getExpensePaymentSources(expense).some(
          (item) => normalizeExpenseText(item) === normalizeExpenseText(source),
        )) &&
      (!status || expense.is_paid === (status === "paid")),
  );
  const statusLabel =
    status === "paid" ? "Pagas" : status === "pending" ? "Pendentes" : "Todas";
  const sourceLabel = source === "Salario" ? "Salário" : source;
  const activeFilters = [
    ...(source
      ? [{ label: `Origem: ${sourceLabel}`, clear: () => setSource("") }]
      : []),
    ...(category
      ? [
          {
            label: `Categoria: ${categories.get(Number(category)) ?? "Outros"}`,
            clear: () => setCategory(""),
          },
        ]
      : []),
    ...(status
      ? [{ label: `Status: ${statusLabel}`, clear: () => setStatus("") }]
      : []),
  ];

  return (
    <section
      aria-label="Despesas do mês"
      className="mt-1 flex min-w-0 flex-col gap-4"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Despesas</h2>
          <span className="text-xs font-semibold text-[#7A849E]">
            {filtered.length} {filtered.length === 1 ? "despesa" : "despesas"}
          </span>
        </div>
        <div className="flex min-w-0 flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] *:shrink-0 [&::-webkit-scrollbar]:hidden">
          <DropdownSelect
            ariaLabel="Filtrar por origem"
            sheetTitle="Filtrar por Origem"
            presentation="sheet"
            variant="filter"
            triggerLabel="Origem"
            icon={WalletCards}
            onChange={setSource}
            value={source}
            options={[
              { label: "Todas", value: "" },
              { label: "Salário", value: "Salario" },
              { label: "Adiantamento", value: "Adiantamento" },
              { label: "Renda Extra", value: "Renda Extra" },
            ]}
          />
          <DropdownSelect
            ariaLabel="Filtrar por categoria"
            sheetTitle="Filtrar por Categoria"
            presentation="sheet"
            variant="filter"
            triggerLabel="Categoria"
            icon={ListFilter}
            onChange={setCategory}
            value={category}
            options={[
              { label: "Todas", value: "" },
              ...[...data.categories]
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((item) => ({ label: item.name, value: String(item.id) })),
            ]}
          />
          <DropdownSelect
            ariaLabel="Filtrar por status"
            sheetTitle="Filtrar por Status"
            presentation="sheet"
            variant="filter"
            triggerLabel={`Status: ${statusLabel}`}
            icon={CheckCircle2}
            onChange={setStatus}
            value={status}
            options={[
              { label: "Todas", value: "" },
              { label: "Pendentes", value: "pending" },
              { label: "Pagas", value: "paid" },
            ]}
          />
        </div>
        {activeFilters.length ? (
          <div className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeFilters.map((filter) => (
              <Button
                key={filter.label}
                size="sm"
                variant="ghost"
                onClick={filter.clear}
                className="h-7! shrink-0 rounded-[14px] bg-brand/14 px-2.5 text-xs text-brand! dark:text-brand!"
              >
                {filter.label}
                <X aria-hidden="true" size={12} />
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {!filtered.length ? (
        <p className="px-4 py-8 text-center text-sm text-[#7A849E]">
          {activeFilters.length
            ? "Nenhuma despesa encontrada para estes filtros."
            : "Nenhuma despesa neste mês."}
        </p>
      ) : null}
      {filtered.map((expense) => (
        <CompactExpenseCard
          key={expense.id}
          expense={expense}
          categoryName={
            categories.get(expense.category_id ?? 0) ??
            expense.category ??
            "Outros"
          }
          onView={setSelected}
        />
      ))}
      <Button
        variant="secondary"
        className="h-14 w-full rounded-xl border-[#7A849E]/50 bg-transparent! text-base font-normal dark:bg-transparent!"
        onClick={onAdd}
      >
        <CirclePlus aria-hidden="true" size={24} />
        Adicionar Despesa
      </Button>
      <ExpenseDetailsDialog
        expense={selected}
        categoryName={
          categories.get(selected?.category_id ?? 0) ??
          selected?.category ??
          "Outros"
        }
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

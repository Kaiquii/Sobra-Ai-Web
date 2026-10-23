"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { FinancialValue } from "@/components/ui/financial-value";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import type { Category, ExpenseTypeFilter } from "@/features/expenses/types/expense";
import { expenseTotalLabel } from "@/features/expenses/utils/expensePresentation";

type Filters = {
  category: string;
  source: "Adiantamento" | "Renda Extra" | "Salario" | "Todas";
  status: "Pagas" | "Pendentes" | "Todas";
};

const emptyFilters: Filters = { category: "Todas", source: "Todas", status: "Todas" };
const types: ExpenseTypeFilter[] = ["Todas", "Parceladas", "Únicas", "Fixas"];

function ExpenseFiltersSheet({ filters, categories, availableCategoryIds, onClose, onApply }: {
  filters: Filters;
  categories: Category[];
  availableCategoryIds: Set<number>;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}) {
  // Closing discards the draft; clearing only changes this draft until Apply.
  const [draft, setDraft] = useState(filters);
  const availableCategories = categories
    .filter((category) => availableCategoryIds.has(category.id))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const unavailableCategory = draft.category !== "Todas" && !availableCategoryIds.has(Number(draft.category));

  return (
    <SelectionSheet title="Filtrar despesas" onClose={onClose} showCloseButton>
      <p className="text-sm text-slate-500 dark:text-slate-400">Escolha quais despesas você quer visualizar.</p>
      <div className="mt-5 flex flex-col gap-5">
        <div>
          <label className="mb-2 block font-semibold" htmlFor="expense-filter-category">Categoria</label>
          <DropdownSelect id="expense-filter-category" ariaLabel="Categoria" value={draft.category}
            onChange={(category) => setDraft((current) => ({ ...current, category }))}
            options={[
              { label: "Todas", value: "Todas" },
              ...(unavailableCategory ? [{ label: categories.find((category) => String(category.id) === draft.category)?.name ?? "Categoria indisponível", value: draft.category }] : []),
              ...availableCategories.map((category) => ({ label: category.name, value: String(category.id) })),
            ]} />
          {unavailableCategory ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Esta categoria não tem despesas neste mês. Selecione outra ou use Todas.</p> : null}
        </div>
        <div>
          <label className="mb-2 block font-semibold" htmlFor="expense-filter-source">Origem do pagamento</label>
          <DropdownSelect id="expense-filter-source" ariaLabel="Origem do pagamento" value={draft.source}
            onChange={(source) => setDraft((current) => ({ ...current, source }))}
            options={[
              { label: "Todas", value: "Todas" }, { label: "Salário", value: "Salario" },
              { label: "Adiantamento", value: "Adiantamento" }, { label: "Renda extra", value: "Renda Extra" },
            ]} />
        </div>
        <div>
          <label className="mb-2 block font-semibold" htmlFor="expense-filter-status">Status</label>
          <DropdownSelect id="expense-filter-status" ariaLabel="Status" value={draft.status}
            onChange={(status) => setDraft((current) => ({ ...current, status }))}
            options={[{ label: "Todas", value: "Todas" }, { label: "Pagas", value: "Pagas" }, { label: "Pendentes", value: "Pendentes" }]} />
        </div>
      </div>
      <Button className="mt-6 min-h-13 w-full rounded-[14px] bg-brand! text-white! hover:bg-blue-700! dark:bg-brand! dark:text-white! dark:hover:bg-blue-600!" onClick={() => onApply(draft)}>Aplicar filtros</Button>
      <Button className="mt-1 min-h-12 w-full text-slate-500 dark:text-slate-400" variant="ghost" onClick={() => setDraft(emptyFilters)}>Limpar filtros</Button>
    </SelectionSheet>
  );
}

export function ExpenseListControls({ month, year, onMonthChange, total, count, search, onSearchChange,
  type, onTypeChange, filters, categories, availableCategoryIds, onFiltersChange }: {
  month: number;
  year: number;
  onMonthChange: (date: { month: number; year: number }) => void;
  total: number | null;
  count: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  type: ExpenseTypeFilter;
  onTypeChange: (value: ExpenseTypeFilter) => void;
  filters: Filters;
  categories: Category[];
  availableCategoryIds: Set<number>;
  onFiltersChange: (filters: Filters) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const active = filters.category !== "Todas" || filters.source !== "Todas" || filters.status !== "Todas";
  const totalLabel = expenseTotalLabel(type);

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:hidden">
      <MonthSwitcher variant="android" month={month} year={year} onChange={onMonthChange} />
      <div className="flex min-h-17.5 items-center justify-between gap-3 rounded-2xl border border-brand/32 bg-blue-100 p-3 text-slate-950 dark:bg-blue-950 dark:text-slate-50">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-950/75 dark:text-white/75">{totalLabel}</p>
          <strong className="block wrap-anywhere text-2xl font-bold tabular-nums">{total === null ? "—" : <FinancialValue value={total} />}</strong>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-brand/35 bg-brand/10 px-2.5 py-1 text-xs font-medium dark:bg-brand/22">
          {count === null ? "—" : `${count} ${count === 1 ? "lançamento" : "lançamentos"}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input aria-label="Buscar despesa por descrição ou valor" placeholder="Buscar despesa..." type="search" enterKeyHint="search"
            value={search} onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            className="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand dark:bg-slate-900" />
        </div>
        <Button aria-label="Filtrar despesas" aria-haspopup="dialog" aria-expanded={filtersOpen}
          title={active ? "Filtros ativos" : "Sem filtros ativos"} variant="ghost" size="iconLg"
          className={`h-12 w-12 rounded-xl ${active ? "bg-brand/16 text-brand dark:text-brand" : "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400"}`}
          onClick={() => setFiltersOpen(true)}><SlidersHorizontal aria-hidden="true" size={24} /></Button>
      </div>
      <div aria-label="Tipo de despesa" className="scrollbar-none flex min-w-0 gap-2 overflow-x-auto">
        {types.map((item) => <button key={item} type="button" aria-pressed={type === item} onClick={() => onTypeChange(item)}
          className="flex min-h-12 shrink-0 cursor-pointer items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <span className={`rounded-full border px-4 py-1.5 text-sm ${type === item ? "border-transparent bg-brand font-semibold text-white" : "border-slate-950/8 bg-slate-50 text-slate-600 dark:border-white/8 dark:bg-slate-900 dark:text-slate-300"}`}>{item}</span>
        </button>)}
      </div>
      {filtersOpen ? <ExpenseFiltersSheet filters={filters} categories={categories} availableCategoryIds={availableCategoryIds}
        onClose={() => setFiltersOpen(false)} onApply={(next) => { onFiltersChange(next); setFiltersOpen(false); }} /> : null}
    </div>
  );
}

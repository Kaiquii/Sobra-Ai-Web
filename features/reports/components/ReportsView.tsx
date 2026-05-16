"use client";

import { ResponsivePie } from "@nivo/pie";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  PieChart,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  formatShortMonth,
  getCurrentMonthReference,
  MonthSwitcher,
} from "@/components/ui/month-switcher";
import { useReportsStore } from "@/features/reports/store/useReportsStore";
import type {
  ReportCategory,
  ReportChartItem,
  ReportRange,
} from "@/features/reports/types/report";
import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const categoryColors = [
  "#1877F2",
  "#9C27B0",
  "#FF9800",
  "#00BCD4",
  "#4CAF50",
  "#E91E63",
  "#FFC107",
];

const rangeOptions: Array<{ label: string; value: ReportRange }> = [
  { label: "1 mês", value: "ONE_MONTH" },
  { label: "6 meses", value: "SIX_MONTHS" },
  { label: "1 ano", value: "ONE_YEAR" },
];

function formatMoney(value: number | null | undefined) {
  return moneyFormatter.format(value ?? 0);
}

function formatPercentage(value: number | null | undefined) {
  return `${percentageFormatter.format(value ?? 0)}%`;
}

function getCategoryColor(index: number) {
  return categoryColors[index % categoryColors.length];
}

function getVisibleChartData(
  chartData: ReportChartItem[],
  range: ReportRange,
  month: number,
) {
  if (range === "ONE_MONTH") {
    return chartData.filter((item) => item.month === month);
  }

  if (range === "SIX_MONTHS") {
    const startMonth = Math.max(month - 3, 1);
    const endMonth = Math.min(month + 2, 12);

    return chartData.filter(
      (item) => item.month >= startMonth && item.month <= endMonth,
    );
  }

  return chartData;
}

type MetricCardProps = {
  description: string;
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "negative" | "positive";
  value: number;
};

function MetricCard({
  description,
  icon,
  label,
  tone = "default",
  value,
}: MetricCardProps) {
  return (
    <article className="h-full min-h-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <strong
            className={cn(
              "mt-3 block text-2xl font-semibold text-slate-950 dark:text-slate-50",
              tone === "positive" && "text-emerald-600 dark:text-emerald-300",
              tone === "negative" && "text-red-600 dark:text-red-300",
            )}
          >
            {formatMoney(value)}
          </strong>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          {icon}
        </div>
      </div>
    </article>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    </div>
  );
}

type CategoryPieCardProps = {
  categories: ReportCategory[];
  totalExpense: number;
};

function CategoryPieCard({ categories, totalExpense }: CategoryPieCardProps) {
  const sortedCategories = useMemo(
    () => [...categories].sort((first, second) => second.total_amount - first.total_amount),
    [categories],
  );

  const pieData = sortedCategories.map((category, index) => ({
    color: getCategoryColor(index),
    id: category.category_name,
    label: category.category_name,
    value: category.total_amount,
  }));

  return (
    <article className="flex h-full min-h-124 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:h-128">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Gastos por Categoria
          </p>
          <strong className="mt-2 block text-2xl font-semibold text-red-600 dark:text-red-300">
            {formatMoney(totalExpense)}
          </strong>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <PieChart aria-hidden="true" size={23} />
        </div>
      </div>

      {sortedCategories.length ? (
        <div className="mt-6 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(220px,250px)_1fr] xl:items-center">
          <div className="h-60 min-h-60 xl:h-64 xl:min-h-64">
            <ResponsivePie
              activeOuterRadiusOffset={7}
              borderColor={{ from: "color", modifiers: [["darker", 0.35]] }}
              borderWidth={1}
              colors={(datum) => String(datum.data.color)}
              data={pieData}
              enableArcLabels={false}
              enableArcLinkLabels={false}
              innerRadius={0.58}
              margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
              padAngle={1.2}
              tooltip={({ datum }) => (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                  {datum.label}: {formatMoney(Number(datum.value))}
                </div>
              )}
            />
          </div>

          <div className="max-h-72 min-h-0 space-y-3 overflow-y-auto pr-2 xl:max-h-92">
            {sortedCategories.map((category, index) => (
              <div className="space-y-1.5" key={category.category_id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryColor(index) }}
                    />
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {category.category_name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatPercentage(category.percentage)}
                    </span>
                  </div>
                  <strong className="shrink-0 text-slate-950 dark:text-slate-50">
                    {formatMoney(category.total_amount)}
                  </strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: getCategoryColor(index),
                      width: `${Math.min(Math.max(category.percentage, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Nenhum gasto por categoria neste mês.
        </div>
      )}
    </article>
  );
}

type IncomeExpenseChartProps = {
  data: ReportChartItem[];
  month: number;
  range: ReportRange;
  selectedMonth: number | null;
  setRange: (range: ReportRange) => void;
  setSelectedMonth: (month: number | null) => void;
  year: number;
};

function IncomeExpenseChart({
  data,
  month,
  range,
  selectedMonth,
  setRange,
  setSelectedMonth,
  year,
}: IncomeExpenseChartProps) {
  const visibleData = useMemo(
    () => getVisibleChartData(data, range, month),
    [data, month, range],
  );
  const selectedData =
    visibleData.find((item) => item.month === selectedMonth) ??
    visibleData.find((item) => item.month === month) ??
    null;
  const maxValue =
    Math.max(...visibleData.map((item) => Math.max(item.income, item.expense)), 0) ||
    1;

  useEffect(() => {
    if (!visibleData.length) {
      setSelectedMonth(null);
      return;
    }

    const nextSelectedMonth =
      visibleData.find((item) => item.month === month)?.month ?? visibleData[0].month;

    setSelectedMonth(nextSelectedMonth);
  }, [month, range, setSelectedMonth, visibleData]);

  const selectedBalance = selectedData
    ? selectedData.income - selectedData.expense
    : 0;

  return (
    <article className="flex h-full min-h-124 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:h-128">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Renda vs Despesas
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Comparativo mensal de entradas e gastos
          </p>
        </div>

        <DropdownSelect
          ariaLabel="Selecionar período do gráfico"
          className="w-full sm:w-36"
          icon={CalendarDays}
          onChange={setRange}
          options={rangeOptions}
          value={range}
        />
      </div>

      {selectedData ? (
        <div className="mt-5 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {formatShortMonth(selectedData.month, year)}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-emerald-600 dark:text-emerald-300">
                  Renda: <strong>{formatMoney(selectedData.income)}</strong>
                </span>
                <span className="text-red-600 dark:text-red-300">
                  Despesa: <strong>{formatMoney(selectedData.expense)}</strong>
                </span>
                <span
                  className={
                    selectedBalance >= 0
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-red-600 dark:text-red-300"
                  }
                >
                  Saldo: <strong>{formatMoney(selectedBalance)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 min-h-0 flex-1">
        {visibleData.length ? (
          <div className="flex h-full items-end gap-3 overflow-x-auto pb-2">
            {visibleData.map((item) => {
              const incomeHeight = `${Math.max((item.income / maxValue) * 100, 3)}%`;
              const expenseHeight = `${Math.max((item.expense / maxValue) * 100, 3)}%`;
              const isSelected = item.month === selectedData?.month;

              return (
                <button
                  className={cn(
                    "flex h-full min-w-14 flex-col items-center justify-end gap-2 rounded-xl px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-950/60",
                    isSelected && "bg-slate-50 dark:bg-slate-950/70",
                  )}
                  key={item.month}
                  onClick={() => setSelectedMonth(item.month)}
                  type="button"
                >
                  <div className="flex h-44 items-end gap-1.5">
                    <span
                      className="w-4 rounded-t-full bg-blue-500"
                      style={{ height: incomeHeight }}
                    />
                    <span
                      className="w-4 rounded-t-full bg-red-500"
                      style={{ height: expenseHeight }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {formatShortMonth(item.month, year)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Nenhum dado para este período.
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Renda
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          Despesa
        </span>
      </div>
    </article>
  );
}

export function ReportsView() {
  const [{ month, year }, setSelectedDate] = useState(getCurrentMonthReference);
  const [range, setRange] = useState<ReportRange>("SIX_MONTHS");
  const [selectedChartMonth, setSelectedChartMonth] = useState<number | null>(month);
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = useReportsStore((state) => state.categories);
  const chartData = useReportsStore((state) => state.chartData);
  const error = useReportsStore((state) => state.error);
  const isLoading = useReportsStore((state) => state.isLoading);
  const loadReports = useReportsStore((state) => state.loadReports);
  const summary = useReportsStore((state) => state.summary);
  const yearlySummary = useReportsStore((state) => state.yearlySummary);

  useEffect(() => {
    void loadReports(month, year);
  }, [loadReports, month, refreshKey, year]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex justify-center">
        <MonthSwitcher
          className="border-transparent bg-transparent shadow-none dark:border-transparent dark:bg-transparent"
          month={month}
          onChange={setSelectedDate}
          year={year}
        />
      </div>

      {isLoading ? <ReportsSkeleton /> : null}

      {!isLoading && error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Alert variant="error">{error}</Alert>
          <Button
            className="mt-4"
            onClick={() => setRefreshKey((current) => current + 1)}
            type="button"
          >
            <RefreshCcw aria-hidden="true" size={16} />
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {!isLoading && summary ? (
        <>
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <CategoryPieCard
              categories={categories}
              totalExpense={summary.total_expense}
            />
            <IncomeExpenseChart
              data={chartData}
              month={month}
              range={range}
              selectedMonth={selectedChartMonth}
              setRange={setRange}
              setSelectedMonth={setSelectedChartMonth}
              year={year}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Resumo do Ano
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <MetricCard
                description="Acumulado no ano"
                icon={<CircleDollarSign aria-hidden="true" size={24} />}
                label="Economia Total"
                tone={(yearlySummary?.economia_total ?? 0) >= 0 ? "positive" : "negative"}
                value={yearlySummary?.economia_total ?? 0}
              />
              <MetricCard
                description={`Média até ${year}`}
                icon={<BarChart3 aria-hidden="true" size={24} />}
                label="Média Mensal"
                tone={(yearlySummary?.media_mensal ?? 0) >= 0 ? "positive" : "negative"}
                value={yearlySummary?.media_mensal ?? 0}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              description="Entradas registradas no mês"
              icon={<TrendingUp aria-hidden="true" size={24} />}
              label="Total Recebido"
              tone="positive"
              value={summary.total_income}
            />
            <MetricCard
              description="Despesas registradas no mês"
              icon={<TrendingDown aria-hidden="true" size={24} />}
              label="Total Gasto"
              tone="negative"
              value={summary.total_expense}
            />
            <MetricCard
              description="Saldo disponível no mês"
              icon={<Wallet aria-hidden="true" size={24} />}
              tone={summary.total_geral_disponivel >= 0 ? "positive" : "negative"}
              label="Saldo"
              value={summary.total_geral_disponivel}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

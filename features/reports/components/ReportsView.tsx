"use client";

import { ResponsivePie } from "@nivo/pie";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  PieChart,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  formatShortMonth,
  getCurrentMonthReference,
  MonthSwitcher,
  type MonthReference,
} from "@/components/ui/month-switcher";
import { MonthComparisonSection } from "@/features/reports/components/MonthComparisonSection";
import { useMonthComparisonStore } from "@/features/reports/store/useMonthComparisonStore";
import { useReportsStore } from "@/features/reports/store/useReportsStore";
import type {
  ReportCategory,
  ReportChartItem,
  ReportRange,
} from "@/features/reports/types/report";
import { formatMoney, formatPercentage } from "@/lib/formatters";
import { cn } from "@/lib/utils";

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

function getBarHeight(value: number, maxValue: number) {
  return `${Math.max((value / maxValue) * 100, 3)}%`;
}

function addMonthsToReference(date: MonthReference, amount: number) {
  const nextDate = new Date(date.year, date.month - 1 + amount, 1);

  return {
    month: nextDate.getMonth() + 1,
    year: nextDate.getFullYear(),
  };
}

function getPreviousMonthReference(date: MonthReference) {
  return addMonthsToReference(date, -1);
}

function isSameMonthReference(first: MonthReference, second: MonthReference) {
  return first.month === second.month && first.year === second.year;
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
    () =>
      [...categories].sort(
        (first, second) => second.total_amount - first.total_amount,
      ),
    [categories],
  );

  const pieData = sortedCategories.map((category, index) => ({
    color: getCategoryColor(index),
    id: category.category_name,
    label: category.category_name,
    value: category.total_amount,
  }));

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:min-h-128">
      <div className="flex min-w-0 shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Gastos por Categoria
          </p>

          <strong className="mt-2 block text-2xl font-semibold text-red-600 dark:text-red-300">
            {formatMoney(totalExpense)}
          </strong>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <PieChart aria-hidden="true" size={23} />
        </div>
      </div>

      {sortedCategories.length ? (
        <div className="mt-6 flex min-w-0 flex-1 flex-col gap-4 xl:grid xl:grid-cols-[minmax(220px,250px)_1fr] xl:items-center xl:gap-5">
          <div className="h-57.5 w-full min-w-0 shrink-0 sm:h-65 xl:h-64 xl:min-h-64">
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

          <div className="min-w-0 space-y-3 xl:max-h-105 xl:overflow-y-auto xl:pr-2">
            {sortedCategories.map((category, index) => (
              <div className="min-w-0 space-y-1.5" key={category.category_id}>
                <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryColor(index) }}
                    />

                    <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {category.category_name}
                    </span>

                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                      {formatPercentage(category.percentage)}
                    </span>
                  </div>

                  <strong className="ml-2 shrink-0 text-xs text-slate-950 dark:text-slate-50 sm:text-sm">
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
          Nenhuma categoria no momento.
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
    Math.max(
      ...visibleData.map((item) => Math.max(item.income, item.expense)),
      0,
    ) || 1;
  const isFullYearRange = range === "ONE_YEAR";

  useEffect(() => {
    if (!visibleData.length) {
      setSelectedMonth(null);
      return;
    }

    const nextSelectedMonth =
      visibleData.find((item) => item.month === month)?.month ??
      visibleData[0].month;

    setSelectedMonth(nextSelectedMonth);
  }, [month, range, setSelectedMonth, visibleData]);

  const selectedBalance = selectedData
    ? selectedData.income - selectedData.expense
    : 0;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:min-h-128">
      <div className="flex min-w-0 shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Renda vs Despesas
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Comparativo mensal de entradas e gastos.
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
        <div className="mt-5 min-w-0 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {formatShortMonth(selectedData.month, year)}
          </p>

          <div className="mt-2 flex min-w-0 flex-wrap gap-3 text-sm">
            <span className="wrap-break-word text-emerald-600 dark:text-emerald-300">
              Renda: <strong>{formatMoney(selectedData.income)}</strong>
            </span>

            <span className="wrap-break-word text-red-600 dark:text-red-300">
              Despesa: <strong>{formatMoney(selectedData.expense)}</strong>
            </span>

            <span
              className={
                selectedBalance >= 0
                  ? "wrap-break-word text-emerald-600 dark:text-emerald-300"
                  : "wrap-break-word text-red-600 dark:text-red-300"
              }
            >
              Saldo: <strong>{formatMoney(selectedBalance)}</strong>
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-5 min-w-0 flex-1">
        {visibleData.length ? (
          <div className="w-full min-w-0 overflow-x-auto pb-2">
            <div
              className={cn(
                "flex h-64 min-w-max items-end gap-2",
                !isFullYearRange && "lg:min-w-0 lg:justify-center",
              )}
            >
              {visibleData.map((item) => {
                const incomeHeight = getBarHeight(item.income, maxValue);
                const expenseHeight = getBarHeight(item.expense, maxValue);
                const isSelected = item.month === selectedData?.month;

                return (
                  <button
                    className={cn(
                      "flex h-full min-w-12 flex-col items-center justify-end gap-2 rounded-xl px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-950/60 sm:min-w-14",
                      isSelected && "bg-slate-50 dark:bg-slate-950/70",
                    )}
                    key={item.month}
                    onClick={() => setSelectedMonth(item.month)}
                    type="button"
                  >
                    <div className="flex h-44 items-end gap-1.5">
                      <span
                        className="w-3 rounded-t-full bg-blue-500 sm:w-4"
                        style={{ height: incomeHeight }}
                      />

                      <span
                        className="w-3 rounded-t-full bg-red-500 sm:w-4"
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
          </div>
        ) : (
          <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
  const [selectedDate, setSelectedDate] = useState(getCurrentMonthReference);
  const { month, year } = selectedDate;
  const [compareDate, setCompareDate] = useState(() =>
    getPreviousMonthReference(getCurrentMonthReference()),
  );
  const [range, setRange] = useState<ReportRange>("SIX_MONTHS");
  const [selectedChartMonth, setSelectedChartMonth] = useState<number | null>(
    month,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = useReportsStore((state) => state.categories);
  const chartData = useReportsStore((state) => state.chartData);
  const error = useReportsStore((state) => state.error);
  const isLoading = useReportsStore((state) => state.isLoading);
  const loadReports = useReportsStore((state) => state.loadReports);
  const summary = useReportsStore((state) => state.summary);
  const yearlySummary = useReportsStore((state) => state.yearlySummary);

  const comparisonData = useMonthComparisonStore((state) => state.data);
  const comparisonError = useMonthComparisonStore((state) => state.error);
  const isComparisonLoading = useMonthComparisonStore(
    (state) => state.isLoading,
  );
  const loadComparison = useMonthComparisonStore(
    (state) => state.loadComparison,
  );
  const displayedCompareDate = isSameMonthReference(compareDate, selectedDate)
    ? getPreviousMonthReference(selectedDate)
    : compareDate;

  function handleSelectedDateChange(date: MonthReference) {
    setSelectedDate(date);
    setCompareDate(getPreviousMonthReference(date));
  }

  function moveCompareDate(amount: number) {
    setCompareDate((current) => {
      let nextDate = addMonthsToReference(current, amount);

      if (isSameMonthReference(nextDate, selectedDate)) {
        nextDate = addMonthsToReference(nextDate, amount);
      }

      return nextDate;
    });
  }

  useEffect(() => {
    void loadReports(month, year);
  }, [loadReports, month, refreshKey, year]);

  useEffect(() => {
    void loadComparison({
      compareMonth: displayedCompareDate.month,
      compareYear: displayedCompareDate.year,
      month,
      year,
    });
  }, [
    displayedCompareDate.month,
    displayedCompareDate.year,
    loadComparison,
    month,
    refreshKey,
    year,
  ]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <MonthSwitcher
          className="border-transparent bg-transparent shadow-none dark:border-transparent dark:bg-transparent"
          month={month}
          onChange={handleSelectedDateChange}
          year={year}
        />
        <Link
          className={buttonClassName({
            className: "h-9 px-3 text-xs sm:text-sm",
            variant: "secondary",
          })}
          href={`/relatorios/compromissos-parcelados?month=${month}&year=${year}`}
        >
          <CreditCard aria-hidden="true" size={16} />
          Compromissos Parcelados
        </Link>
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

          <MonthComparisonSection
            compareMonth={displayedCompareDate.month}
            compareYear={displayedCompareDate.year}
            currentMonth={month}
            currentYear={year}
            data={comparisonData}
            errorMessage={comparisonError}
            isLoading={isComparisonLoading}
            onNextCompareClick={() => moveCompareDate(1)}
            onPrevCompareClick={() => moveCompareDate(-1)}
          />

          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Resumo do Ano
            </h2>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <MetricCard
                description="Acumulado no ano."
                icon={<CircleDollarSign aria-hidden="true" size={24} />}
                label="Economia Total"
                tone={
                  (yearlySummary?.economia_total ?? 0) >= 0
                    ? "positive"
                    : "negative"
                }
                value={yearlySummary?.economia_total ?? 0}
              />

              <MetricCard
                description={`Média até ${year}.`}
                icon={<BarChart3 aria-hidden="true" size={24} />}
                label="Média Mensal"
                tone={
                  (yearlySummary?.media_mensal ?? 0) >= 0
                    ? "positive"
                    : "negative"
                }
                value={yearlySummary?.media_mensal ?? 0}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              description="Entradas registradas no mês."
              icon={<TrendingUp aria-hidden="true" size={24} />}
              label="Total Recebido"
              tone="positive"
              value={summary.total_income}
            />

            <MetricCard
              description="Despesas registradas no mês."
              icon={<TrendingDown aria-hidden="true" size={24} />}
              label="Total Gasto"
              tone="negative"
              value={summary.total_expense}
            />

            <MetricCard
              description="Saldo disponível no mês."
              icon={<Wallet aria-hidden="true" size={24} />}
              label="Saldo"
              tone={
                summary.total_geral_disponivel >= 0 ? "positive" : "negative"
              }
              value={summary.total_geral_disponivel}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Equal,
  Lightbulb,
  Tags,
  TrendingDown,
  TrendingUp,
  Wallet,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatShortMonth } from "@/components/ui/month-switcher";
import type {
  MonthComparisonCategory,
  MonthComparisonExpenseType,
  MonthComparisonPaymentSource,
  MonthComparisonResponse,
  MonthComparisonStatus,
} from "@/features/reports/types/report";
import { formatMoney, formatPercentage } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type ComparisonTone = "negative" | "neutral" | "positive";
type ComparisonKind = "balance" | "expense" | "income";

type MonthComparisonSectionProps = {
  compareMonth: number;
  compareYear: number;
  currentMonth: number;
  currentYear: number;
  data: MonthComparisonResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  onNextCompareClick: () => void;
  onPrevCompareClick: () => void;
};

type ComparisonMetricProps = {
  compareLabel: string;
  compareValue: number;
  currentLabel: string;
  currentValue: number;
  difference: number;
  icon: ReactNode;
  kind: ComparisonKind;
  label: string;
  percentage: number;
  status: MonthComparisonStatus;
};

type DetailItem = {
  compareValue: number;
  currentValue: number;
  difference: number;
  id: string | number;
  label: string;
  percentage: number;
  status: MonthComparisonStatus;
};

type DetailSectionProps = {
  emptyMessage: string;
  icon: LucideIcon;
  isScrollable?: boolean;
  items: DetailItem[];
  title: string;
};

const textReplacements: Array<[RegExp, string]> = [
  [/\bVoce\b/g, "Você"],
  [/\bvoce\b/g, "você"],
  [/\bRelacao\b/g, "Relação"],
  [/\brelacao\b/g, "relação"],
  [/\bMes\b/g, "Mês"],
  [/\bmes\b/g, "mês"],
  [/\bAlimentacao\b/g, "Alimentação"],
  [/\bSalario\b/g, "Salário"],
  [/\bUnica\b/g, "Única"],
];

function normalizeApiText(value: string) {
  return textReplacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

function formatMonthYear(month: number, year: number) {
  return `${formatShortMonth(month, year)}/${year}`;
}

function formatStatus(status: MonthComparisonStatus) {
  const normalizedStatus = normalizeApiText(String(status).toLowerCase());

  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
}

function getComparisonTone(status: MonthComparisonStatus, kind: ComparisonKind) {
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === "igual") {
    return "neutral";
  }

  if (kind === "income") {
    return normalizedStatus === "subiu" || normalizedStatus === "melhorou"
      ? "positive"
      : "negative";
  }

  if (kind === "balance") {
    return normalizedStatus === "melhorou" || normalizedStatus === "subiu"
      ? "positive"
      : "negative";
  }

  return normalizedStatus === "caiu" || normalizedStatus === "melhorou"
    ? "positive"
    : "negative";
}

function getToneClasses(tone: ComparisonTone) {
  if (tone === "positive") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-300";
  }

  if (tone === "negative") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300";
}

function getToneIcon(tone: ComparisonTone) {
  if (tone === "positive") {
    return <ArrowUpRight aria-hidden="true" size={16} />;
  }

  if (tone === "negative") {
    return <ArrowDownRight aria-hidden="true" size={16} />;
  }

  return <Equal aria-hidden="true" size={16} />;
}

function formatDifference(value: number) {
  if (value === 0) {
    return formatMoney(0);
  }

  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

function ComparisonMetric({
  compareLabel,
  compareValue,
  currentLabel,
  currentValue,
  difference,
  icon,
  kind,
  label,
  percentage,
  status,
}: ComparisonMetricProps) {
  const tone = getComparisonTone(status, kind);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <strong className="mt-2 block text-xl font-semibold text-slate-950 dark:text-slate-50">
            {formatMoney(currentValue)}
          </strong>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
          {icon}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {currentLabel}
          </p>
          <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">
            {formatMoney(currentValue)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {compareLabel}
          </p>
          <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">
            {formatMoney(compareValue)}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
          getToneClasses(tone),
        )}
      >
        {getToneIcon(tone)}
        <span className="truncate">
          {formatStatus(status)} {formatDifference(difference)} (
          {formatPercentage(Math.abs(percentage))})
        </span>
      </div>
    </article>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="h-50 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          key={index}
        />
      ))}
    </div>
  );
}

function DetailSection({
  emptyMessage,
  icon: Icon,
  isScrollable = false,
  items,
  title,
}: DetailSectionProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
          <Icon aria-hidden="true" size={18} />
        </div>
        <h3 className="font-semibold text-slate-950 dark:text-slate-50">
          {title}
        </h3>
      </div>

      {items.length ? (
        <div
          className={cn(
            "mt-4 space-y-3",
            isScrollable && "max-h-80 overflow-y-auto pr-1",
          )}
        >
          {items.map((item) => {
            const tone = getComparisonTone(item.status, "expense");

            return (
              <div
                className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                key={item.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {normalizeApiText(item.label)}
                  </p>

                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold",
                      getToneClasses(tone),
                    )}
                  >
                    {formatStatus(item.status)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                  <span>
                    Atual:{" "}
                    <strong className="text-slate-950 dark:text-slate-50">
                      {formatMoney(item.currentValue)}
                    </strong>
                  </span>
                  <span>
                    Comparado:{" "}
                    <strong className="text-slate-950 dark:text-slate-50">
                      {formatMoney(item.compareValue)}
                    </strong>
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    tone === "positive" && "text-emerald-600 dark:text-emerald-300",
                    tone === "negative" && "text-red-600 dark:text-red-300",
                    tone === "neutral" && "text-slate-500 dark:text-slate-400",
                  )}
                >
                  {formatDifference(item.difference)} (
                  {formatPercentage(Math.abs(item.percentage))})
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {emptyMessage}
        </div>
      )}
    </article>
  );
}

function mapCategories(categories: MonthComparisonCategory[]) {
  return categories.map((category) => ({
    compareValue: category.valor_comparado,
    currentValue: category.valor_atual,
    difference: category.diferenca,
    id: category.categoria_id,
    label: category.categoria_nome,
    percentage: category.percentual,
    status: category.status,
  }));
}

function mapPaymentSources(sources: MonthComparisonPaymentSource[]) {
  return sources.map((source) => ({
    compareValue: source.valor_comparado,
    currentValue: source.valor_atual,
    difference: source.diferenca,
    id: source.fonte_pagamento,
    label: source.fonte_pagamento,
    percentage: source.percentual,
    status: source.status,
  }));
}

function mapExpenseTypes(types: MonthComparisonExpenseType[]) {
  return types.map((type) => ({
    compareValue: type.valor_comparado,
    currentValue: type.valor_atual,
    difference: type.diferenca,
    id: type.tipo,
    label: type.tipo,
    percentage: type.percentual,
    status: type.status,
  }));
}

export function MonthComparisonSection({
  compareMonth,
  compareYear,
  currentMonth,
  currentYear,
  data,
  errorMessage,
  isLoading,
  onNextCompareClick,
  onPrevCompareClick,
}: MonthComparisonSectionProps) {
  const currentLabel = formatMonthYear(currentMonth, currentYear);
  const compareLabel = formatMonthYear(compareMonth, compareYear);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Comparativo Mensal
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">
              {currentLabel} vs {compareLabel}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-120">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Mês principal
              </p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">
                {currentLabel}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Comparar com
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <Button
                  aria-label="Comparar com mês anterior"
                  onClick={onPrevCompareClick}
                  size="iconSm"
                  type="button"
                  variant="ghost"
                >
                  <ChevronLeft aria-hidden="true" size={16} />
                </Button>
                <strong className="text-sm text-slate-950 dark:text-slate-50">
                  {compareLabel}
                </strong>
                <Button
                  aria-label="Comparar com próximo mês"
                  onClick={onNextCompareClick}
                  size="iconSm"
                  type="button"
                  variant="ghost"
                >
                  <ChevronRight aria-hidden="true" size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? <ComparisonSkeleton /> : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Alert variant="error">{errorMessage}</Alert>
        </div>
      ) : null}

      {!isLoading && !errorMessage && data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ComparisonMetric
              compareLabel={compareLabel}
              compareValue={data.resumo.receitas_comparado}
              currentLabel={currentLabel}
              currentValue={data.resumo.receitas_atual}
              difference={data.resumo.diferenca_receitas}
              icon={<TrendingUp aria-hidden="true" size={22} />}
              kind="income"
              label="Receitas"
              percentage={data.resumo.percentual_receitas}
              status={data.resumo.status_receitas}
            />

            <ComparisonMetric
              compareLabel={compareLabel}
              compareValue={data.resumo.despesas_comparado}
              currentLabel={currentLabel}
              currentValue={data.resumo.despesas_atual}
              difference={data.resumo.diferenca_despesas}
              icon={<TrendingDown aria-hidden="true" size={22} />}
              kind="expense"
              label="Despesas"
              percentage={data.resumo.percentual_despesas}
              status={data.resumo.status_despesas}
            />

            <ComparisonMetric
              compareLabel={compareLabel}
              compareValue={data.resumo.saldo_comparado}
              currentLabel={currentLabel}
              currentValue={data.resumo.saldo_atual}
              difference={data.resumo.diferenca_saldo}
              icon={<Wallet aria-hidden="true" size={22} />}
              kind="balance"
              label="Saldo"
              percentage={data.resumo.percentual_saldo}
              status={data.resumo.status_saldo}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailSection
              emptyMessage="Nenhuma categoria para comparar."
              icon={Tags}
              isScrollable
              items={mapCategories(data.categorias)}
              title="Categorias"
            />

            <DetailSection
              emptyMessage="Nenhuma fonte de pagamento para comparar."
              icon={WalletCards}
              items={mapPaymentSources(data.fontes_pagamento)}
              title="Fontes de pagamento"
            />

            <DetailSection
              emptyMessage="Nenhum tipo de despesa para comparar."
              icon={TrendingDown}
              items={mapExpenseTypes(data.tipos_despesa)}
              title="Tipos de despesa"
            />
          </div>

          {data.insights.length ? (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                  <Lightbulb aria-hidden="true" size={18} />
                </div>
                <h3 className="font-semibold text-slate-950 dark:text-slate-50">
                  Observações
                </h3>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {data.insights.map((insight) => (
                  <div
                    className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950/60 dark:text-slate-300"
                    key={insight}
                  >
                    {normalizeApiText(insight)}
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

"use client";

import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  ListChecks,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  WalletCards,
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
import { useInstallmentCommitmentsStore } from "@/features/reports/store/useInstallmentCommitmentsStore";
import type {
  InstallmentParcel,
  InstallmentPurchase,
  InstallmentTimelineMonth,
} from "@/features/reports/types/report";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type InstallmentCommitmentsViewProps = {
  initialMonth?: number;
  initialYear?: number;
};

type Tab = "purchases" | "timeline";
type MonthsOption = "12" | "24" | "36" | "60";

const monthsOptions: Array<{ label: string; value: MonthsOption }> = [
  { label: "12 meses", value: "12" },
  { label: "24 meses", value: "24" },
  { label: "36 meses", value: "36" },
  { label: "60 meses", value: "60" },
];

function getInitialDate(initialMonth?: number, initialYear?: number): MonthReference {
  const current = getCurrentMonthReference();

  if (
    initialMonth &&
    initialYear &&
    initialMonth >= 1 &&
    initialMonth <= 12 &&
    initialYear >= 2000
  ) {
    return { month: initialMonth, year: initialYear };
  }

  return current;
}

function formatMonthYear(month: number, year: number) {
  return `${formatShortMonth(month, year)}/${year}`;
}

function formatPaymentSource(source: string) {
  if (source === "Salario") {
    return "Salário";
  }

  return source;
}

function getParcelValue(parcel: InstallmentParcel | null | undefined, fallback: number) {
  return parcel?.valor ?? fallback;
}

type SummaryCardProps = {
  description: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
};

function SummaryCard({ description, icon, label, value }: SummaryCardProps) {
  return (
    <article className="min-h-30 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <strong className="mt-2 block truncate text-xl font-semibold text-slate-950 dark:text-slate-50">
            {value}
          </strong>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {icon}
        </div>
      </div>
    </article>
  );
}

function InstallmentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-30 animate-pulse rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            key={index}
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
        <WalletCards aria-hidden="true" size={24} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">
        Nenhum compromisso parcelado.
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Quando houver compras parceladas, elas aparecerão aqui com parcelas
        restantes e linha do tempo.
      </p>
    </div>
  );
}

type PurchaseCardProps = {
  purchase: InstallmentPurchase;
};

function PurchaseCard({ purchase }: PurchaseCardProps) {
  const progress =
    purchase.total_parcelas > 0
      ? Math.min((purchase.parcelas_pagas / purchase.total_parcelas) * 100, 100)
      : 0;
  const nextParcel = purchase.proxima_parcela ?? null;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">
            {purchase.descricao}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {purchase.categoria_nome} • {formatPaymentSource(purchase.fonte_pagamento)}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/35">
          <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
            Parcela
          </p>
          <strong className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            {formatMoney(getParcelValue(nextParcel, purchase.valor_parcela))}
          </strong>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Falta pagar</p>
          <strong className="text-slate-950 dark:text-slate-50">
            {formatMoney(purchase.total_restante)}
          </strong>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Pago</p>
          <strong className="text-slate-950 dark:text-slate-50">
            {purchase.parcelas_pagas}/{purchase.total_parcelas}
          </strong>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Período</p>
          <strong className="text-slate-950 dark:text-slate-50">
            {formatMonthYear(purchase.primeiro_mes, purchase.primeiro_ano)} até{" "}
            {formatMonthYear(purchase.ultimo_mes, purchase.ultimo_ano)}
          </strong>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>

      {nextParcel ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
          Próxima parcela:{" "}
          <strong>
            {nextParcel.parcela_atual}/{nextParcel.total_parcelas}
          </strong>{" "}
          em <strong>{formatMonthYear(nextParcel.mes, nextParcel.ano)}</strong> •{" "}
          <strong>{formatMoney(nextParcel.valor)}</strong>
        </div>
      ) : null}
    </article>
  );
}

type TimelineMonthCardProps = {
  maxTotal: number;
  month: InstallmentTimelineMonth;
};

function TimelineMonthCard({ maxTotal, month }: TimelineMonthCardProps) {
  const width = maxTotal > 0 ? Math.max((month.total / maxTotal) * 100, 4) : 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">
            {formatMonthYear(month.mes, month.ano)}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {month.parcelas.length} parcela(s)
          </p>
        </div>
        <strong className="text-lg font-semibold text-slate-950 dark:text-slate-50">
          {formatMoney(month.total)}
        </strong>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${width}%` }} />
      </div>

      <div className="mt-4 space-y-2">
        {month.parcelas.map((parcel) => (
          <div
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950/60"
            key={parcel.id}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                {parcel.descricao}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {parcel.parcela_atual}/{parcel.total_parcelas} •{" "}
                {parcel.categoria_nome} • {formatPaymentSource(parcel.fonte_pagamento)}
              </p>
            </div>
            <strong className="shrink-0 text-slate-950 dark:text-slate-50">
              {formatMoney(parcel.valor)}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}

export function InstallmentCommitmentsView({
  initialMonth,
  initialYear,
}: InstallmentCommitmentsViewProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialDate(initialMonth, initialYear),
  );
  const [months, setMonths] = useState<MonthsOption>("12");
  const [includeCurrentMonthAsPaid, setIncludeCurrentMonthAsPaid] = useState(false);
  const [tab, setTab] = useState<Tab>("purchases");
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useInstallmentCommitmentsStore((state) => state.data);
  const error = useInstallmentCommitmentsStore((state) => state.error);
  const isLoading = useInstallmentCommitmentsStore((state) => state.isLoading);
  const loadCommitments = useInstallmentCommitmentsStore(
    (state) => state.loadCommitments,
  );

  useEffect(() => {
    void loadCommitments({
      includeCurrentMonthAsPaid,
      month: selectedDate.month,
      months: Number(months),
      year: selectedDate.year,
    });
  }, [
    includeCurrentMonthAsPaid,
    loadCommitments,
    months,
    refreshKey,
    selectedDate.month,
    selectedDate.year,
  ]);

  const maxTimelineTotal = useMemo(
    () =>
      Math.max(
        ...(data?.linha_do_tempo.map((timelineMonth) => timelineMonth.total) ?? []),
        0,
      ),
    [data],
  );

  const heavyMonth = data?.resumo.mes_mais_pesado ?? null;
  const hasPurchases = (data?.resumo.total_compras ?? 0) > 0;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              aria-label="Voltar para relatórios"
              className={buttonClassName({
                className: "shrink-0 rounded-full",
                size: "iconSm",
                variant: "secondary",
              })}
              href="/relatorios"
              title="Voltar"
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </Link>
            <h1 className="truncate text-xl font-semibold text-slate-950 dark:text-slate-50 sm:text-2xl">
              Compromissos Parcelados
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:ml-10">
            Compras parceladas agrupadas por compra e por mês.
          </p>
        </div>

        <Button
          aria-label="Atualizar compromissos parcelados"
          className="shrink-0 rounded-full"
          onClick={() => setRefreshKey((current) => current + 1)}
          size="iconSm"
          title="Atualizar"
          type="button"
          variant="secondary"
        >
          <RefreshCcw aria-hidden="true" size={15} />
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <MonthSwitcher
          className="max-w-none shadow-none lg:max-w-sm"
          month={selectedDate.month}
          onChange={setSelectedDate}
          year={selectedDate.year}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {tab === "timeline" ? (
            <DropdownSelect
              ariaLabel="Selecionar quantidade de meses"
              className="w-full sm:w-40"
              icon={CalendarDays}
              onChange={setMonths}
              options={monthsOptions}
              value={months}
            />
          ) : null}

          <label className="flex h-10 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100">
            <span>Mês atual pago</span>
            <input
              checked={includeCurrentMonthAsPaid}
              className="h-4 w-4 accent-blue-600"
              onChange={(event) =>
                setIncludeCurrentMonthAsPaid(event.target.checked)
              }
              type="checkbox"
            />
          </label>
        </div>
      </div>

      {isLoading ? <InstallmentSkeleton /> : null}

      {!isLoading && error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

      {!isLoading && data && !hasPurchases ? <EmptyState /> : null}

      {!isLoading && data && hasPurchases ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              description={`${data.resumo.total_compras} compra(s) agrupada(s).`}
              icon={<CreditCard aria-hidden="true" size={22} />}
              label="Total parcelado"
              value={formatMoney(data.resumo.total_original)}
            />
            <SummaryCard
              description={`${data.resumo.parcelas_pagas} parcela(s) já consideradas.`}
              icon={<ReceiptText aria-hidden="true" size={22} />}
              label="Total pago"
              value={formatMoney(data.resumo.total_pago)}
            />
            <SummaryCard
              description={`${data.resumo.parcelas_restantes} parcela(s) em aberto.`}
              icon={<WalletCards aria-hidden="true" size={22} />}
              label="Falta pagar"
              value={formatMoney(data.resumo.total_restante)}
            />
            <SummaryCard
              description={
                heavyMonth
                  ? `${formatMonthYear(heavyMonth.mes, heavyMonth.ano)} • Base ${formatMonthYear(data.mes_base, data.ano_base)}`
                  : `Base: ${formatMonthYear(data.mes_base, data.ano_base)} • ${data.meses} meses`
              }
              icon={<TrendingUp aria-hidden="true" size={22} />}
              label="Mês mais pesado"
              value={heavyMonth ? formatMoney(heavyMonth.total) : "-"}
            />
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              className={cn(
              "flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold",
                tab === "purchases"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-200"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
              onClick={() => setTab("purchases")}
              type="button"
            >
              <ListChecks aria-hidden="true" size={16} />
              Compras
            </button>
            <button
              className={cn(
              "flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold",
                tab === "timeline"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-200"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
              onClick={() => setTab("timeline")}
              type="button"
            >
              <CalendarDays aria-hidden="true" size={16} />
              Calendário
            </button>
          </div>

          {tab === "purchases" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.compras.map((purchase) => (
                <PurchaseCard key={purchase.serie_id} purchase={purchase} />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.linha_do_tempo.map((timelineMonth) => (
                <TimelineMonthCard
                  key={`${timelineMonth.ano}-${timelineMonth.mes}`}
                  maxTotal={maxTimelineTotal}
                  month={timelineMonth}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

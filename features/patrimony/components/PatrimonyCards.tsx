"use client";

import { ChevronRight, Landmark, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { useFinancialPrivacyStore } from "@/store/useFinancialPrivacyStore";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Cents, Patrimony } from "../types/patrimony";
import { formatCents } from "../utils/patrimonyMoney";

export function PatrimonyValue({ value }: { value: Cents | undefined }) {
  const hidden = useFinancialPrivacyStore((state) => state.valuesHidden);
  return hidden ? (
    <span
      aria-label="Valor oculto"
      style={{
        width: `${value === undefined ? 1 : formatCents(value).length}ch`,
      }}
      className="inline-block h-[0.65em] max-w-full rounded bg-current/15 align-middle"
    />
  ) : (
    <>{value === undefined ? "—" : formatCents(value)}</>
  );
}
export function PatrimonyIcon({
  icon: Icon,
  investment = false,
  large = false,
}: {
  icon: LucideIcon;
  investment?: boolean;
  large?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px]",
        large ? "h-10 w-10" : "h-8 w-8",
        investment
          ? "bg-emerald-600/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-400"
          : "bg-brand/12 text-brand",
      )}
    >
      <Icon aria-hidden="true" size={large ? 24 : 20} />
    </span>
  );
}
export function PatrimonyTotals({ data }: { data: Patrimony | null }) {
  const parts = [
    {
      label: "Patrimônio total",
      value: data?.total_patrimony,
      icon: Wallet,
      description: "FGTS e investimentos informados.",
    },
    {
      label: "FGTS",
      value: data?.total_fgts,
      icon: Landmark,
      description: "Saldo atual informado por você.",
    },
    {
      label: "Investimentos",
      value: data?.total_investments,
      icon: TrendingUp,
      description: "Soma dos seus investimentos.",
    },
  ];
  return (
    <>
      <div aria-label="Resumo do patrimônio" className="hidden gap-3 sm:grid sm:grid-cols-3">
        {parts.map((part) => (
          <Card key={part.label} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {part.label}
                </p>
                <p className="mt-2 wrap-anywhere text-xl font-semibold tabular-nums">
                  <PatrimonyValue value={part.value} />
                </p>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {part.description}
                </p>
              </div>
              <PatrimonyIcon icon={part.icon} investment={part.label === "Investimentos"} large />
            </div>
          </Card>
        ))}
      </div>
      <article
        aria-label="Resumo do patrimônio"
        className="grid gap-3 rounded-[20px] bg-linear-to-br from-blue-100 to-blue-200/80 p-4 dark:from-blue-950 dark:to-blue-900/80 sm:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium">Meu patrimônio</h2>
            <p className="mt-1 wrap-anywhere text-2xl font-bold leading-8 tabular-nums">
              <PatrimonyValue value={data?.total_patrimony} />
            </p>
          </div>
          <PatrimonyIcon icon={Wallet} large />
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-300">FGTS</p>
            <p className="wrap-anywhere text-sm font-semibold tabular-nums">
              <PatrimonyValue value={data?.total_fgts} />
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-300">Investimentos</p>
            <p className="wrap-anywhere text-sm font-semibold tabular-nums">
              <PatrimonyValue value={data?.total_investments} />
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
export function PatrimonyCard({
  title,
  category,
  amount,
  updatedAt,
  investment = false,
  disabled,
  onClick,
}: {
  title: string;
  category?: string;
  amount?: Cents;
  updatedAt?: string;
  investment?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const accent = investment ? "text-emerald-700 dark:text-emerald-400" : "text-brand";
  const updated = updatedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
        .format(new Date(updatedAt))
        .replace(", ", " às ")
    : "";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid w-full cursor-pointer gap-2 rounded-2xl bg-white p-3.5 text-left outline-none enabled:hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-900 dark:enabled:hover:bg-slate-800 sm:rounded-lg sm:border sm:border-slate-200 sm:p-5 sm:shadow-sm dark:sm:border-slate-800"
    >
      <span className="flex items-center gap-2.5">
        <PatrimonyIcon icon={investment ? TrendingUp : Landmark} investment={investment} />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 wrap-anywhere text-sm font-semibold leading-5">
            {title}
          </span>
          <span
            className={cn(
              "block text-slate-500 dark:text-slate-400",
              amount === undefined ? "text-xs" : "truncate text-[11px]",
            )}
          >
            {category ?? (amount === undefined ? "Informe seu saldo atual" : "")}
          </span>
        </span>
        <ChevronRight aria-hidden="true" size={20} className={accent} />
      </span>
      {amount !== undefined ? (
        <>
          <span className="wrap-anywhere text-[22px] font-bold leading-7 tabular-nums">
            <PatrimonyValue value={amount} />
          </span>
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="min-w-0 flex-1 text-[11px] text-slate-500 dark:text-slate-400">
              Atualizado em {updated}
            </span>
            <span className={cn("text-xs font-semibold", accent)}>Atualizar</span>
          </span>
        </>
      ) : (
        <span
          className={cn(
            "pl-10.5 text-sm font-bold sm:mt-2 sm:justify-self-start sm:rounded-md sm:border sm:border-slate-300 sm:bg-slate-50 sm:px-3 sm:py-2 dark:sm:border-slate-700 dark:sm:bg-slate-800",
            accent,
          )}
        >
          {investment ? "Adicionar" : "Informar"}
        </span>
      )}
    </button>
  );
}

"use client";

import { formatMoney } from "@/lib/formatters";
import { useFinancialPrivacyStore } from "@/store/useFinancialPrivacyStore";

export function FinancialValue({
  value,
  prefix = "",
}: {
  value: number;
  prefix?: string;
}) {
  const hidden = useFinancialPrivacyStore((state) => state.valuesHidden);

  return hidden ? (
    <span
      aria-label="Valor oculto"
      className="inline-block h-[0.65em] w-[6ch] rounded bg-current/15 align-middle"
    />
  ) : (
    <>
      {prefix}
      {formatMoney(value)}
    </>
  );
}

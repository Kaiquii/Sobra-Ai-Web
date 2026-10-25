import type { CreateIncomeRequest, Income, IncomeSource } from "@/features/incomes/types/income";
import { canonicalPaymentSource } from "@/lib/payment-sources";

export function buildIncomeCreateRequest(source: IncomeSource, amount: number, month: number, year: number, repeatFuture = true): CreateIncomeRequest {
  return { source, amount, month, year,
    type: source === "Renda Extra" || repeatFuture ? "Fixa" : "Única",
    ...(source === "Renda Extra" ? { repeat_future: repeatFuture } : {}),
  };
}


export function findIncomeByReference(
  incomes: Income[],
  source: IncomeSource,
  month: number,
  year: number,
) {
  return incomes.find(
    (income) =>
      canonicalPaymentSource(income.source) === source &&
      income.month === month &&
      income.year === year,
  );
}

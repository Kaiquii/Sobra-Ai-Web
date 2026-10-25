import type { CanonicalPaymentSource } from "@/lib/payment-sources";

export type IncomeSource = CanonicalPaymentSource;

type IncomeType = "Fixa" | "\u00danica";

export type Income = {
  amount: number;
  id: number;
  month: number;
  source: string;
  user_id: number;
  year: number;
};

export type CreateIncomeRequest = {
  amount: number;
  month: number;
  repeat_future?: boolean | null;
  source: IncomeSource;
  type: IncomeType;
  year: number;
};

export type UpdateIncomeRequest = {
  amount?: number;
  source?: IncomeSource;
  update_future?: boolean;
};

export type IncomeMutationResponse = {
  data?: Income;
  message: string;
};

export type IncomeListResponse = {
  incomes: Income[];
  total: number;
};

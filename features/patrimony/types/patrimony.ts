export type Cents = string;
export type FgtsBalance = { amount: Cents; updated_at: string };
export type Investment = FgtsBalance & {
  id: number;
  name: string;
  category: string;
  category_id: number | null;
  created_at: string;
};
export type Patrimony = {
  fgts: FgtsBalance | null;
  investments: Investment[];
  total_fgts: Cents;
  total_investments: Cents;
  total_patrimony: Cents;
};
export type InvestmentCategory = { id: number; name: string; is_default: boolean };
export type InvestmentDraft = {
  name: string;
  amount: string;
  categoryId?: number;
  category?: string;
};
export type PatrimonyAction =
  | { kind: "fgts"; amount: string }
  | { kind: "investment"; id?: number; draft: InvestmentDraft }
  | { kind: "deleteFgts" }
  | { kind: "deleteInvestment"; id: number }
  | { kind: "category"; name: string; id?: number }
  | { kind: "deleteCategory"; id: number };

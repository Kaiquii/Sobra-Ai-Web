export type ReportRange = "ONE_MONTH" | "SIX_MONTHS" | "ONE_YEAR";

export type ReportSummary = {
  adiantamento: number;
  month: number;
  renda_extra_amt: number;
  restante_adiantamento: number;
  restante_renda_extra: number;
  restante_salario: number;
  salario: number;
  total_expense: number;
  total_gasto_adiantamento: number;
  total_gasto_renda_extra: number;
  total_gasto_salario: number;
  total_geral_disponivel: number;
  total_income: number;
  year: number;
};

export type ReportCategory = {
  category_id: number;
  category_name: string;
  percentage: number;
  total_amount: number;
};

export type ReportChartItem = {
  expense: number;
  income: number;
  month: number;
};

export type YearlySummary = {
  economia_total: number;
  media_mensal: number;
  year: number;
};

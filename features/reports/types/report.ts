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

export type MonthComparisonParams = {
  compareMonth: number;
  compareYear: number;
  month: number;
  year: number;
};

export type MonthComparisonStatus =
  | "caiu"
  | "igual"
  | "melhorou"
  | "piorou"
  | "subiu"
  | string;

export type MonthComparisonSummary = {
  despesas_atual: number;
  despesas_comparado: number;
  diferenca_despesas: number;
  diferenca_receitas: number;
  diferenca_saldo: number;
  percentual_despesas: number;
  percentual_receitas: number;
  percentual_saldo: number;
  receitas_atual: number;
  receitas_comparado: number;
  saldo_atual: number;
  saldo_comparado: number;
  status_despesas: MonthComparisonStatus;
  status_receitas: MonthComparisonStatus;
  status_saldo: MonthComparisonStatus;
};

export type MonthComparisonCategory = {
  categoria_id: number;
  categoria_nome: string;
  diferenca: number;
  percentual: number;
  status: MonthComparisonStatus;
  valor_atual: number;
  valor_comparado: number;
};

export type MonthComparisonPaymentSource = {
  diferenca: number;
  fonte_pagamento: string;
  percentual: number;
  status: MonthComparisonStatus;
  valor_atual: number;
  valor_comparado: number;
};

export type MonthComparisonExpenseType = {
  diferenca: number;
  percentual: number;
  status: MonthComparisonStatus;
  tipo: string;
  valor_atual: number;
  valor_comparado: number;
};

export type MonthComparisonResponse = {
  ano_atual: number;
  ano_comparado: number;
  categorias: MonthComparisonCategory[];
  fontes_pagamento: MonthComparisonPaymentSource[];
  insights: string[];
  mes_atual: number;
  mes_comparado: number;
  resumo: MonthComparisonSummary;
  tipos_despesa: MonthComparisonExpenseType[];
};

export type InstallmentCommitmentsParams = {
  includeCurrentMonthAsPaid?: boolean;
  month: number;
  months: number;
  year: number;
};

export type InstallmentHeavyMonth = {
  ano: number;
  mes: number;
  total: number;
};

export type InstallmentParcel = {
  ano: number;
  categoria_id: number;
  categoria_nome: string;
  descricao: string;
  fonte_pagamento: string;
  id: number;
  mes: number;
  parcela_atual: number;
  serie_id: string;
  total_parcelas: number;
  valor: number;
};

export type InstallmentPurchase = {
  categoria_id: number;
  categoria_nome: string;
  descricao: string;
  fonte_pagamento: string;
  primeiro_ano: number;
  primeiro_mes: number;
  proxima_parcela?: InstallmentParcel | null;
  parcelas_pagas: number;
  parcelas_restantes: number;
  serie_id: string;
  total_original: number;
  total_pago: number;
  total_parcelas: number;
  total_restante: number;
  ultimo_ano: number;
  ultimo_mes: number;
  valor_parcela: number;
};

export type InstallmentTimelineMonth = {
  ano: number;
  mes: number;
  parcelas: InstallmentParcel[];
  total: number;
};

export type InstallmentCommitmentsSummary = {
  mes_mais_pesado?: InstallmentHeavyMonth | null;
  parcelas_pagas: number;
  parcelas_restantes: number;
  total_compras: number;
  total_original: number;
  total_pago: number;
  total_restante: number;
};

export type InstallmentCommitmentsResponse = {
  ano_base: number;
  compras: InstallmentPurchase[];
  linha_do_tempo: InstallmentTimelineMonth[];
  mes_base: number;
  meses: number;
  resumo: InstallmentCommitmentsSummary;
};

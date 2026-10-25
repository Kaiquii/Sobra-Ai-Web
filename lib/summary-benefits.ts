const benefitFields = ["va", "vr", "total_gasto_va", "total_gasto_vr", "restante_va", "restante_vr"] as const;

export function withSummaryBenefits<T extends { total_income: number; total_expense: number; total_geral_disponivel: number; month: number; year: number }>(summary: T, month: number, year: number): T & Record<(typeof benefitFields)[number], number> {
  if (!summary || typeof summary !== "object" || summary.month !== month || summary.year !== year ||
      ![summary.total_income, summary.total_expense, summary.total_geral_disponivel].every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Resumo financeiro inválido para o período selecionado.");
  }
  const result = { ...summary } as T & Record<(typeof benefitFields)[number], number>;
  for (const field of benefitFields) {
    const value = (summary as Record<string, unknown>)[field];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) throw new Error("Valor de benefício inválido no resumo.");
    result[field] = value === undefined ? 0 : value as number;
  }
  return result;
}

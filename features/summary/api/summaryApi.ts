import type { MonthlySummary } from "@/features/summary/types/summary";
import { apiClient } from "@/lib/api";
import { withSummaryBenefits } from "@/lib/summary-benefits";

export const summaryApi = {
  async getMonthlySummary(month: number, year: number) {
    const response = await apiClient.get<MonthlySummary>("/api/reports/summary", {
      params: { month, year },
    });

    return withSummaryBenefits(response.data, month, year);
  },
};

import type {
  ReportCategory,
  ReportChartItem,
  ReportSummary,
  YearlySummary,
} from "@/features/reports/types/report";
import { apiClient } from "@/lib/api";

function normalizeArrayResponse<T>(data: T[] | null) {
  return Array.isArray(data) ? data : [];
}

export const reportsApi = {
  async getCategories(month: number, year: number) {
    const response = await apiClient.get<ReportCategory[] | null>(
      "/api/reports/categories",
      {
        params: { month, year },
      },
    );

    return normalizeArrayResponse(response.data);
  },

  async getChart(year: number) {
    const response = await apiClient.get<ReportChartItem[] | null>(
      "/api/reports/chart",
      {
        params: { year },
      },
    );

    return normalizeArrayResponse(response.data);
  },

  async getSummary(month: number, year: number) {
    const response = await apiClient.get<ReportSummary>("/api/reports/summary", {
      params: { month, year },
    });

    return response.data;
  },

  async getYearlySummary(year: number) {
    const response = await apiClient.get<YearlySummary>(
      "/api/reports/yearly-summary",
      {
        params: { year },
      },
    );

    return response.data;
  },
};

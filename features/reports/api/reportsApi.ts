import type {
  ReportCategory,
  ReportChartItem,
  ReportSummary,
  YearlySummary,
} from "@/features/reports/types/report";
import { apiClient } from "@/lib/api";

export const reportsApi = {
  async getCategories(month: number, year: number) {
    const response = await apiClient.get<ReportCategory[]>("/api/reports/categories", {
      params: { month, year },
    });

    return response.data;
  },

  async getChart(year: number) {
    const response = await apiClient.get<ReportChartItem[]>("/api/reports/chart", {
      params: { year },
    });

    return response.data;
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

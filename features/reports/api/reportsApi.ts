import type {
  InstallmentCommitmentsParams,
  InstallmentCommitmentsResponse,
  MonthComparisonParams,
  MonthComparisonResponse,
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
  async getMonthComparison({
    compareMonth,
    compareYear,
    month,
    year,
  }: MonthComparisonParams) {
    const response = await apiClient.get<MonthComparisonResponse>(
      "/api/reports/month-comparison",
      {
        params: {
          compare_month: compareMonth,
          compare_year: compareYear,
          month,
          year,
        },
      },
    );

    return {
      ...response.data,
      categorias: normalizeArrayResponse(response.data.categorias),
      fontes_pagamento: normalizeArrayResponse(response.data.fontes_pagamento),
      insights: normalizeArrayResponse(response.data.insights),
      tipos_despesa: normalizeArrayResponse(response.data.tipos_despesa),
    };
  },

  async getInstallmentCommitments({
    includeCurrentMonthAsPaid = false,
    month,
    months,
    year,
  }: InstallmentCommitmentsParams) {
    const response = await apiClient.get<InstallmentCommitmentsResponse>(
      "/api/reports/installment-commitments",
      {
        params: {
          include_current_month_as_paid: includeCurrentMonthAsPaid,
          month,
          months,
          year,
        },
      },
    );

    return {
      ...response.data,
      compras: Array.isArray(response.data.compras) ? response.data.compras : [],
      linha_do_tempo: Array.isArray(response.data.linha_do_tempo)
        ? response.data.linha_do_tempo
        : [],
    };
  },

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

"use client";

import { create } from "zustand";

import { reportsApi } from "@/features/reports/api/reportsApi";
import type {
  ReportCategory,
  ReportChartItem,
  ReportSummary,
  YearlySummary,
} from "@/features/reports/types/report";
import { getApiErrorMessage } from "@/lib/api-errors";

type ReportsState = {
  categories: ReportCategory[];
  chartData: ReportChartItem[];
  error: string | null;
  isLoading: boolean;
  summary: ReportSummary | null;
  yearlySummary: YearlySummary | null;
  loadReports: (month: number, year: number) => Promise<void>;
};

let latestReportRequest = 0;

export const useReportsStore = create<ReportsState>((set) => ({
  categories: [],
  chartData: [],
  error: null,
  isLoading: false,
  summary: null,
  yearlySummary: null,

  loadReports: async (month, year) => {
    const requestId = ++latestReportRequest;
    set({ error: null, isLoading: true });

    try {
      const [summary, categories, chartData, yearlySummary] = await Promise.all([
        reportsApi.getSummary(month, year),
        reportsApi.getCategories(month, year),
        reportsApi.getChart(year),
        reportsApi.getYearlySummary(year),
      ]);

      if (requestId !== latestReportRequest) return;
      set({
        categories,
        chartData,
        error: null,
        isLoading: false,
        summary,
        yearlySummary,
      });
    } catch (error) {
      if (requestId !== latestReportRequest) return;
      set({
        categories: [],
        chartData: [],
        error: getApiErrorMessage(error, "Não foi possível carregar os relatórios."),
        isLoading: false,
        summary: null,
        yearlySummary: null,
      });
    }
  },
}));

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
import { getBrowserAuthSessionEpoch, getBrowserAuthToken } from "@/lib/auth-cookie";

type ReportsState = {
  categories: ReportCategory[];
  chartData: ReportChartItem[];
  error: string | null;
  isLoading: boolean;
  summary: ReportSummary | null;
  yearlySummary: YearlySummary | null;
  sessionEpoch: number | null;
  loadReports: (month: number, year: number) => Promise<void>;
};

let latestReportRequest = 0;

export const useReportsStore = create<ReportsState>((set, get) => ({
  categories: [],
  chartData: [],
  error: null,
  isLoading: false,
  summary: null,
  yearlySummary: null,
  sessionEpoch: null,

  loadReports: async (month, year) => {
    const requestId = ++latestReportRequest;
    const sessionEpoch = getBrowserAuthSessionEpoch();
    const sessionToken = getBrowserAuthToken();
    const previousSummary = get().summary;
    const sameSnapshot =
      get().sessionEpoch === sessionEpoch &&
      previousSummary?.month === month &&
      previousSummary.year === year;
    set({
      error: null,
      isLoading: true,
      ...(!sameSnapshot
        ? {
            categories: [],
            chartData: [],
            summary: null,
            yearlySummary: null,
            sessionEpoch: null,
          }
        : {}),
    });

    try {
      const [summary, categories, chartData, yearlySummary] = await Promise.all([
        reportsApi.getSummary(month, year),
        reportsApi.getCategories(month, year),
        reportsApi.getChart(year),
        reportsApi.getYearlySummary(year),
      ]);

      if (
        requestId !== latestReportRequest ||
        sessionEpoch !== getBrowserAuthSessionEpoch() ||
        sessionToken !== getBrowserAuthToken()
      )
        return;
      set({
        categories,
        chartData,
        error: null,
        isLoading: false,
        summary,
        yearlySummary,
        sessionEpoch,
      });
    } catch (error) {
      if (
        requestId !== latestReportRequest ||
        sessionEpoch !== getBrowserAuthSessionEpoch() ||
        sessionToken !== getBrowserAuthToken()
      )
        return;
      set({
        error: getApiErrorMessage(error, "Não foi possível carregar os relatórios."),
        isLoading: false,
        ...(!sameSnapshot
          ? { categories: [], chartData: [], summary: null, yearlySummary: null }
          : {}),
      });
    }
  },
}));

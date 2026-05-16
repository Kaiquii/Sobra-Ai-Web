"use client";

import axios from "axios";
import { create } from "zustand";

import { reportsApi } from "@/features/reports/api/reportsApi";
import type {
  ReportCategory,
  ReportChartItem,
  ReportSummary,
  YearlySummary,
} from "@/features/reports/types/report";

type ReportsState = {
  categories: ReportCategory[];
  chartData: ReportChartItem[];
  error: string | null;
  isLoading: boolean;
  summary: ReportSummary | null;
  yearlySummary: YearlySummary | null;
  loadReports: (month: number, year: number) => Promise<void>;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }

      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }
    }
  }

  return "Não foi possível carregar os relatórios.";
}

export const useReportsStore = create<ReportsState>((set) => ({
  categories: [],
  chartData: [],
  error: null,
  isLoading: false,
  summary: null,
  yearlySummary: null,

  loadReports: async (month, year) => {
    set({ error: null, isLoading: true });

    try {
      const [summary, categories, chartData, yearlySummary] = await Promise.all([
        reportsApi.getSummary(month, year),
        reportsApi.getCategories(month, year),
        reportsApi.getChart(year),
        reportsApi.getYearlySummary(year),
      ]);

      set({
        categories,
        chartData,
        error: null,
        isLoading: false,
        summary,
        yearlySummary,
      });
    } catch (error) {
      set({
        categories: [],
        chartData: [],
        error: getErrorMessage(error),
        isLoading: false,
        summary: null,
        yearlySummary: null,
      });
    }
  },
}));

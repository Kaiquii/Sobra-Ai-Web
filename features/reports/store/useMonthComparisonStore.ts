"use client";

import { create } from "zustand";

import { reportsApi } from "@/features/reports/api/reportsApi";
import type {
  MonthComparisonParams,
  MonthComparisonResponse,
} from "@/features/reports/types/report";
import { getApiErrorMessage } from "@/lib/api-errors";

type MonthComparisonState = {
  data: MonthComparisonResponse | null;
  error: string | null;
  isLoading: boolean;
  loadComparison: (params: MonthComparisonParams) => Promise<void>;
};

let latestRequestId = 0;

export const useMonthComparisonStore = create<MonthComparisonState>((set) => ({
  data: null,
  error: null,
  isLoading: false,

  loadComparison: async (params) => {
    const requestId = latestRequestId + 1;
    latestRequestId = requestId;

    set({ error: null, isLoading: true });

    try {
      const data = await reportsApi.getMonthComparison(params);

      if (requestId !== latestRequestId) {
        return;
      }

      set({
        data,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      set({
        data: null,
        error: getApiErrorMessage(
          error,
          "Não foi possível carregar o comparativo mensal.",
        ),
        isLoading: false,
      });
    }
  },
}));

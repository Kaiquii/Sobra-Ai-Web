"use client";

import { create } from "zustand";
import { incomesApi } from "@/features/incomes/api/incomesApi";
import type { CreateIncomeRequest, Income, UpdateIncomeRequest } from "@/features/incomes/types/income";
import { getApiErrorMessage } from "@/lib/api-errors";

type IncomeState = {
  error: string | null;
  incomes: Income[];
  isLoading: boolean;
  isSubmitting: boolean;
  message: string | null;
  total: number;
  reference: { month: number; year: number } | null;
  revision: number;
  clearFeedback: () => void;
  createIncome: (data: CreateIncomeRequest) => Promise<void>;
  deleteIncome: (id: number, deleteFuture: boolean) => Promise<void>;
  loadIncomes: (month: number, year: number) => Promise<void>;
  updateIncome: (id: number, data: UpdateIncomeRequest) => Promise<void>;
};

let loadId = 0;

export const useIncomeStore = create<IncomeState>((set, get) => {
  async function mutate(operation: () => Promise<{ message: string }>) {
    if (get().isSubmitting) throw new Error("Aguarde a operação em andamento.");
    set({ error: null, isSubmitting: true, message: null });
    try {
      const response = await operation();
      set((state) => ({ revision: state.revision + 1, message: response.message }));
      const reference = get().reference;
      if (reference) await get().loadIncomes(reference.month, reference.year);
    } catch (error) {
      set({ error: getApiErrorMessage(error), message: null });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  }

  return {
    error: null, incomes: [], isLoading: false, isSubmitting: false,
    message: null, total: 0, reference: null, revision: 0,
    clearFeedback: () => set({ error: null, message: null }),
    createIncome: (data) => mutate(() => incomesApi.createIncome(data)),
    deleteIncome: (id, future) => mutate(() => incomesApi.deleteIncome(id, future)),
    updateIncome: (id, data) => mutate(() => incomesApi.updateIncome(id, data)),
    loadIncomes: async (month, year) => {
      const requestId = ++loadId;
      const samePeriod = get().reference?.month === month && get().reference?.year === year;
      set({ error: null, isLoading: true, reference: { month, year }, ...(samePeriod ? {} : { incomes: [], total: 0, message: null }) });
      try {
        const response = await incomesApi.getIncomes(month, year);
        if (requestId !== loadId) return;
        set({ incomes: response.incomes.filter((income) => income.month === month && income.year === year), total: response.total, isLoading: false });
      } catch (error) {
        if (requestId === loadId) set({ error: getApiErrorMessage(error), isLoading: false });
      }
    },
  };
});

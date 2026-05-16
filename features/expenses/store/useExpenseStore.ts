"use client";

import axios from "axios";
import { create } from "zustand";

import { expensesApi } from "@/features/expenses/api/expensesApi";
import type {
  Category,
  CreateCategoryRequest,
  CreateExpenseRequest,
  Expense,
  UpdateCategoryRequest,
  UpdateExpenseRequest,
} from "@/features/expenses/types/expense";

type ExpenseState = {
  categories: Category[];
  error: string | null;
  expenses: Expense[];
  isLoading: boolean;
  isSubmitting: boolean;
  message: string | null;
  selectedExpense: Expense | null;
  total: number;
  clearFeedback: () => void;
  createCategory: (data: CreateCategoryRequest) => Promise<Category | null>;
  createExpense: (data: CreateExpenseRequest) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  deleteExpense: (id: number, deleteFuture: boolean) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadExpense: (id: number) => Promise<Expense | null>;
  loadExpenses: (month: number, year: number) => Promise<void>;
  loadInitialData: (month: number, year: number) => Promise<void>;
  updateCategory: (id: number, data: UpdateCategoryRequest) => Promise<void>;
  updateExpense: (id: number, data: UpdateExpenseRequest) => Promise<void>;
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

  return "Nao foi possivel concluir a acao. Tente novamente.";
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  categories: [],
  error: null,
  expenses: [],
  isLoading: false,
  isSubmitting: false,
  message: null,
  selectedExpense: null,
  total: 0,

  clearFeedback: () => set({ error: null, message: null }),

  createCategory: async (data) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.createCategory(data);
      const category = response.data ?? response.category ?? null;

      set((state) => ({
        categories: category ? [...state.categories, category] : state.categories,
        isSubmitting: false,
        message: response.message,
      }));

      return category;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  createExpense: async (data) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.createExpense(data);
      set({ isSubmitting: false, message: response.message });
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        isSubmitting: false,
        message: response.message,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  deleteExpense: async (id, deleteFuture) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.deleteExpense(id, deleteFuture);
      set({ isSubmitting: false, message: response.message });
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  loadCategories: async () => {
    set({ error: null, isLoading: true });

    try {
      const response = await expensesApi.getCategories();
      set({ categories: response.categories, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadExpense: async (id) => {
    set({ error: null, isSubmitting: true, selectedExpense: null });

    try {
      const expense = await expensesApi.getExpense(id);
      set({ isSubmitting: false, selectedExpense: expense });

      return expense;
    } catch (error) {
      set({
        error: getErrorMessage(error),
        isSubmitting: false,
        selectedExpense: null,
      });

      return null;
    }
  },

  loadExpenses: async (month, year) => {
    set({ error: null, isLoading: true });

    try {
      const response = await expensesApi.getExpenses(month, year);
      set({
        expenses: response.expenses,
        isLoading: false,
        total: response.total,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadInitialData: async (month, year) => {
    set({ error: null, isLoading: true });

    try {
      const [categoriesResponse, expensesResponse] = await Promise.all([
        expensesApi.getCategories(),
        expensesApi.getExpenses(month, year),
      ]);

      set({
        categories: categoriesResponse.categories,
        expenses: expensesResponse.expenses,
        isLoading: false,
        total: expensesResponse.total,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  updateCategory: async (id, data) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.updateCategory(id, data);
      const updatedCategory = response.data ?? response.category ?? null;

      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id
            ? { ...category, name: updatedCategory?.name ?? data.name }
            : category,
        ),
        isSubmitting: false,
        message: response.message,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  updateExpense: async (id, data) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.updateExpense(id, data);
      set({ isSubmitting: false, message: response.message });
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },
}));

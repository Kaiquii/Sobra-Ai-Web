"use client";

import { create } from "zustand";

import { expensesApi } from "@/features/expenses/api/expensesApi";
import type {
  Category,
  CreateCategoryRequest,
  CreateExpenseRequest,
  Expense,
  ExpensePaymentStatus,
  ExpensePeriodMode,
  UpdateCategoryRequest,
  UpdateExpenseRequest,
} from "@/features/expenses/types/expense";
import { getApiErrorMessage } from "@/lib/api-errors";

function isDateInMonth(date: string | null | undefined, month: number, year: number) {
  const dateValue = date?.split("T")[0];
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;

  return dateValue?.startsWith(monthPrefix) ?? false;
}

type ExpenseState = {
  advancedExpenses: Expense[];
  categories: Category[];
  effectiveExpenses: Expense[];
  error: string | null;
  expenses: Expense[];
  isLoading: boolean;
  isSubmitting: boolean;
  advanceStatusUpdatingId: number | null;
  paymentStatusUpdatingId: number | null;
  message: string | null;
  selectedExpense: Expense | null;
  total: number;
  clearFeedback: () => void;
  createCategory: (data: CreateCategoryRequest) => Promise<Category | null>;
  createExpense: (data: CreateExpenseRequest) => Promise<void>;
  updateAdvanceStatus: (
    id: number,
    isAdvanced: boolean,
    advancedAt?: string,
  ) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  deleteExpense: (id: number, deleteFuture: boolean) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadExpense: (id: number) => Promise<Expense | null>;
  loadExpenses: (
    month: number,
    year: number,
    paymentStatus?: ExpensePaymentStatus,
    periodMode?: ExpensePeriodMode,
  ) => Promise<void>;
  loadInitialData: (
    month: number,
    year: number,
    paymentStatus?: ExpensePaymentStatus,
    periodMode?: ExpensePeriodMode,
  ) => Promise<void>;
  updatePaymentStatus: (id: number, isPaid: boolean) => Promise<void>;
  updateCategory: (id: number, data: UpdateCategoryRequest) => Promise<void>;
  updateExpense: (id: number, data: UpdateExpenseRequest) => Promise<void>;
};

export const useExpenseStore = create<ExpenseState>((set) => ({
  advancedExpenses: [],
  categories: [],
  effectiveExpenses: [],
  error: null,
  expenses: [],
  isLoading: false,
  isSubmitting: false,
  advanceStatusUpdatingId: null,
  paymentStatusUpdatingId: null,
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
      set({ error: getApiErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  createExpense: async (data) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.createExpense(data);
      set({ isSubmitting: false, message: response.message });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSubmitting: false, message: null });
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
      set({ error: getApiErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  deleteExpense: async (id, deleteFuture) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.deleteExpense(id, deleteFuture);
      set({ isSubmitting: false, message: response.message });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  loadCategories: async () => {
    set({ error: null, isLoading: true });

    try {
      const response = await expensesApi.getCategories();
      set({ categories: response.categories, isLoading: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoading: false });
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
        error: getApiErrorMessage(error),
        isSubmitting: false,
        selectedExpense: null,
      });

      return null;
    }
  },

  loadExpenses: async (month, year, paymentStatus, periodMode) => {
    set({ error: null, isLoading: true });

    try {
      const response = await expensesApi.getExpenses(month, year, paymentStatus, periodMode);
      set({
        expenses: response.expenses,
        isLoading: false,
        total: response.total,
      });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoading: false });
    }
  },

  loadInitialData: async (month, year, paymentStatus, periodMode) => {
    set({ error: null, isLoading: true });

    try {
      const [categoriesResponse, expensesResponse, effectiveExpensesResponse] = await Promise.all([
        expensesApi.getCategories(),
        expensesApi.getExpenses(month, year, paymentStatus, periodMode),
        expensesApi.getExpenses(month, year, paymentStatus, "effective"),
      ]);

      set({
        advancedExpenses: effectiveExpensesResponse.expenses.filter(
          (expense) =>
            expense.is_advanced &&
            isDateInMonth(expense.advanced_at, month, year),
        ),
        categories: categoriesResponse.categories,
        effectiveExpenses: effectiveExpensesResponse.expenses,
        expenses: expensesResponse.expenses,
        isLoading: false,
        total: expensesResponse.total,
      });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoading: false });
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
      set({ error: getApiErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  updateExpense: async (id, data) => {
    set({ error: null, isSubmitting: true, message: null });

    try {
      const response = await expensesApi.updateExpense(id, data);
      set({ isSubmitting: false, message: response.message });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSubmitting: false, message: null });
      throw error;
    }
  },

  updateAdvanceStatus: async (id, isAdvanced, advancedAt) => {
    set({ advanceStatusUpdatingId: id, error: null, message: null });

    try {
      const response = await expensesApi.updateAdvanceStatus(id, isAdvanced, advancedAt);

      set((state) => ({
        advanceStatusUpdatingId: null,
        expenses: state.expenses.map((expense) =>
          expense.id === id ? { ...expense, ...response.expense } : expense,
        ),
        message: response.message,
        selectedExpense:
          state.selectedExpense?.id === id
            ? { ...state.selectedExpense, ...response.expense }
            : state.selectedExpense,
      }));
    } catch (error) {
      set({
        advanceStatusUpdatingId: null,
        error: getApiErrorMessage(error),
        message: null,
      });
      throw error;
    }
  },

  updatePaymentStatus: async (id, isPaid) => {
    set({ error: null, message: null, paymentStatusUpdatingId: id });

    try {
      const response = await expensesApi.updatePaymentStatus(id, isPaid);

      set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense.id === id ? { ...expense, ...response.expense } : expense,
        ),
        effectiveExpenses: state.effectiveExpenses.map((expense) =>
          expense.id === id ? { ...expense, ...response.expense } : expense,
        ),
        advancedExpenses: state.advancedExpenses.map((expense) =>
          expense.id === id ? { ...expense, ...response.expense } : expense,
        ),
        message: response.message,
        paymentStatusUpdatingId: null,
      }));
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        message: null,
        paymentStatusUpdatingId: null,
      });
      throw error;
    }
  },
}));

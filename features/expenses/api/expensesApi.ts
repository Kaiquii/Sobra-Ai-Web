import { apiClient } from "@/lib/api";
import type {
  CategoriesResponse,
  CategoryMutationResponse,
  CreateCategoryRequest,
  CreateExpenseRequest,
  Expense,
  ExpenseMutationResponse,
  ExpenseResponse,
  ExpensesResponse,
  UpdateCategoryRequest,
  UpdateExpenseRequest,
} from "@/features/expenses/types/expense";

function normalizeExpenseResponse(data: Expense | ExpenseResponse) {
  if ("data" in data && data.data) {
    return data.data;
  }

  if ("expense" in data && data.expense) {
    return data.expense;
  }

  return data as Expense;
}

export const expensesApi = {
  async createCategory(data: CreateCategoryRequest) {
    const response = await apiClient.post<CategoryMutationResponse>(
      "/api/categories/",
      data,
    );

    return response.data;
  },

  async createExpense(data: CreateExpenseRequest) {
    const response = await apiClient.post<ExpenseMutationResponse>(
      "/api/expenses/",
      data,
    );

    return response.data;
  },

  async deleteExpense(id: number, deleteFuture: boolean) {
    const response = await apiClient.delete<ExpenseMutationResponse>(
      `/api/expenses/${id}`,
      deleteFuture ? { params: { delete_future: true } } : undefined,
    );

    return response.data;
  },

  async deleteCategory(id: number) {
    const response = await apiClient.delete<CategoryMutationResponse>(
      `/api/categories/${id}`,
    );

    return response.data;
  },

  async getCategories() {
    const response = await apiClient.get<CategoriesResponse>("/api/categories/");

    return response.data;
  },

  async getExpense(id: number) {
    const response = await apiClient.get<Expense | ExpenseResponse>(
      `/api/expenses/${id}`,
    );

    return normalizeExpenseResponse(response.data);
  },

  async getExpenses(month: number, year: number) {
    const response = await apiClient.get<ExpensesResponse>("/api/expenses/", {
      params: { month, year },
    });

    return response.data;
  },

  async updateExpense(id: number, data: UpdateExpenseRequest) {
    const response = await apiClient.patch<ExpenseMutationResponse>(
      `/api/expenses/${id}`,
      data,
    );

    return response.data;
  },

  async updateCategory(id: number, data: UpdateCategoryRequest) {
    const response = await apiClient.patch<CategoryMutationResponse>(
      `/api/categories/${id}`,
      data,
    );

    return response.data;
  },
};

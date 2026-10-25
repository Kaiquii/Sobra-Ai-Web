import { apiClient } from "@/lib/api";
import type {
  CreateIncomeRequest,
  IncomeListResponse,
  IncomeMutationResponse,
  UpdateIncomeRequest,
} from "@/features/incomes/types/income";

export const incomesApi = {
  async createIncome(data: CreateIncomeRequest) {
    const response = await apiClient.post<IncomeMutationResponse>("/api/incomes/", data);

    return response.data;
  },

  async deleteIncome(id: number, deleteFuture: boolean) {
    const response = await apiClient.delete<IncomeMutationResponse>(
      `/api/incomes/${id}`,
      deleteFuture ? { params: { delete_future: true } } : undefined,
    );

    return response.data;
  },

  async getIncomes(month: number, year: number) {
    const response = await apiClient.get<IncomeListResponse>("/api/incomes/", { params: { month, year } });

    return response.data;
  },

  async updateIncome(id: number, data: UpdateIncomeRequest) {
    const response = await apiClient.patch<IncomeMutationResponse>(
      `/api/incomes/${id}`,
      data,
    );

    return response.data;
  },
};

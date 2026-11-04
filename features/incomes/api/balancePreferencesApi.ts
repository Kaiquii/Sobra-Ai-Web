import type {
  BalancePreferenceKey,
  BalancePreferences,
} from "@/features/incomes/types/balancePreferences";
import { apiClient } from "@/lib/api";

function parsePreferences(value: unknown): BalancePreferences {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("exclude_va_from_available" in value) ||
    !("exclude_vr_from_available" in value) ||
    typeof value.exclude_va_from_available !== "boolean" ||
    typeof value.exclude_vr_from_available !== "boolean"
  ) {
    throw new Error("Resposta de preferências de saldo inválida.");
  }

  return {
    exclude_va_from_available: value.exclude_va_from_available,
    exclude_vr_from_available: value.exclude_vr_from_available,
  };
}

export const balancePreferencesApi = {
  async getPreferences(): Promise<BalancePreferences> {
    const response = await apiClient.get<unknown>("/api/users/balance-preferences");
    return parsePreferences(response.data);
  },

  async patchPreference(
    key: BalancePreferenceKey,
    value: boolean,
  ): Promise<BalancePreferences> {
    if (
      (key !== "exclude_va_from_available" && key !== "exclude_vr_from_available") ||
      typeof value !== "boolean"
    ) {
      throw new Error("Preferência de saldo inválida.");
    }

    const response = await apiClient.patch<unknown>("/api/users/balance-preferences", {
      [key]: value,
    });
    return parsePreferences(response.data);
  },
};

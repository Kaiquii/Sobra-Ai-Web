export type BalancePreferences = {
  exclude_va_from_available: boolean;
  exclude_vr_from_available: boolean;
};

export type BalancePreferenceKey = keyof BalancePreferences;

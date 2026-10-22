"use client";

import { create } from "zustand";

export const useFinancialPrivacyStore = create<{
  valuesHidden: boolean;
  toggle: () => void;
}>((set) => ({
  valuesHidden: false,
  toggle: () => set((state) => ({ valuesHidden: !state.valuesHidden })),
}));

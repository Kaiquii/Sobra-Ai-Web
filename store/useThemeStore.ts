"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  applyBrowserTheme,
  getInitialTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      setTheme: (theme) => {
        applyBrowserTheme(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const theme = state.theme === "dark" ? "light" : "dark";
          applyBrowserTheme(theme);

          return { theme };
        }),
    }),
    {
      name: THEME_STORAGE_KEY,
    },
  ),
);

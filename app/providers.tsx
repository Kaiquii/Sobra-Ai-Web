"use client";

import axios from "axios";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { apiClient } from "@/lib/api";
import { useThemeStore } from "@/store/useThemeStore";

function logoutAndRedirect() {
  useAuthStore.getState().logout();
  window.location.replace("/login");
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const canRegisterServiceWorker =
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!canRegisterServiceWorker) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logoutAndRedirect();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.response.eject(interceptorId);
    };
  }, []);

  return children;
}

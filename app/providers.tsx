"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { apiClient } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useThemeStore } from "@/store/useThemeStore";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useThemeStore((state) => state.theme);
  const isProduction = process.env.NODE_ENV === "production";
  const router = useRouter();

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

    if (!isProduction) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        )
        .catch(() => {});

      if ("caches" in window) {
        void window.caches
          .keys()
          .then((cacheNames) =>
            Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName))),
          )
          .catch(() => {});
      }

      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, [isProduction]);

  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          if (status === 401 || status === 403) {
            const errorMessage =
              status === 403 ? getApiErrorMessage(error) : undefined;

            useAuthStore.getState().logout(errorMessage);
            router.replace("/login");
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.response.eject(interceptorId);
    };
  }, [router]);

  return children;
}

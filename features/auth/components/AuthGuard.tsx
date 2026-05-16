"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const hasValidSession = isAuthenticated && Boolean(token);

  useEffect(() => {
    if (hasHydrated && !hasValidSession) {
      router.replace("/login");
    }
  }, [hasHydrated, hasValidSession, router]);

  if (!hasHydrated || !hasValidSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Carregando...
      </main>
    );
  }

  return children;
}

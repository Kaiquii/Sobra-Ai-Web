"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useFinancialPrivacyStore } from "@/store/useFinancialPrivacyStore";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const valuesHidden = useFinancialPrivacyStore((state) => state.valuesHidden);
  const hideFinancialContent = valuesHidden && (pathname.startsWith("/relatorios") || pathname === "/salario");
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/home") return;
    const mobile = window.matchMedia("(max-width: 639px)");
    const redirectMobile = () => {
      if (mobile.matches) router.replace("/inicio");
    };
    redirectMobile();
    mobile.addEventListener("change", redirectMobile);
    return () => mobile.removeEventListener("change", redirectMobile);
  }, [pathname, router]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className={`w-full px-4 ${pathname === "/patrimonio" ? "pb-[calc(24px+env(safe-area-inset-bottom))] pt-2" : "pb-(--mobile-content-bottom,calc(100px+env(safe-area-inset-bottom))) pt-5"} sm:px-6 sm:py-5 lg:px-8 ${pathname === "/home" ? "max-sm:hidden" : ""}`}>
          {hideFinancialContent ? <div role="status" className="mx-auto max-w-6xl rounded-xl bg-white p-6 text-slate-500 dark:bg-slate-900 dark:text-slate-400">Valores ocultos. Use o botão de mostrar valores no cabeçalho para visualizar este conteúdo financeiro.</div> : null}
          <div hidden={hideFinancialContent}>{children}</div>
        </main>
        <MobileNavigation />
      </div>
    </AuthGuard>
  );
}

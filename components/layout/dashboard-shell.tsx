"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
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
        <main className={`w-full px-4 pb-[calc(100px+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:py-5 lg:px-8 ${pathname === "/home" ? "max-sm:hidden" : ""}`}>
          {children}
        </main>
        <MobileNavigation />
      </div>
    </AuthGuard>
  );
}

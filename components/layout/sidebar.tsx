"use client";

import { X, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(320px,calc(100vw-32px))] flex-col border-r border-slate-200 bg-white text-slate-950 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">SobraAí</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Navegacao</p>
            </div>
          </div>

          <Button
            aria-label="Fechar menu"
            className="shrink-0 rounded-lg"
            onClick={onClose}
            size="iconLg"
            title="Fechar menu"
            type="button"
            variant="ghost"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {dashboardNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm",
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-slate-900",
                )}
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{item.label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {item.text}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { dashboardNavigation } from "@/components/layout/navigation";
import { useExpenseComposerStore } from "@/features/expenses/store/useExpenseComposerStore";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const open = useExpenseComposerStore((state) => state.open);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 mx-auto grid h-17 max-w-lg grid-cols-5 items-center rounded-[26px] border border-slate-200 bg-white/95 px-1 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:hidden"
    >
      {dashboardNavigation.map((item, index) => {
        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/perfil" && pathname === "/salario");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              index === 2 && "col-start-4",
              active ? "text-brand" : "text-slate-500 dark:text-slate-400",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-full",
                active && "bg-brand/10",
              )}
            >
              <Icon aria-hidden="true" size={22} />
            </span>
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        aria-label="Adicionar despesa"
        title="Adicionar despesa"
        onClick={() => {
          open();
          router.push("/despesas");
        }}
        className="absolute left-1/2 -top-3 flex h-14 w-14 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-brand text-white shadow-md hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-950"
      >
        <Plus aria-hidden="true" size={28} />
      </button>
    </nav>
  );
}

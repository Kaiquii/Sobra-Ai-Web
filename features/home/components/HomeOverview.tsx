"use client";

import Image from "next/image";
import Link from "next/link";

import { dashboardNavigation } from "@/components/layout/navigation";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function HomeOverview() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Painel financeiro
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50 sm:text-3xl">
              {user?.name ? `${user.name}, escolha uma área.` : "Escolha uma área."}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Acesse rapidamente as principais áreas do app e mantenha sua rotina
              financeira organizada.
            </p>
          </div>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800 sm:h-24 sm:w-24">
            <Image
              alt="App Financeiro"
              className="h-full w-full object-cover"
              height={96}
              priority
              src="/logo_app.png"
              width={96}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="group min-h-44 rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40"
              href={item.href}
              key={item.href}
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:bg-slate-950 dark:text-slate-300 dark:group-hover:bg-emerald-950 dark:group-hover:text-emerald-300">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                {item.label}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

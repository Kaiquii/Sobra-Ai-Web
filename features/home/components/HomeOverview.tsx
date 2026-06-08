"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { dashboardNavigation } from "@/components/layout/navigation";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

const cardStyles = [
  {
    accent: "bg-emerald-500",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    hover: "hover:border-emerald-300 hover:bg-emerald-50/70 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30",
  },
  {
    accent: "bg-rose-500",
    icon: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    hover: "hover:border-rose-300 hover:bg-rose-50/70 dark:hover:border-rose-800 dark:hover:bg-rose-950/30",
  },
  {
    accent: "bg-sky-500",
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    hover: "hover:border-sky-300 hover:bg-sky-50/70 dark:hover:border-sky-800 dark:hover:bg-sky-950/30",
  },
  {
    accent: "bg-violet-500",
    icon: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    hover: "hover:border-violet-300 hover:bg-violet-50/70 dark:hover:border-violet-800 dark:hover:bg-violet-950/30",
  },
];

export function HomeOverview() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col gap-7">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Painel financeiro
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
              {user?.name ? `${user.name}, escolha uma área.` : "Escolha uma área."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Acesse rapidamente as principais áreas do app e mantenha sua rotina
              financeira organizada.
            </p>
          </div>

          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800 sm:h-28 sm:w-28">
            <Image
              alt="SobraAí"
              className="h-full w-full object-cover"
              height={112}
              priority
              src="/logo_app.png"
              width={112}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Áreas do app
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Escolha para onde quer ir agora.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardNavigation.map((item, index) => {
            const Icon = item.icon;
            const style = cardStyles[index] ?? cardStyles[0];

            return (
              <Link
                className={`group flex min-h-52 flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 ${style.hover}`}
                href={item.href}
                key={item.href}
              >
                <span className={`h-1 w-full ${style.accent}`} />
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className={`mb-7 flex h-12 w-12 items-center justify-center rounded-lg ${style.icon}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                      {item.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {item.text}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <span>Abrir área</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 group-hover:bg-slate-950 group-hover:text-white dark:bg-slate-950 dark:text-slate-300 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-950">
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { CreditCard, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="flex min-h-65 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:min-h-[calc(100vh-40px)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800">
                <Image
                  alt="App Financeiro"
                  className="h-full w-full object-cover"
                  height={48}
                  priority
                  src="/logo_app.png"
                  width={48}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  App Financeiro
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Painel web
                </p>
              </div>
            </div>
            <ThemeToggle
              className="h-10 w-10 border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              iconSize={18}
            />
          </div>

          <div className="max-w-xl py-10 lg:py-0">
            <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              Controle seguro
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-950 dark:text-slate-50 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                <CreditCard className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Gastos e entradas</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Seu painel financeiro em um lugar.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Acesso protegido</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Token salvo para sua sessão web.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center pb-6 lg:pb-0">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}

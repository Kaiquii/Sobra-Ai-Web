import { CreditCard, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

const featureCards = [
  {
    description: "Seu painel financeiro em um lugar.",
    icon: CreditCard,
    iconClassName:
      "bg-sky-500/15 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
    title: "Gastos e entradas",
  },
  {
    description: "Acesso seguro à sua conta.",
    icon: ShieldCheck,
    iconClassName:
      "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
    title: "Acesso protegido",
  },
];

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(350px,400px)] lg:px-8">
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/25 sm:p-6 lg:h-[calc(100svh-32px)] lg:max-h-[760px] lg:min-h-[560px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,rgba(59,130,246,0.08),transparent_48%)] dark:bg-[linear-gradient(120deg,rgba(16,185,129,0.13),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.08),transparent_48%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 dark:opacity-20" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg shadow-slate-300/50 dark:border-slate-800 dark:shadow-black/30">
                <Image
                  alt="SobraAí"
                  className="h-full w-full object-cover"
                  height={56}
                  priority
                  src="/logo_app.png"
                  width={56}
                />
              </div>

              <div>
                <p className="text-xl font-semibold leading-6 text-slate-950 dark:text-slate-50">
                  SobraAí
                </p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Painel web
                </p>
              </div>
            </div>

            <ThemeToggle
              className="h-11 w-11 border-slate-200 bg-white/85 text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              iconSize={18}
            />
          </div>

          <div className="relative flex flex-1 items-center py-7 lg:py-5">
            <div className="min-w-0">
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck aria-hidden="true" size={14} />
                Controle seguro
              </p>

              <h1 className="max-w-xl text-3xl font-semibold leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2">
            {featureCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/20"
                  key={card.title}
                >
                  <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClassName}`}
                  >
                    <Icon aria-hidden="true" size={21} />
                  </div>
                  <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex min-h-0 items-center justify-center pb-4 lg:h-[calc(100svh-32px)] lg:max-h-[760px] lg:pb-0">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}

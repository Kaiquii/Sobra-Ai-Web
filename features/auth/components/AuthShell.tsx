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
    <main className="min-h-svh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-svh max-w-md flex-col px-5 pb-8 pt-5 sm:justify-center sm:py-10">
        <div className="flex justify-end">
          <ThemeToggle
            className="h-11 w-11 rounded-full border-0 bg-transparent shadow-none dark:bg-transparent"
            iconSize={20}
          />
        </div>
        <header className="mb-7 mt-2 flex flex-col items-center text-center">
          <Image
            alt=""
            src="/logo_app.png"
            width={80}
            height={80}
            priority
            className="mb-3 rounded-2xl"
          />
          <h1 className="text-2xl font-bold">SobraAí</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Suas finanças, sempre com você.
          </p>
        </header>
        <div className="w-full min-w-0">{children}</div>
        <p className="sr-only">
          {title}. {description}
        </p>
      </div>
    </main>
  );
}

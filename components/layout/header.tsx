"use client";

import { ChevronDown, Home, LogOut, Menu, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { dashboardNavigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

type HeaderProps = {
  onOpenSidebar: () => void;
};

const extraRouteTitles = [
  { href: "/home", label: "Home" },
  { href: "/salario", label: "Salario" },
  { href: "/configuracoes", label: "Configuracoes" },
];

const routeTitles = [...extraRouteTitles, ...dashboardNavigation];

function getCurrentPageTitle(pathname: string) {
  const match = routeTitles
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0];

  return match?.label ?? "App Financeiro";
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentPageTitle = getCurrentPageTitle(pathname);
  const userName = user?.name ?? "Usuario";

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  function handleLogout() {
    logout();
    setIsLogoutDialogOpen(false);
    setIsUserMenuOpen(false);
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/95 px-4 py-2 text-slate-950 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-50 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              aria-label="Abrir menu"
              className="shrink-0 rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              onClick={onOpenSidebar}
              size="iconSm"
              title="Abrir menu"
              type="button"
              variant="secondary"
            >
              <Menu aria-hidden="true" size={17} strokeWidth={2.25} />
            </Button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50 sm:text-base">
                {currentPageTitle}
              </h1>
              {currentPageTitle !== "App Financeiro" ? (
                <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                  App Financeiro
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              aria-label="Ir para home"
              className="rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              onClick={() => router.push("/home")}
              size="iconSm"
              title="Home"
              type="button"
              variant="secondary"
            >
              <Home aria-hidden="true" size={16} strokeWidth={2.25} />
            </Button>
            <ThemeToggle
              className="h-8 w-8 rounded-full border border-slate-300 bg-white p-0 dark:border-slate-700 dark:bg-slate-900"
              iconSize={16}
            />
            <div className="relative" ref={userMenuRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:px-3"
                onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
                type="button"
              >
                <UserRound aria-hidden="true" size={14} strokeWidth={2.25} />
                <span className="hidden max-w-32 truncate sm:inline">
                  Ola, {userName}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={isUserMenuOpen ? "rotate-180 transition" : "transition"}
                  size={14}
                  strokeWidth={2.25}
                />
              </button>

              {isUserMenuOpen ? (
                <div
                  className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsLogoutDialogOpen(true);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <LogOut aria-hidden="true" size={15} strokeWidth={2.25} />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <ConfirmationDialog
        confirmLabel="Sim, sair"
        description="Voce sera desconectado da sua conta e precisara fazer login novamente para acessar o painel."
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title="Tem certeza que deseja sair?"
        tone="danger"
      />
    </>
  );
}

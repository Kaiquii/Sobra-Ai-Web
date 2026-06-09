"use client";

import {
  ChevronDown,
  Home,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Star,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { dashboardNavigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ProfilePhotoPreviewDialog } from "@/components/ui/profile-photo-preview-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AssistantChatDialog } from "@/features/assistant/components/AssistantChatView";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { buildApiAssetUrl } from "@/lib/api";

type HeaderProps = {
  onOpenSidebar: () => void;
};

const extraRouteTitles = [
  { href: "/home", label: "Home" },
  { href: "/salario", label: "Salário" },
  { href: "/perfil/ajuda", label: "Central de Ajuda" },
  { href: "/perfil/categorias", label: "Categorias" },
  { href: "/perfil/editar", label: "Editar Perfil" },
];

const routeTitles = [...extraRouteTitles, ...dashboardNavigation];

function getCurrentPageTitle(pathname: string) {
  const match = routeTitles
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0];

  return match?.label ?? "SobraAí";
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [isAssistantDialogOpen, setIsAssistantDialogOpen] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarUrl = buildApiAssetUrl(user?.avatar_url, user?.avatar_cache_key);
  const profileEmail = user?.email;
  const currentPageTitle = getCurrentPageTitle(pathname);
  const userName = user?.name ?? "Usuário";
  const userEmail = user?.email ?? "E-mail não informado.";
  const isAdmin = user?.role === "admin";
  const userRoleLabel = isAdmin
    ? "Administrador"
    : user?.role === "user"
      ? "Usuário"
      : user?.role || "Perfil não informado";

  useEffect(() => {
    if (!profileEmail) {
      return;
    }

    void loadProfile().catch(() => {});
  }, [loadProfile, profileEmail]);

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
              {currentPageTitle !== "SobraAí" ? (
                <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                  SobraAí
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
            <Button
              aria-label="Abrir assistente com IA"
              className="rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              onClick={() => setIsAssistantDialogOpen(true)}
              size="iconSm"
              title="Assistente com IA"
              type="button"
              variant="secondary"
            >
              <MessageCircle aria-hidden="true" size={16} strokeWidth={2.25} />
            </Button>
            <ThemeToggle
              className="h-8 w-8 rounded-full border border-slate-300 bg-white p-0 dark:border-slate-700 dark:bg-slate-900"
              iconSize={16}
            />
            <div className="relative" ref={userMenuRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="dialog"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:px-3"
                onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
                type="button"
              >
                {avatarUrl ? (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full object-cover"
                    height={20}
                    src={avatarUrl}
                    width={20}
                  />
                ) : (
                  <UserRound aria-hidden="true" size={14} strokeWidth={2.25} />
                )}
                <span className="hidden max-w-32 truncate sm:inline">
                  Olá, {userName}
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
                  aria-label="Informações do usuário"
                  className="absolute right-0 top-10 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
                  role="dialog"
                >
                  <div className="grid gap-3 border-b border-slate-200 p-3.5 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                      {avatarUrl ? (
                        <button
                          aria-label="Visualizar foto de perfil"
                          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-100 text-emerald-700 transition hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsPhotoPreviewOpen(true);
                          }}
                          title="Visualizar foto"
                          type="button"
                        >
                          <Image
                            alt="Foto de perfil"
                            className="h-full w-full object-cover"
                            height={40}
                            src={avatarUrl}
                            width={40}
                          />
                        </button>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-emerald-100 text-emerald-700 dark:border-slate-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <UserRound aria-hidden="true" size={18} strokeWidth={2.25} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                          Nome
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                          {userName}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-2.5">
                      <Mail
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"
                        size={15}
                        strokeWidth={2.25}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                          E-mail
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-2.5">
                      <UserRound
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"
                        size={15}
                        strokeWidth={2.25}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                          Perfil
                        </p>
                        <span
                          className={
                            isAdmin
                              ? "mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-amber-600 dark:text-amber-300"
                              : "mt-0.5 block truncate text-sm font-semibold text-slate-700 dark:text-slate-200"
                          }
                        >
                          {isAdmin ? (
                            <Star
                              aria-hidden="true"
                              className="shrink-0"
                              size={14}
                              strokeWidth={2.4}
                            />
                          ) : null}
                          {userRoleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-1.5 dark:border-slate-800">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsLogoutDialogOpen(true);
                      }}
                      type="button"
                    >
                      <LogOut aria-hidden="true" size={15} strokeWidth={2.25} />
                      Sair
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <ConfirmationDialog
        confirmLabel="Sim, sair"
        description="Você será desconectado da sua conta e precisará fazer login novamente para acessar o painel."
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title="Tem certeza que deseja sair?"
        tone="danger"
      />
      <ProfilePhotoPreviewDialog
        avatarUrl={avatarUrl}
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
      />
      <AssistantChatDialog
        isOpen={isAssistantDialogOpen}
        onClose={() => setIsAssistantDialogOpen(false)}
      />
    </>
  );
}

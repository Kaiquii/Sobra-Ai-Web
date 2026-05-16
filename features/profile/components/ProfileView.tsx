"use client";

import {
  ChevronRight,
  CircleDollarSign,
  HelpCircle,
  LogOut,
  Pencil,
  Shapes,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClassName, Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { cn } from "@/lib/utils";

function getInitial(name: string | undefined) {
  return name?.trim().charAt(0).toUpperCase() ?? "";
}

function getRoleInfo(role: string | undefined) {
  if (role === "admin") {
    return {
      className:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      icon: <Star aria-hidden="true" size={15} strokeWidth={2.25} />,
      label: "Administrador",
    };
  }

  return {
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    icon: <UserRound aria-hidden="true" size={15} strokeWidth={2.25} />,
    label: "Usuario",
  };
}

type ProfileShortcutProps = {
  description: string;
  href: string;
  icon: React.ReactNode;
  title: string;
};

function ProfileShortcut({ description, href, icon, title }: ProfileShortcutProps) {
  return (
    <Link
      className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900"
      href={href}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
            {title}
          </span>
          <span className="mt-1 block truncate text-sm text-slate-500 dark:text-slate-400">
            {description}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="shrink-0 text-slate-400"
        size={18}
        strokeWidth={2.25}
      />
    </Link>
  );
}

export function ProfileView() {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const roleInfo = getRoleInfo(user?.role);
  const initial = getInitial(user?.name);

  function handleLogout() {
    logout();
    setIsLogoutDialogOpen(false);
    router.replace("/login");
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {initial || <UserRound aria-hidden="true" size={30} strokeWidth={2.25} />}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {user?.name || "Usuario"}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {user?.email || "email nao informado"}
                </p>
                <span
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    roleInfo.className,
                  )}
                >
                  {roleInfo.icon}
                  {roleInfo.label}
                </span>
              </div>
            </div>

            <Link
              className={buttonClassName({ className: "w-full sm:w-auto", variant: "secondary" })}
              href="/perfil/editar"
            >
              <Pencil aria-hidden="true" size={16} strokeWidth={2.25} />
              Editar Perfil
            </Link>
          </div>
        </article>

        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Configuracoes
          </h2>
          <div className="mt-3 grid gap-3">
            <ProfileShortcut
              description="Salario, Adiantamento e Renda Extra"
              href="/salario"
              icon={<CircleDollarSign aria-hidden="true" size={20} strokeWidth={2.25} />}
              title="Configuracoes de Renda"
            />
            <ProfileShortcut
              description="Crie e edite suas categorias"
              href="/perfil/categorias"
              icon={<Shapes aria-hidden="true" size={20} strokeWidth={2.25} />}
              title="Categorias"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Ajuda
          </h2>
          <div className="mt-3">
            <ProfileShortcut
              description="Duvidas frequentes e suporte"
              href="/perfil/ajuda"
              icon={<HelpCircle aria-hidden="true" size={20} strokeWidth={2.25} />}
              title="Central de Ajuda"
            />
          </div>
        </div>

        <Button
          className="border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 focus-visible:ring-red-200 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          onClick={() => setIsLogoutDialogOpen(true)}
          type="button"
          variant="secondary"
        >
          <LogOut aria-hidden="true" size={17} strokeWidth={2.25} />
          Sair da Conta
        </Button>
      </section>

      <ConfirmationDialog
        confirmLabel="Sim, sair"
        description="Voce sera desconectado da sua conta e precisara fazer login novamente para acessar o painel."
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title="Sair da conta?"
        tone="danger"
      />
    </>
  );
}

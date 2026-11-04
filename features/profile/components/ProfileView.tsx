"use client";

import {
  Camera,
  ChevronRight,
  CircleDollarSign,
  Diamond,
  HelpCircle,
  Landmark,
  LogOut,
  Pencil,
  Shapes,
  Star,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { buttonClassName, Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ProfilePhotoPreviewDialog } from "@/components/ui/profile-photo-preview-dialog";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { buildApiAssetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function getInitial(name: string | undefined) {
  return name?.trim().charAt(0).toUpperCase() ?? "";
}

function getRoleInfo(role: string | undefined) {
  if (role === "admin") {
    return {
      className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      icon: <Star aria-hidden="true" size={15} strokeWidth={2.25} />,
      label: "Administrador",
    };
  }

  if (role === "premium") {
    return {
      className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      icon: <Diamond aria-hidden="true" size={15} strokeWidth={2.25} />,
      label: "Premium",
    };
  }

  return {
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    icon: <UserRound aria-hidden="true" size={15} strokeWidth={2.25} />,
    label: "Usuário",
  };
}

type ProfileShortcutProps = {
  description: string;
  href: string;
  icon: React.ReactNode;
  title: string;
  mobile?: boolean;
};

function ProfileShortcut({ description, href, icon, title, mobile = false }: ProfileShortcutProps) {
  return (
    <Link
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        mobile
          ? "rounded-xl p-3 active:bg-slate-50 dark:active:bg-slate-800"
          : "rounded-lg p-4 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900",
      )}
      href={href}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
            mobile ? "h-11 w-11 rounded-xl" : "h-10 w-10 rounded-lg",
          )}
        >
          {icon}
        </span>

        <span className="min-w-0 flex-1 overflow-hidden">
          <span
            className={cn(
              "block font-semibold text-slate-950 dark:text-slate-50",
              mobile ? "wrap-anywhere text-base" : "truncate text-sm",
            )}
          >
            {title}
          </span>

          <span
            className={cn(
              "block text-slate-500 dark:text-slate-400",
              mobile ? "wrap-anywhere text-xs" : "mt-1 truncate text-sm",
            )}
          >
            {description}
          </span>
        </span>
      </span>

      <ChevronRight
        aria-hidden="true"
        className="shrink-0 text-slate-400"
        size={mobile ? 24 : 18}
        strokeWidth={2.25}
      />
    </Link>
  );
}

export function ProfileView() {
  const [isDeletePhotoDialogOpen, setIsDeletePhotoDialogOpen] = useState(false);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const clearFeedback = useAuthStore((state) => state.clearFeedback);
  const deleteProfilePhoto = useAuthStore((state) => state.deleteProfilePhoto);
  const error = useAuthStore((state) => state.error);
  const loadProfile = useAuthStore((state) => state.loadProfile);
  const logout = useAuthStore((state) => state.logout);
  const message = useAuthStore((state) => state.message);
  const uploadProfilePhoto = useAuthStore((state) => state.uploadProfilePhoto);
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const roleInfo = getRoleInfo(user?.role);
  const avatarUrl = buildApiAssetUrl(user?.avatar_url, user?.avatar_cache_key);
  const profileEmail = user?.email;

  useEffect(() => {
    clearFeedback();
  }, [clearFeedback]);

  useEffect(() => {
    if (!profileEmail) {
      return;
    }

    void loadProfile().catch(() => {});
  }, [loadProfile, profileEmail]);

  function handleLogout() {
    logout();
    setIsLogoutDialogOpen(false);
    router.replace("/login");
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    clearFeedback();
    setIsPhotoBusy(true);

    try {
      await uploadProfilePhoto(file);
    } finally {
      setIsPhotoBusy(false);
      event.target.value = "";
    }
  }

  async function handleDeletePhoto() {
    clearFeedback();
    setIsDeletePhotoDialogOpen(false);
    setIsPhotoBusy(true);

    try {
      await deleteProfilePhoto();
    } finally {
      setIsPhotoBusy(false);
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-6 sm:gap-5">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-lg sm:p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
            <div className="flex min-w-0 items-center gap-3.5 sm:gap-4 sm:overflow-hidden">
              <div className="relative flex h-24 w-23 shrink-0 justify-center sm:contents">
                {avatarUrl ? (
                  <button
                    aria-label="Visualizar foto de perfil"
                    className="flex h-19 w-19 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-100 text-2xl font-semibold text-emerald-700 hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-800 dark:bg-emerald-950/50 dark:text-emerald-300 sm:h-16 sm:w-16"
                    onClick={() => setIsPhotoPreviewOpen(true)}
                    title="Visualizar foto"
                    type="button"
                  >
                    <Image
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                      height={76}
                      loading="eager"
                      src={avatarUrl}
                      width={76}
                    />
                  </button>
                ) : (
                  <div className="flex h-19 w-19 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-100 text-2xl font-semibold text-emerald-700 dark:border-slate-800 dark:bg-emerald-950/50 dark:text-emerald-300 sm:h-16 sm:w-16">
                    {getInitial(user?.name) || (
                      <UserRound aria-hidden="true" size={30} strokeWidth={2.25} />
                    )}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 sm:hidden">
                  <Button
                    aria-label="Alterar foto"
                    className="bg-brand text-white ring-[3px] ring-white enabled:hover:bg-brand-hover max-sm:rounded-full dark:text-white dark:ring-slate-900 dark:enabled:hover:bg-brand-hover"
                    disabled={isPhotoBusy}
                    onClick={() => fileInputRef.current?.click()}
                    size="iconSm"
                    variant="ghost"
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </Button>
                  {avatarUrl ? (
                    <Button
                      aria-label="Remover foto"
                      className="bg-red-600 text-white ring-[3px] ring-white enabled:hover:bg-red-700 max-sm:rounded-full dark:bg-red-500 dark:text-white dark:ring-slate-900 dark:enabled:hover:bg-red-400"
                      disabled={isPhotoBusy}
                      onClick={() => setIsDeletePhotoDialogOpen(true)}
                      size="iconSm"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h2 className="wrap-anywhere text-xl font-bold text-slate-950 dark:text-slate-50 sm:text-2xl sm:font-semibold">
                  {user?.name || "Usuário"}
                </h2>

                <p
                  className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm"
                  title={user?.email}
                >
                  {user?.email || "E-mail não informado."}
                </p>

                <span
                  className={cn(
                    "mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold sm:mt-3 sm:px-3 sm:py-1",
                    roleInfo.className,
                  )}
                >
                  <span className="shrink-0">{roleInfo.icon}</span>
                  <span className="truncate">{roleInfo.label}</span>
                </span>

                <input
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  type="file"
                />

                <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
                  <Button
                    className="h-8 px-2.5 text-xs"
                    disabled={isPhotoBusy}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    variant="secondary"
                  >
                    <Camera aria-hidden="true" size={15} strokeWidth={2.25} />
                    Alterar foto
                  </Button>

                  {avatarUrl ? (
                    <Button
                      className="h-8 border-red-200 bg-red-50 px-2.5 text-xs text-red-700 hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                      disabled={isPhotoBusy}
                      onClick={() => setIsDeletePhotoDialogOpen(true)}
                      type="button"
                      variant="secondary"
                    >
                      <Trash2 aria-hidden="true" size={15} strokeWidth={2.25} />
                      Remover
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <Link
              className={buttonClassName({
                className:
                  "w-full min-w-0 max-sm:rounded-xl max-sm:border-transparent max-sm:bg-brand max-sm:text-white max-sm:hover:bg-brand-hover max-sm:dark:border-transparent max-sm:dark:bg-brand max-sm:dark:text-white max-sm:dark:hover:bg-brand-hover sm:w-auto",
                variant: "secondary",
              })}
              href="/perfil/editar"
            >
              <Pencil aria-hidden="true" size={16} strokeWidth={2.25} />
              <span className="sm:hidden">Editar perfil</span>
              <span className="hidden sm:inline">Editar Perfil</span>
            </Link>
          </div>
        </article>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {message ? <Alert variant="success">{message}</Alert> : null}

        <div className="min-w-0 sm:hidden">
          <h2 className="mb-2 pl-0.5 text-[17px] font-bold">Finanças</h2>
          <div className="grid min-w-0 gap-2">
            <ProfileShortcut
              mobile
              title="Rendas"
              description="Salário, adiantamento, renda extra, VA e VR"
              href="/salario"
              icon={<Landmark aria-hidden="true" size={24} />}
            />
            <ProfileShortcut
              mobile
              title="Patrimônio"
              description="FGTS e investimentos"
              href="/patrimonio?origem=perfil"
              icon={<Wallet aria-hidden="true" size={24} />}
            />
            <ProfileShortcut
              mobile
              title="Categorias"
              description="Organize os tipos de despesa"
              href="/perfil/categorias"
              icon={<Shapes aria-hidden="true" size={24} />}
            />
          </div>
        </div>

        <div className="hidden min-w-0 sm:block">
          <h2 className="text-lg font-semibold">Finanças</h2>
          <div className="mt-3">
            <ProfileShortcut
              title="Patrimônio"
              description="FGTS e investimentos"
              href="/patrimonio?origem=perfil"
              icon={<Wallet aria-hidden="true" size={24} />}
            />
          </div>
        </div>

        <div className="hidden min-w-0 sm:block">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Configurações</h2>

          <div className="mt-3 grid min-w-0 gap-3">
            <ProfileShortcut
              description="Salário, adiantamento, renda extra, VA e VR."
              href="/salario"
              icon={<CircleDollarSign aria-hidden="true" size={20} strokeWidth={2.25} />}
              title="Configurações de Renda"
            />

            <ProfileShortcut
              description="Crie e edite suas categorias."
              href="/perfil/categorias"
              icon={<Shapes aria-hidden="true" size={20} strokeWidth={2.25} />}
              title="Categorias"
            />
          </div>
        </div>

        <div className="min-w-0 sm:hidden">
          <h2 className="mb-2 pl-0.5 text-[17px] font-bold">Suporte</h2>
          <ProfileShortcut
            mobile
            title="Ajuda e suporte"
            description="Dúvidas frequentes e contato"
            href="/perfil/ajuda"
            icon={<HelpCircle aria-hidden="true" size={24} />}
          />
        </div>

        <div className="hidden min-w-0 sm:block">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Ajuda</h2>

          <div className="mt-3 min-w-0">
            <ProfileShortcut
              description="Dúvidas frequentes e suporte."
              href="/perfil/ajuda"
              icon={<HelpCircle aria-hidden="true" size={20} strokeWidth={2.25} />}
              title="Central de Ajuda"
            />
          </div>
        </div>

        <Button
          className="min-w-0 border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 focus-visible:ring-red-200 max-sm:hidden dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
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
        description="Você será desconectado da sua conta e precisará fazer login novamente para acessar o painel."
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title="Sair da conta?"
        tone="danger"
      />

      <ConfirmationDialog
        confirmLabel="Remover foto"
        description="Sua foto atual será removida do perfil. Você poderá enviar outra depois, quando quiser."
        isOpen={isDeletePhotoDialogOpen}
        onClose={() => setIsDeletePhotoDialogOpen(false)}
        onConfirm={() => {
          void handleDeletePhoto();
        }}
        title="Remover foto de perfil?"
        tone="danger"
      />

      <ProfilePhotoPreviewDialog
        avatarUrl={avatarUrl}
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        userName={user?.name}
      />
    </>
  );
}

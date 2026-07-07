"use client";

import {
  Camera,
  ChevronRight,
  CircleDollarSign,
  HelpCircle,
  LogOut,
  Pencil,
  Shapes,
  Star,
  Trash2,
  UserRound,
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
      className:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      icon: <Star aria-hidden="true" size={15} strokeWidth={2.25} />,
      label: "Administrador",
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
};

function ProfileShortcut({ description, href, icon, title }: ProfileShortcutProps) {
  return (
    <Link
      className="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900"
      href={href}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {icon}
        </span>

        <span className="min-w-0 flex-1 overflow-hidden">
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
      <section className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-5 overflow-x-hidden px-3 sm:px-4 lg:px-0">
        <article className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4 overflow-hidden">
              {avatarUrl ? (
                <button
                  aria-label="Visualizar foto de perfil"
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-100 text-2xl font-semibold text-emerald-700 hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  onClick={() => setIsPhotoPreviewOpen(true)}
                  title="Visualizar foto"
                  type="button"
                >
                  <Image
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                    height={64}
                    loading="eager"
                    src={avatarUrl}
                    width={64}
                  />
                </button>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-100 text-2xl font-semibold text-emerald-700 dark:border-slate-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {getInitial(user?.name) || (
                    <UserRound aria-hidden="true" size={30} strokeWidth={2.25} />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1 overflow-hidden">
                <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {user?.name || "Usuário"}
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {user?.email || "E-mail não informado."}
                </p>

                <span
                  className={cn(
                    "mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
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

                <div className="mt-3 flex flex-wrap gap-2">
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
                className: "w-full min-w-0 sm:w-auto",
                variant: "secondary",
              })}
              href="/perfil/editar"
            >
              <Pencil aria-hidden="true" size={16} strokeWidth={2.25} />
              Editar Perfil
            </Link>
          </div>
        </article>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {message ? <Alert variant="success">{message}</Alert> : null}

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Configurações
          </h2>

          <div className="mt-3 grid min-w-0 gap-3">
            <ProfileShortcut
              description="Salário, adiantamento e renda extra."
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

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Ajuda
          </h2>

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
          className="min-w-0 border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 focus-visible:ring-red-200 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
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
      />
    </>
  );
}

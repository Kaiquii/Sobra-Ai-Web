"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { buttonClassName, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function EditProfileView() {
  const clearFeedback = useAuthStore((state) => state.clearFeedback);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const message = useAuthStore((state) => state.message);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    return () => clearFeedback();
  }, [clearFeedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setValidationError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setValidationError("Nome e e-mail sao obrigatorios.");
      return;
    }

    try {
      await updateProfile({ email: trimmedEmail, name: trimmedName });
      router.replace("/perfil");
    } catch {
      // Feedback is handled by the auth store.
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Editar Perfil
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Dados da conta
            </h2>
          </div>
          <Link
            className={buttonClassName({ className: "self-start", variant: "secondary" })}
            href="/perfil"
          >
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
            Voltar
          </Link>
        </div>

        {validationError || error ? (
          <div className="mt-5">
            <Alert variant="error">{validationError ?? error}</Alert>
          </div>
        ) : null}

        {message ? (
          <div className="mt-5">
            <Alert>{message}</Alert>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
              id="profile-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              type="email"
              value={email}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link className={buttonClassName({ variant: "secondary" })} href="/perfil">
            Cancelar
          </Link>
          <Button disabled={isLoading} type="submit">
            <Save aria-hidden="true" size={16} strokeWidth={2.25} />
            {isLoading ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </div>
      </form>
    </section>
  );
}

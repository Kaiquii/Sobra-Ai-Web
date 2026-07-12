"use client";

import { ArrowRight, KeyRound, Mail, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { getApiErrorStatus } from "@/lib/api-errors";

type RecoveryStep = "email" | "reset" | "done";

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function PasswordRecoveryForm() {
  const { clearFeedback, error, forgotPassword, isLoading, message, resetPassword } =
    useAuthStore();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [step, setStep] = useState<RecoveryStep>("email");

  useEffect(() => {
    if (!resendCountdown) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendCountdown]);

  async function sendCode() {
    const trimmedEmail = email.trim();

    try {
      clearFeedback();
      setLocalError(null);
      setEmail(trimmedEmail);
      await forgotPassword({ email: trimmedEmail });
      setCode("");
      setResendCountdown(60);
      setStep("reset");
    } catch (requestError) {
      if (getApiErrorStatus(requestError) === 429) {
        setResendCountdown(60);
      }
    }
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendCode();
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setLocalError("Informe o código de 6 dígitos enviado para seu e-mail.");
      return;
    }

    try {
      setLocalError(null);
      await resetPassword({
        code,
        email: email.trim(),
        new_password: newPassword,
      });
      setStep("done");
    } catch {}
  }

  return (
    <Card className="w-full rounded-3xl border-emerald-500/20 bg-white/95 shadow-2xl shadow-slate-200/70 ring-1 ring-emerald-500/10 dark:border-emerald-400/15 dark:bg-slate-950/90 dark:shadow-black/25 dark:ring-emerald-400/10">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-2xl">Recuperar acesso</CardTitle>
        <CardDescription className="leading-6">
          Envie um código para o e-mail e cadastre uma nova senha.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        {step === "email" ? (
          <form className="space-y-4" onSubmit={handleSendCode}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoComplete="email"
                  className="h-10 bg-slate-50/80 pl-10 dark:bg-slate-900/70"
                  disabled={isLoading}
                  id="email"
                  name="email"
                  onChange={(event) => {
                    clearFeedback();
                    setLocalError(null);
                    setEmail(event.target.value);
                  }}
                  placeholder="voce@email.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            {error || localError ? <Alert variant="error">{localError ?? error}</Alert> : null}

            <Button
              className="h-10 w-full rounded-xl"
              disabled={isLoading || resendCountdown > 0}
              type="submit"
            >
              {isLoading
                ? "Enviando..."
                : resendCountdown > 0
                  ? `Aguarde ${resendCountdown}s`
                  : "Enviar código"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : null}

        {step === "reset" ? (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            {message ? <Alert variant="success">{message}</Alert> : null}

            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoComplete="one-time-code"
                  className="h-10 bg-slate-50/80 pl-10 text-center font-semibold tracking-[0.3em] dark:bg-slate-900/70"
                  disabled={isLoading}
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  name="code"
                  onChange={(event) => {
                    clearFeedback();
                    setLocalError(null);
                    setCode(normalizeCode(event.target.value));
                  }}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  required
                  type="text"
                  value={code}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <PasswordInput
                autoComplete="new-password"
                className="h-10 bg-slate-50/80 dark:bg-slate-900/70"
                disabled={isLoading}
                id="new-password"
                minLength={4}
                name="new-password"
                onChange={(event) => {
                  clearFeedback();
                  setLocalError(null);
                  setNewPassword(event.target.value);
                }}
                placeholder="Nova senha"
                required
                value={newPassword}
              />
            </div>

            {error || localError ? <Alert variant="error">{localError ?? error}</Alert> : null}

            <Button className="h-10 w-full rounded-xl" disabled={isLoading} type="submit">
              {isLoading ? "Atualizando..." : "Trocar senha"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <button
              className="mx-auto inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-600 disabled:opacity-60 dark:text-emerald-300 dark:hover:text-emerald-200"
              disabled={isLoading || resendCountdown > 0}
              onClick={() => {
                void sendCode();
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={15} />
              {resendCountdown > 0
                ? `Reenviar em ${resendCountdown}s`
                : "Reenviar código"}
            </button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="space-y-4">
            <Alert variant="success">{message ?? "Senha atualizada com sucesso!"}</Alert>
            <Link
              className={buttonClassName({ className: "h-10 w-full rounded-xl" })}
              href="/login"
            >
              Voltar para o login
            </Link>
          </div>
        ) : null}

        {step !== "done" ? (
          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
            Lembrou a senha?{" "}
            <Link
              className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              href="/login"
            >
              Entrar
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

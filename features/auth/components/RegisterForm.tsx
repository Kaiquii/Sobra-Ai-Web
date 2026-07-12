"use client";

import { ArrowLeft, ArrowRight, KeyRound, Mail, RotateCcw, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

type RegisterStep = "code" | "details";

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  const visiblePart = localPart.slice(0, Math.min(localPart.length, 2));
  const hiddenLength = Math.max(localPart.length - visiblePart.length, 3);

  return `${visiblePart}${"*".repeat(hiddenLength)}@${domain}`;
}

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function RegisterForm() {
  const router = useRouter();
  const {
    clearFeedback,
    error,
    isLoading,
    message,
    register,
    requestRegisterCode,
  } = useAuthStore();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isEmailRegistered, setIsEmailRegistered] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [step, setStep] = useState<RegisterStep>("details");

  useEffect(() => {
    if (!resendCountdown) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendCountdown]);

  async function requestCode() {
    const trimmedEmail = email.trim();

    try {
      clearFeedback();
      setIsEmailRegistered(false);
      setLocalError(null);
      setEmail(trimmedEmail);
      await requestRegisterCode({ email: trimmedEmail });
      setCode("");
      setResendCountdown(60);
      setStep("code");
    } catch (requestError) {
      const status = getApiErrorStatus(requestError);

      if (status === 409) {
        setIsEmailRegistered(true);
      }

      if (status === 429) {
        setResendCountdown(60);
      }
    }
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setLocalError("Informe o código de 6 dígitos enviado para seu e-mail.");
      return;
    }

    try {
      setIsEmailRegistered(false);
      setLocalError(null);
      await register({ code, email: email.trim(), name: name.trim(), password });
      router.push("/login");
    } catch (registerError) {
      if (getApiErrorStatus(registerError) === 409) {
        setIsEmailRegistered(true);
      }
    }
  }

  function handleChangeEmail() {
    clearFeedback();
    setCode("");
    setIsEmailRegistered(false);
    setLocalError(null);
    setResendCountdown(0);
    setStep("details");
  }

  return (
    <Card className="w-full rounded-3xl border-emerald-500/20 bg-white/95 shadow-2xl shadow-slate-200/70 ring-1 ring-emerald-500/10 dark:border-emerald-400/15 dark:bg-slate-950/90 dark:shadow-black/25 dark:ring-emerald-400/10">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-2xl">
          {step === "details" ? "Criar conta" : "Confirme seu e-mail"}
        </CardTitle>
        <CardDescription className="leading-6">
          {step === "details"
            ? "Informe seus dados e enviaremos um código de confirmação."
            : `Enviamos um código de 6 dígitos para ${maskEmail(email)}.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        {step === "details" ? (
          <form className="space-y-4" onSubmit={handleRequestCode}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoComplete="name"
                  className="h-10 bg-slate-50/80 pl-10 dark:bg-slate-900/70"
                  disabled={isLoading}
                  id="name"
                  name="name"
                  onChange={(event) => {
                    clearFeedback();
                    setIsEmailRegistered(false);
                    setName(event.target.value);
                  }}
                  placeholder="Seu nome"
                  required
                  type="text"
                  value={name}
                />
              </div>
            </div>

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
                    setIsEmailRegistered(false);
                    setEmail(event.target.value);
                  }}
                  placeholder="voce@email.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                autoComplete="new-password"
                className="h-10 bg-slate-50/80 dark:bg-slate-900/70"
                disabled={isLoading}
                id="password"
                minLength={4}
                name="password"
                onChange={(event) => {
                  clearFeedback();
                  setIsEmailRegistered(false);
                  setPassword(event.target.value);
                }}
                placeholder="Crie uma senha"
                required
                value={password}
              />
            </div>

            {error || localError ? <Alert variant="error">{localError ?? error}</Alert> : null}

            {isEmailRegistered ? (
              <Link
                className="block text-center text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                href="/login"
              >
                Este e-mail já tem conta. Entrar
              </Link>
            ) : null}

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
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            {message ? <Alert variant="success">{message}</Alert> : null}

            <div className="space-y-2">
              <Label htmlFor="register-code">Código de confirmação</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoComplete="one-time-code"
                  className="h-12 bg-slate-50/80 pl-10 text-center text-lg font-semibold tracking-[0.35em] dark:bg-slate-900/70"
                  disabled={isLoading}
                  id="register-code"
                  inputMode="numeric"
                  maxLength={6}
                  name="code"
                  onChange={(event) => {
                    clearFeedback();
                    setIsEmailRegistered(false);
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

            {error || localError ? <Alert variant="error">{localError ?? error}</Alert> : null}

            {isEmailRegistered ? (
              <Link
                className="block text-center text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                href="/login"
              >
                Este e-mail já tem conta. Entrar
              </Link>
            ) : null}

            <Button className="h-10 w-full rounded-xl" disabled={isLoading} type="submit">
              {isLoading ? "Confirmando..." : "Criar conta"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-100"
                disabled={isLoading}
                onClick={handleChangeEmail}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={15} />
                Alterar e-mail
              </button>
              <button
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-600 disabled:opacity-60 dark:text-emerald-300 dark:hover:text-emerald-200"
                disabled={isLoading || resendCountdown > 0}
                onClick={() => {
                  void requestCode();
                }}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={15} />
                {resendCountdown > 0
                  ? `Reenviar em ${resendCountdown}s`
                  : "Reenviar código"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
          Já tem uma conta?{" "}
          <Link
            className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            href="/login"
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

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

type RecoveryStep = "email" | "reset" | "done";

export function PasswordRecoveryForm() {
  const { clearFeedback, error, forgotPassword, isLoading, message, resetPassword } =
    useAuthStore();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<RecoveryStep>("email");

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();

    try {
      setEmail(trimmedEmail);
      await forgotPassword({ email: trimmedEmail });
      setStep("reset");
    } catch {}
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await resetPassword({
        code: code.trim(),
        email: email.trim(),
        new_password: newPassword.trim(),
      });
      setStep("done");
    } catch {}
  }

  return (
    <Card className="w-full rounded-3xl border-emerald-500/20 bg-white/95 shadow-2xl shadow-slate-200/70 ring-1 ring-emerald-500/10 dark:border-emerald-400/15 dark:bg-slate-950/90 dark:shadow-black/25 dark:ring-emerald-400/10">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-2xl">Recuperar acesso</CardTitle>
        <CardDescription className="leading-6">
          Envie o código para o e-mail e cadastre uma nova senha.
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
                    setEmail(event.target.value);
                  }}
                  placeholder="voce@email.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button className="h-10 w-full rounded-xl" disabled={isLoading} type="submit">
              {isLoading ? "Enviando..." : "Enviar código"}
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
                  className="h-10 bg-slate-50/80 pl-10 dark:bg-slate-900/70"
                  disabled={isLoading}
                  id="code"
                  inputMode="numeric"
                  name="code"
                  onChange={(event) => {
                    clearFeedback();
                    setCode(event.target.value);
                  }}
                  placeholder="000000"
                  required
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
                  setNewPassword(event.target.value);
                }}
                placeholder="Nova senha"
                required
                value={newPassword}
              />
            </div>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button className="h-10 w-full rounded-xl" disabled={isLoading} type="submit">
              {isLoading ? "Atualizando..." : "Trocar senha"}
              <ArrowRight className="h-4 w-4" />
            </Button>
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

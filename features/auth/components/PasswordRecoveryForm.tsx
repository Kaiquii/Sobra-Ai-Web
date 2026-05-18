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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recuperar acesso</CardTitle>
        <CardDescription>
          Envie o código para o e-mail e cadastre uma nova senha.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "email" ? (
          <form className="space-y-5" onSubmit={handleSendCode}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoComplete="email"
                  className="pl-10"
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

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? "Enviando..." : "Enviar código"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : null}

        {step === "reset" ? (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            {message ? <Alert variant="success">{message}</Alert> : null}

            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoComplete="one-time-code"
                  className="pl-10"
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

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? "Atualizando..." : "Trocar senha"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="space-y-5">
            <Alert variant="success">{message ?? "Senha atualizada com sucesso!"}</Alert>
            <Link
              className={buttonClassName({ className: "w-full" })}
              href="/login"
            >
              Voltar para o login
            </Link>
          </div>
        ) : null}

        {step !== "done" ? (
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
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

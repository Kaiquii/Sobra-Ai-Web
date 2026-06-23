"use client";

import { ArrowRight, Mail } from "lucide-react";
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

export function LoginForm() {
  const router = useRouter();
  const {
    clearFeedback,
    error,
    hasHydrated,
    isAuthenticated,
    isLoading,
    login,
  } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/home");
    }
  }, [hasHydrated, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login({ email: email.trim(), password: password.trim() });
      router.push("/home");
    } catch {}
  }

  return (
    <Card className="w-full rounded-3xl border-emerald-500/20 bg-white/95 shadow-2xl shadow-slate-200/70 ring-1 ring-emerald-500/10 dark:border-emerald-400/15 dark:bg-slate-950/90 dark:shadow-black/25 dark:ring-emerald-400/10">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription className="leading-6">
          Use seu e-mail e senha para acessar o painel.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">Senha</Label>
              <Link
                className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                href="/forget-password"
              >
                Recuperar acesso
              </Link>
            </div>
            <PasswordInput
              autoComplete="current-password"
              className="h-10 bg-slate-50/80 dark:bg-slate-900/70"
              disabled={isLoading}
              id="password"
              name="password"
              onChange={(event) => {
                clearFeedback();
                setPassword(event.target.value);
              }}
              placeholder="Sua senha"
              required
              value={password}
            />
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <Button className="h-10 w-full rounded-xl" disabled={isLoading} type="submit">
            {isLoading ? "Entrando..." : "Entrar"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
          Ainda não tem conta?{" "}
          <Link
            className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            href="/register"
          >
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

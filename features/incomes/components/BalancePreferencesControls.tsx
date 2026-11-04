"use client";

import { CircleHelp, Loader2, Wallet } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ModalPanel } from "@/components/ui/modal-panel";
import { Switch } from "@/components/ui/switch";
import { useBalancePreferencesStore } from "@/features/incomes/store/useBalancePreferencesStore";
import type { BalancePreferenceKey } from "@/features/incomes/types/balancePreferences";
import { cn } from "@/lib/utils";

const options = [
  {
    key: "exclude_va_from_available",
    title: "Excluir VA do disponível",
    subtitle: "Vale-alimentação",
  },
  {
    key: "exclude_vr_from_available",
    title: "Excluir VR do disponível",
    subtitle: "Vale-refeição",
  },
] as const;

export function BalancePreferencesControls() {
  const descriptionId = useId();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const preferences = useBalancePreferencesStore((state) => state.preferences);
  const isLoading = useBalancePreferencesStore((state) => state.isLoading);
  const isSaving = useBalancePreferencesStore((state) => state.isSaving);
  const pendingKey = useBalancePreferencesStore((state) => state.pendingKey);
  const sessionRevision = useBalancePreferencesStore((state) => state.sessionRevision);
  const loadError = useBalancePreferencesStore((state) => state.loadError);
  const saveError = useBalancePreferencesStore((state) => state.saveError);
  const needsReconciliation = useBalancePreferencesStore((state) => state.needsReconciliation);
  const loadPreferences = useBalancePreferencesStore((state) => state.loadPreferences);
  const setPreference = useBalancePreferencesStore((state) => state.setPreference);
  const busy = isLoading || isSaving;
  const initialLoading = isLoading && !preferences;
  const backgroundLoading = isLoading && !!preferences && !isSaving;
  const disabled = busy || !!loadError || needsReconciliation;
  const focusAfterSave = useRef<{ element: HTMLElement; session: number } | null>(null);

  useEffect(() => {
    const state = useBalancePreferencesStore.getState();
    if (!state.loadError && !state.needsReconciliation) void loadPreferences();
  }, [loadPreferences, sessionRevision]);

  useEffect(() => {
    if (busy) return;
    const previous = focusAfterSave.current;
    focusAfterSave.current = null;
    if (
      previous?.session === sessionRevision &&
      previous.element.isConnected &&
      (document.activeElement === document.body || document.activeElement === previous.element)
    ) {
      previous.element.focus({ preventScroll: true });
    }
  }, [busy, sessionRevision]);

  function changePreference(key: BalancePreferenceKey, checked: boolean) {
    if (disabled) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.getAttribute("role") === "switch") {
      focusAfterSave.current = { element: focused, session: sessionRevision };
    }
    void setPreference(key, checked);
  }

  return (
    <>
      <fieldset
        aria-busy={busy}
        aria-describedby={descriptionId}
        aria-label="Saldo disponível"
        className="min-w-0 lg:col-span-3"
      >
        <legend className="w-full">
          <span className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-slate-950 dark:text-slate-50 sm:text-lg sm:font-semibold">
              Saldo disponível
            </span>
            <Button
              aria-label="Como funciona o saldo disponível"
              aria-haspopup="dialog"
              aria-expanded={isHelpOpen}
              className="h-12 w-12 shrink-0 enabled:text-brand max-sm:rounded-full dark:enabled:text-brand sm:h-9 sm:w-9"
              size="icon"
              variant="ghost"
              onClick={() => setIsHelpOpen(true)}
              title="Como funciona o saldo disponível"
            >
              <CircleHelp aria-hidden="true" size={22} />
            </Button>
          </span>
        </legend>
        <p
          id={descriptionId}
          className="mb-3 mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400"
        >
          Escolha se o saldo restante de VA e VR entra no Total Geral Disponível.
        </p>
        {loadError || saveError ? (
          <div className="mb-3 space-y-2">
            <Alert variant="error">{loadError ?? saveError}</Alert>
            {loadError || needsReconciliation ? (
              <Button variant="secondary" disabled={busy} onClick={() => void loadPreferences()}>
                Tentar novamente
              </Button>
            ) : null}
          </div>
        ) : null}
        {initialLoading || isSaving ? (
          <p role="status" className="sr-only">
            {isSaving ? "Salvando preferência..." : "Carregando preferências..."}
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {options.map((option) => (
            <label
              key={option.key}
              htmlFor={`${descriptionId}-${option.key}`}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-lg sm:p-4",
                disabled || !preferences ? "cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 sm:h-10 sm:w-10 sm:rounded-lg">
                <Wallet aria-hidden="true" size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block wrap-anywhere text-base font-semibold text-slate-950 dark:text-slate-50 sm:text-sm">
                  {option.title}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {option.subtitle}
                </span>
              </span>
              {preferences ? (
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <Switch
                    id={`${descriptionId}-${option.key}`}
                    ariaLabel={option.title}
                    checked={preferences[option.key]}
                    disabled={disabled}
                    className={cn(
                      "min-h-12 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      pendingKey === option.key && "invisible",
                      backgroundLoading && "disabled:opacity-100!",
                    )}
                    onCheckedChange={(checked) => changePreference(option.key, checked)}
                  />
                  {pendingKey === option.key ? (
                    <Loader2
                      aria-hidden="true"
                      className="absolute animate-spin text-brand"
                      size={24}
                    />
                  ) : null}
                </span>
              ) : busy ? (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                  <Loader2 aria-hidden="true" className="animate-spin text-brand" size={24} />
                </span>
              ) : (
                <span
                  aria-label="Preferência indisponível"
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400"
                >
                  —
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      {isHelpOpen ? (
        <ModalPanel title="Como funciona o saldo disponível" onClose={() => setIsHelpOpen(false)}>
          <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>
              As duas opções mudam apenas o{" "}
              <strong className="font-semibold text-slate-950 dark:text-slate-50">
                Total Geral Disponível
              </strong>
              , para você escolher se quer contar o saldo dos benefícios como dinheiro disponível no
              mês.
            </p>
            <dl className="space-y-3">
              <div>
                <dt className="font-semibold text-slate-950 dark:text-slate-50">Ao ativar</dt>
                <dd>
                  O saldo que ainda resta no benefício escolhido fica fora do total disponível.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950 dark:text-slate-50">Ao desativar</dt>
                <dd>O restante daquele benefício volta a entrar no total.</dd>
              </div>
            </dl>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-slate-200">
              <p className="font-semibold text-slate-950 dark:text-slate-50">Um exemplo com VA</p>
              <p className="mt-1">
                VA de R$ 725, com R$ 600 já gastos: restam <strong>R$ 125</strong>. Ativar a opção
                retira apenas esses R$ 125 do disponível, sem descontar os R$ 600 novamente.
              </p>
            </div>
            <p>
              Isso não altera nem apaga rendas, despesas ou os cartões de VA e VR. O Total Recebido
              e o Total Gasto continuam iguais.
            </p>
            <p>
              A escolha vale para todos os meses e dispositivos da sua conta. VA e VR podem ser
              configurados separadamente.
            </p>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              variant="secondary"
              className="max-sm:w-full"
              onClick={() => setIsHelpOpen(false)}
            >
              Entendi
            </Button>
          </div>
        </ModalPanel>
      ) : null}
    </>
  );
}

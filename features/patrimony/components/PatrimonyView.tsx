"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Plus, Shapes } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AppNotification } from "@/components/ui/app-notification";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { usePatrimonyStore } from "../store/usePatrimonyStore";
import { InvestmentCategoriesDialog } from "./InvestmentCategoriesDialog";
import { PatrimonyCard, PatrimonyTotals } from "./PatrimonyCards";
import { PatrimonyEditor, type PatrimonyEditing } from "./PatrimonyEditor";
import { PatrimonyError } from "./PatrimonyFeedback";

export function PatrimonyView() {
  const router = useRouter();
  const state = usePatrimonyStore();
  const account = useAuthStore((auth) => auth.user?.email);
  const [editor, setEditor] = useState<PatrimonyEditing | null>(null);
  const [categories, setCategories] = useState(false);
  const enabled =
    Boolean(state.data) && !state.error && !state.loading && !state.saving && !state.needsReview;
  useEffect(() => {
    const store = usePatrimonyStore.getState();
    void store.load();
    void store.loadCategories();
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void store.load();
        void store.loadCategories();
      }
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [account]);
  const open = (value: PatrimonyEditing) => {
    state.clearMutationError();
    setEditor(value);
  };
  return (
    <section className="mx-auto grid w-full max-w-3xl gap-3 sm:max-w-6xl sm:gap-5">
      <div className="hidden sm:block">
        <PageHeader
          title="Patrimônio"
          description="Acompanhe seu FGTS e seus investimentos, separados do saldo do mês."
          actions={
            <Button
              variant="secondary"
              onClick={() =>
                router.replace(
                  new URLSearchParams(window.location.search).get("origem") === "perfil"
                    ? "/perfil"
                    : "/inicio",
                )
              }
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Voltar
            </Button>
          }
        />
      </div>
      {state.error ? (
        <PatrimonyError
          message={state.error}
          stale={Boolean(state.data)}
          loading={state.loading}
          onRetry={() => {
            void state.reconcile();
          }}
        />
      ) : null}
      {state.notice && state.needsReview ? (
        <p
          role="status"
          className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
        >
          {state.notice}
        </p>
      ) : null}
      <AppNotification
        key={state.notice ?? "none"}
        message={state.needsReview ? null : state.notice}
        tone={state.noticeTone}
      />
      {state.needsReview && !state.error ? (
        <Button
          variant="secondary"
          disabled={state.loading || state.categoriesLoading}
          onClick={() => {
            void state.reconcile();
          }}
        >
          Conferir dados antes de continuar
        </Button>
      ) : null}
      <PatrimonyTotals data={state.data} />
      {!state.data && state.loading ? (
        <div
          role="status"
          className="flex min-h-30 items-center justify-center gap-2 text-sm text-slate-500"
        >
          <LoaderCircle aria-hidden="true" size={28} className="animate-spin" />
          Carregando patrimônio…
        </div>
      ) : null}
      {state.data ? (
        <>
          <PatrimonyCard
            title="FGTS"
            amount={state.data.fgts?.amount}
            updatedAt={state.data.fgts?.updated_at}
            disabled={!enabled}
            onClick={() => open({ kind: "fgts", balance: state.data!.fgts })}
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
            <h2 className="min-w-0 flex-1 text-base font-bold sm:text-lg sm:font-semibold">
              Investimentos
            </h2>
            {state.supported === true ? (
              <Button
                variant="secondary"
                className="max-sm:h-auto max-sm:min-h-12 max-sm:rounded-full max-sm:border-0 max-sm:bg-transparent max-sm:px-3 max-sm:text-brand max-sm:dark:bg-transparent max-sm:dark:text-brand"
                disabled={state.saving}
                onClick={() => {
                  state.clearMutationError();
                  setCategories(true);
                }}
              >
                <Shapes aria-hidden="true" size={16} className="max-sm:hidden" />
                Categorias
              </Button>
            ) : null}
            <Button
              disabled={!enabled}
              className="max-sm:h-auto max-sm:min-h-10 max-sm:rounded-full max-sm:bg-brand/14 max-sm:px-3.5 max-sm:text-brand max-sm:hover:bg-brand/20 max-sm:dark:bg-brand/14 max-sm:dark:text-brand max-sm:dark:hover:bg-brand/20"
              onClick={() => open({ kind: "investment" })}
            >
              <Plus aria-hidden="true" size={18} />
              Adicionar
            </Button>
          </div>
          {state.data.investments.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {state.data.investments.map((investment) => (
                <PatrimonyCard
                  key={investment.id}
                  title={investment.name}
                  category={investment.category}
                  amount={investment.amount}
                  updatedAt={investment.updated_at}
                  investment
                  disabled={!enabled}
                  onClick={() => open({ kind: "investment", investment })}
                />
              ))}
            </div>
          ) : (
            <PatrimonyCard
              title="Seu primeiro investimento"
              category="Nome, categoria e saldo atual"
              investment
              disabled={!enabled}
              onClick={() => open({ kind: "investment" })}
            />
          )}
        </>
      ) : null}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Saldos informados por você, separados do saldo do mês.
      </p>
      {editor ? (
        <PatrimonyEditor
          key={account}
          editor={editor}
          onClose={() => {
            setEditor(null);
            usePatrimonyStore.getState().clearMutationError();
          }}
        />
      ) : null}
      {categories ? (
        <InvestmentCategoriesDialog
          onClose={() => {
            setCategories(false);
            usePatrimonyStore.getState().clearMutationError();
          }}
        />
      ) : null}
    </section>
  );
}

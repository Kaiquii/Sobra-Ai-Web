"use client";

import { useEffect, useState } from "react";
import { Landmark, Plus, Settings2, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { ModalPanel } from "@/components/ui/modal-panel";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { usePatrimonyStore } from "../store/usePatrimonyStore";
import type { FgtsBalance, Investment, InvestmentCategory } from "../types/patrimony";
import { amountInput } from "../utils/patrimonyMoney";
import {
  InvestmentCategoriesDialog,
  InvestmentCategoryNameDialog,
} from "./InvestmentCategoriesDialog";
import { PatrimonyIcon } from "./PatrimonyCards";
import { PatrimonyError } from "./PatrimonyFeedback";

export type PatrimonyEditing =
  | { kind: "fgts"; balance: FgtsBalance | null }
  | { kind: "investment"; investment?: Investment };

export function PatrimonyEditor({
  editor,
  onClose,
}: {
  editor: PatrimonyEditing;
  onClose: () => void;
}) {
  const state = usePatrimonyStore();
  const investment = editor.kind === "investment" ? editor.investment : undefined;
  const original = editor.kind === "fgts" ? editor.balance : investment;
  const [name, setName] = useState(investment?.name ?? "");
  const [amount, setAmount] = useState(original ? amountInput(original.amount) : "");
  const [categoryId, setCategoryId] = useState(
    investment?.category_id ? String(investment.category_id) : "",
  );
  const [legacyCategory, setLegacyCategory] = useState(investment?.category ?? "");
  const [manager, setManager] = useState(false);
  const [newCategory, setNewCategory] = useState(false);
  const [deletion, setDeletion] = useState(false);
  const isFgts = editor.kind === "fgts";
  const title = isFgts
    ? "Saldo do FGTS"
    : investment
      ? "Atualizar investimento"
      : "Novo investimento";
  const currentCategoryId =
    categoryId ||
    String(
      state.categories.find(
        (item) => item.name.toLocaleLowerCase() === legacyCategory.toLocaleLowerCase(),
      )?.id ?? "",
    );
  const blocked = state.saving || state.loading || state.needsReview || Boolean(state.error);
  const categoryBlocked =
    state.categoriesLoading || Boolean(state.categoriesError) || state.supported === null;
  const categoryReady =
    isFgts ||
    (!categoryBlocked &&
      (state.supported === false ||
        state.categories.some((item) => String(item.id) === currentCategoryId)));
  useEffect(() => {
    if (!isFgts) void usePatrimonyStore.getState().loadCategories();
  }, [isFgts]);
  function created(category: InvestmentCategory) {
    setCategoryId(String(category.id));
    setLegacyCategory(category.name);
  }
  return (
    <>
      <ModalPanel
        title={title}
        sheet
        busy={state.saving}
        onClose={onClose}
        icon={<PatrimonyIcon icon={isFgts ? Landmark : TrendingUp} investment={!isFgts} large />}
      >
        <form
          className="grid gap-3.5 sm:gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await state.write(
              isFgts
                ? { kind: "fgts", amount }
                : {
                    kind: "investment",
                    id: investment?.id,
                    draft: {
                      name,
                      amount,
                      ...(state.supported === true
                        ? { categoryId: Number(currentCategoryId) }
                        : { category: legacyCategory }),
                    },
                  },
            );
            if (result.outcome !== "error") onClose();
          }}
        >
          {state.notice && state.noticeTone === "info" ? (
            <p
              role="status"
              className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
            >
              {state.notice}
            </p>
          ) : null}
          {!isFgts ? (
            <>
              <label className="grid gap-2 text-sm font-medium">
                Nome do investimento
                <Input
                  value={name}
                  disabled={state.saving}
                  className="rounded-xl sm:rounded-md"
                  placeholder="Ex.: Minha reserva"
                  enterKeyHint="next"
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      document.getElementById("patrimony-category")?.focus();
                    }
                  }}
                />
              </label>
              {state.categoriesError ? (
                <PatrimonyError
                  message={state.categoriesError}
                  loading={state.categoriesLoading}
                  onRetry={() => {
                    void state.loadCategories(true);
                  }}
                />
              ) : null}
              {state.supported === false ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Categoria
                    <Input
                      id="patrimony-category"
                      value={legacyCategory}
                      disabled={state.saving || categoryBlocked}
                      className="rounded-xl sm:rounded-md"
                      onChange={(event) => setLegacyCategory(event.target.value)}
                      enterKeyHint="next"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          document.getElementById("patrimony-amount")?.focus();
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    O catálogo ainda não está disponível. Você pode informar a categoria por
                    enquanto.
                  </p>
                </>
              ) : (
                <div className="grid gap-2">
                  <label htmlFor="patrimony-category" className="text-sm font-medium">
                    Categoria
                  </label>
                  {state.categoriesLoading ? (
                    <p role="status" className="text-xs text-slate-500">
                      Carregando categorias…
                    </p>
                  ) : null}
                  <DropdownSelect
                    id="patrimony-category"
                    ariaLabel="Categoria do investimento"
                    sheetTitle="Categoria"
                    value={currentCategoryId}
                    triggerLabel={
                      state.categories.find((item) => String(item.id) === currentCategoryId)
                        ?.name ?? "Selecione a categoria"
                    }
                    options={state.categories.map((item) => ({
                      value: String(item.id),
                      label: item.name,
                    }))}
                    onChange={setCategoryId}
                    disabled={state.saving || categoryBlocked}
                    triggerClassName="min-h-12 sm:min-h-10 sm:rounded-md"
                    trailingAction={
                      <Button
                        variant="ghost"
                        aria-label="Nova categoria"
                        size="iconLg"
                        className="text-emerald-700 dark:text-emerald-400 sm:h-8 sm:w-8 sm:text-brand sm:hover:bg-brand/10 sm:focus-visible:ring-brand/30 sm:dark:text-brand sm:dark:hover:bg-brand/15"
                        disabled={blocked || categoryBlocked || state.supported !== true}
                        onClick={() => {
                          state.clearMutationError();
                          setNewCategory(true);
                        }}
                      >
                        <Plus aria-hidden="true" size={20} />
                      </Button>
                    }
                  />
                  {state.supported === true ? (
                    <Button
                      variant="secondary"
                      className="justify-self-start rounded-lg sm:w-full sm:gap-2.5 sm:border-blue-200 sm:bg-blue-50 sm:hover:bg-blue-100 sm:dark:border-blue-800 sm:dark:bg-blue-950 sm:dark:hover:bg-blue-900"
                      disabled={state.saving}
                      onClick={() => {
                        state.clearMutationError();
                        setManager(true);
                      }}
                    >
                      <Settings2 aria-hidden="true" className="sm:text-brand" size={16} />
                      Gerenciar categorias
                    </Button>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
          <label htmlFor="patrimony-amount" className="grid gap-2 text-sm font-medium">
            Saldo atual
            <span className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-slate-500"
              >
                R$
              </span>
              <Input
                aria-label="Saldo atual em reais"
                id="patrimony-amount"
                value={amount}
                disabled={state.saving}
                className="h-12 rounded-xl pl-10 sm:h-11 sm:rounded-md"
                placeholder="0,00"
                inputMode="decimal"
                enterKeyHint="done"
                onChange={(event) => setAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              />
            </span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {original
              ? "Informe o valor total que você tem hoje. Ele substitui o saldo anterior."
              : "Informe o valor total que você tem hoje. Você pode atualizar depois."}
          </p>
          {state.mutationError && !deletion && !newCategory && !manager ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {state.mutationError}
            </p>
          ) : null}
          <div className="grid gap-3.5 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 sm:pt-1">
            {original ? (
              <Button
                variant="ghost"
                className="order-2 h-auto min-h-12 text-red-600 dark:text-red-300 sm:order-0 sm:mr-auto sm:min-h-11"
                disabled={blocked}
                onClick={() => {
                  state.clearMutationError();
                  setDeletion(true);
                }}
              >
                <Trash2 aria-hidden="true" size={18} />
                <span className="sm:hidden">
                  {isFgts ? "Remover saldo do FGTS" : "Excluir investimento"}
                </span>
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            ) : null}
            <Button
              variant="secondary"
              className="max-sm:hidden"
              disabled={state.saving}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={blocked || !categoryReady}
              className="order-1 h-auto min-h-13 w-full rounded-[14px] py-3 max-sm:bg-brand max-sm:text-white max-sm:hover:bg-brand-hover max-sm:dark:bg-brand max-sm:dark:text-white max-sm:dark:hover:bg-brand-hover sm:order-0 sm:h-11 sm:min-h-11 sm:w-auto sm:rounded-md sm:py-0"
            >
              <span className="sm:hidden">
                {state.saving
                  ? "Salvando…"
                  : isFgts
                    ? "Salvar saldo do FGTS"
                    : investment
                      ? "Salvar alterações"
                      : "Adicionar investimento"}
              </span>
              <span className="hidden sm:inline">{state.saving ? "Salvando…" : "Salvar"}</span>
            </Button>
          </div>
        </form>
      </ModalPanel>
      {manager ? (
        <InvestmentCategoriesDialog
          onClose={() => {
            state.clearMutationError();
            setManager(false);
          }}
          onCreated={created}
        />
      ) : null}
      {newCategory ? (
        <InvestmentCategoryNameDialog
          onClose={() => {
            state.clearMutationError();
            setNewCategory(false);
          }}
          onCreated={created}
        />
      ) : null}
      {deletion ? (
        <ConfirmationDialog
          isOpen
          nativeModal
          tone="danger"
          confirmLabel="Excluir"
          title={isFgts ? "Remover saldo do FGTS?" : "Excluir investimento?"}
          description={
            isFgts
              ? "O saldo informado do FGTS será removido. Seu saldo do mês não será alterado."
              : `O investimento “${investment?.name}” será excluído. Seu saldo do mês não será alterado.`
          }
          isSubmitting={state.saving}
          onClose={() => {
            state.clearMutationError();
            setDeletion(false);
          }}
          onConfirm={async () => {
            const result = await state.write(
              isFgts ? { kind: "deleteFgts" } : { kind: "deleteInvestment", id: investment!.id },
            );
            if (result.outcome !== "error") onClose();
          }}
        >
          {state.mutationError ? (
            <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
              {state.mutationError}
            </p>
          ) : null}
        </ConfirmationDialog>
      ) : null}
    </>
  );
}

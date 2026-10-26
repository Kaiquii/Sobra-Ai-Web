"use client";

import { useState } from "react";
import { LockKeyhole, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalPanel } from "@/components/ui/modal-panel";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { usePatrimonyStore } from "../store/usePatrimonyStore";
import type { InvestmentCategory } from "../types/patrimony";
import { PatrimonyError } from "./PatrimonyFeedback";

export function InvestmentCategoryNameDialog({
  category,
  onClose,
  onCreated,
}: {
  category?: InvestmentCategory;
  onClose: () => void;
  onCreated?: (category: InvestmentCategory) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const saving = usePatrimonyStore((state) => state.saving);
  const error = usePatrimonyStore((state) => state.mutationError);
  const state = usePatrimonyStore();
  const blocked =
    saving ||
    state.loading ||
    state.categoriesLoading ||
    state.needsReview ||
    Boolean(state.error || state.categoriesError);
  return (
    <ModalPanel
      title={category ? "Renomear categoria" : "Nova categoria"}
      onClose={onClose}
      busy={saving}
    >
      <form
        className="grid gap-3.5"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await state.write({ kind: "category", id: category?.id, name });
          if (!category && result.outcome === "saved" && result.category)
            onCreated?.(result.category);
          if (result.outcome !== "error") onClose();
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Nome da categoria
          <Input
            className="rounded-xl sm:rounded-md"
            value={name}
            disabled={saving}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Minha reserva"
            enterKeyHint="done"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {category
            ? "O novo nome também aparecerá nos investimentos que usam esta categoria."
            : "Esta categoria será pessoal e ficará disponível nos seus investimentos."}
        </p>
        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={blocked}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </ModalPanel>
  );
}

export function InvestmentCategoriesDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (category: InvestmentCategory) => void;
}) {
  const state = usePatrimonyStore();
  const [editor, setEditor] = useState<{ category?: InvestmentCategory } | null>(null);
  const [deletion, setDeletion] = useState<InvestmentCategory | null>(null);
  const blocked =
    state.saving ||
    state.loading ||
    state.categoriesLoading ||
    state.needsReview ||
    Boolean(state.error || state.categoriesError) ||
    state.supported !== true;
  return (
    <>
      <ModalPanel
        title="Categorias de investimentos"
        onClose={onClose}
        busy={state.saving}
        className="h-[min(600px,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-48px))]"
        headerActions={
          <div className="grid gap-2">
            <p className="patrimony-category-help text-xs text-slate-500 dark:text-slate-400">
              Organize seus investimentos. Categorias padrão são protegidas.
            </p>
            <Button
              className="w-full rounded-xl"
              disabled={blocked}
              onClick={() => {
                state.clearMutationError();
                setEditor({});
              }}
            >
              <Plus aria-hidden="true" size={18} />
              Nova categoria
            </Button>
            {state.notice && state.noticeTone === "info" ? (
              <p
                role="status"
                className="max-h-24 overflow-y-auto rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
              >
                {state.notice}
              </p>
            ) : null}
            {state.categoriesError ? (
              <div className="max-h-24 overflow-y-auto">
                <PatrimonyError
                  message={state.categoriesError}
                  stale={state.categories.length > 0}
                  loading={state.categoriesLoading}
                  onRetry={() => {
                    void state.reconcile();
                  }}
                />
              </div>
            ) : null}
            {state.mutationError && !editor && !deletion ? (
              <p
                role="alert"
                className="max-h-16 overflow-y-auto text-sm text-red-700 dark:text-red-300"
              >
                {state.mutationError}
              </p>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-2">
          {state.categoriesLoading ? (
            <p role="status" className="text-sm text-slate-500">
              Carregando categorias…
            </p>
          ) : null}
          {[false, true].map((isDefault) => {
            const categories = state.categories.filter(
              (category) => category.is_default === isDefault,
            );
            return categories.length ? (
              <section key={String(isDefault)} className="grid gap-2">
                <h3 className="px-1 pt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {isDefault ? "Categorias padrão" : "Minhas categorias"}
                </h3>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex min-h-14 items-center gap-1 rounded-xl bg-slate-100 py-1 pl-3 pr-1 dark:bg-slate-950"
                  >
                    <div className="min-w-0 flex-1 py-1">
                      <p className="wrap-anywhere text-base">{category.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isDefault ? "Padrão · protegida" : "Pessoal"}
                      </p>
                    </div>
                    {isDefault ? (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                        <LockKeyhole aria-label="Categoria padrão protegida" size={18} />
                      </span>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="iconLg"
                          aria-label={`Renomear categoria ${category.name}`}
                          disabled={blocked}
                          onClick={() => {
                            state.clearMutationError();
                            setEditor({ category });
                          }}
                        >
                          <Pencil aria-hidden="true" size={20} className="text-brand" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconLg"
                          aria-label={`Excluir categoria ${category.name}`}
                          disabled={blocked}
                          onClick={() => {
                            state.clearMutationError();
                            setDeletion(category);
                          }}
                        >
                          <Trash2
                            aria-hidden="true"
                            size={20}
                            className="text-red-600 dark:text-red-300"
                          />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </section>
            ) : null;
          })}
          {!state.categoriesLoading && !state.categoriesError && !state.categories.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma categoria disponível. Crie a primeira categoria para começar.
            </p>
          ) : null}
        </div>
      </ModalPanel>
      {editor ? (
        <InvestmentCategoryNameDialog
          category={editor.category}
          onClose={() => {
            setEditor(null);
            state.clearMutationError();
          }}
          onCreated={onCreated}
        />
      ) : null}
      {deletion ? (
        <ConfirmationDialog
          isOpen
          nativeModal
          tone="danger"
          confirmLabel="Excluir"
          title="Excluir categoria?"
          description={`Excluir a categoria “${deletion.name}”? Se estiver em uso, troque a categoria dos investimentos antes. Seus investimentos não serão excluídos.`}
          isSubmitting={state.saving}
          onClose={() => {
            setDeletion(null);
            state.clearMutationError();
          }}
          onConfirm={async () => {
            const result = await state.write({ kind: "deleteCategory", id: deletion.id });
            if (result.outcome !== "error") setDeletion(null);
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

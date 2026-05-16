"use client";

import { ArrowLeft, Pencil, Plus, RefreshCcw, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { buttonClassName, Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLockBodyScroll } from "@/components/ui/use-lock-body-scroll";
import { useExpenseStore } from "@/features/expenses/store/useExpenseStore";
import type { Category } from "@/features/expenses/types/expense";
import { EditCategoryDialogProps } from "../types/profile";

function EditCategoryDialog({
  category,
  isSubmitting,
  onClose,
  onSave,
}: EditCategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const isOpen = Boolean(category);

  useLockBodyScroll(isOpen);

  if (!category) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError("Informe o nome da categoria.");
      return;
    }

    await onSave(trimmedName);
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <form
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Editar categoria
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Atualize o nome usado nas despesas.
            </p>
          </div>
          <Button
            aria-label="Fechar"
            onClick={onClose}
            size="iconSm"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" size={17} strokeWidth={2.25} />
          </Button>
        </div>

        {validationError ? (
          <div className="mt-4">
            <Alert variant="error">{validationError}</Alert>
          </div>
        ) : null}

        <div className="mt-5 space-y-2">
          <Label htmlFor="edit-category-name">Nome</Label>
          <Input
            id="edit-category-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={isSubmitting} type="submit">
            <Save aria-hidden="true" size={16} strokeWidth={2.25} />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CategoriesManagerView() {
  const categories = useExpenseStore((state) => state.categories);
  const clearFeedback = useExpenseStore((state) => state.clearFeedback);
  const createCategory = useExpenseStore((state) => state.createCategory);
  const deleteCategory = useExpenseStore((state) => state.deleteCategory);
  const error = useExpenseStore((state) => state.error);
  const isLoading = useExpenseStore((state) => state.isLoading);
  const isSubmitting = useExpenseStore((state) => state.isSubmitting);
  const loadCategories = useExpenseStore((state) => state.loadCategories);
  const message = useExpenseStore((state) => state.message);
  const updateCategory = useExpenseStore((state) => state.updateCategory);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    void loadCategories();

    return () => clearFeedback();
  }, [clearFeedback, loadCategories]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setValidationError(null);

    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setValidationError("Informe o nome da categoria.");
      return;
    }

    try {
      await createCategory({ name: trimmedName });
      setNewCategoryName("");
      await loadCategories();
    } catch {
      // Feedback is handled by the store.
    }
  }

  async function handleUpdateCategory(name: string) {
    if (!categoryToEdit) {
      return;
    }

    clearFeedback();

    try {
      await updateCategory(categoryToEdit.id, { name });
      setCategoryToEdit(null);
      await loadCategories();
    } catch {
      // Feedback is handled by the store.
    }
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) {
      return;
    }

    clearFeedback();

    try {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      await loadCategories();
    } catch {
      setCategoryToDelete(null);
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Categorias
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Crie e edite suas categorias
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
          <Alert variant="error">{validationError ?? error}</Alert>
        ) : null}

        {message ? <Alert variant="success">{message}</Alert> : null}

        <form
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-end"
          onSubmit={handleCreateCategory}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="new-category-name">Nova categoria</Label>
            <Input
              id="new-category-name"
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Ex: Mercado"
              value={newCategoryName}
            />
          </div>
          <Button disabled={isSubmitting} type="submit">
            <Plus aria-hidden="true" size={17} strokeWidth={2.25} />
            Adicionar
          </Button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-semibold text-slate-950 dark:text-slate-50">
              Categorias cadastradas
            </h3>
            <Button
              aria-label="Recarregar categorias"
              disabled={isLoading}
              onClick={() => void loadCategories()}
              size="iconSm"
              type="button"
              variant="secondary"
            >
              <RefreshCcw aria-hidden="true" size={15} strokeWidth={2.25} />
            </Button>
          </div>

          {isLoading ? (
            <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
              Carregando categorias...
            </div>
          ) : null}

          {!isLoading && !categories.length ? (
            <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
              Nenhuma categoria cadastrada.
            </div>
          ) : null}

          {!isLoading && categories.length ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {categories.map((category) => (
                <div
                  className="flex items-center justify-between gap-3 p-4"
                  key={category.id}
                >
                  <span className="min-w-0 truncate font-semibold text-slate-900 dark:text-slate-100">
                    {category.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      aria-label={`Editar ${category.name}`}
                      onClick={() => setCategoryToEdit(category)}
                      size="iconSm"
                      type="button"
                      variant="secondary"
                    >
                      <Pencil aria-hidden="true" size={15} strokeWidth={2.25} />
                    </Button>
                    <Button
                      aria-label={`Excluir ${category.name}`}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                      onClick={() => setCategoryToDelete(category)}
                      size="iconSm"
                      type="button"
                      variant="secondary"
                    >
                      <Trash2 aria-hidden="true" size={15} strokeWidth={2.25} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {categoryToEdit ? (
        <EditCategoryDialog
          category={categoryToEdit}
          isSubmitting={isSubmitting}
          key={categoryToEdit.id}
          onClose={() => setCategoryToEdit(null)}
          onSave={handleUpdateCategory}
        />
      ) : null}

      <ConfirmationDialog
        confirmLabel="Excluir"
        description={
          categoryToDelete
            ? `Deseja excluir a categoria "${categoryToDelete.name}"? Se ela estiver em uso, o servidor pode impedir a remocao.`
            : "Deseja excluir esta categoria?"
        }
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Excluir categoria?"
        tone="danger"
      />
    </>
  );
}

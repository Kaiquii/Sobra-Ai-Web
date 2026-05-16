import { Category } from "@/features/expenses/types/expense";

export type EditCategoryDialogProps = {
  category: Category | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};
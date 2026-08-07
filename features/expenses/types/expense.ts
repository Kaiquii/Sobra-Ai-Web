export type ExpenseType = "Fixa" | "Parcelada" | "\u00danica";

export type ExpenseTypeFilter = "Fixas" | "Parceladas" | "Todas" | "\u00danicas";

export type PaymentSource = "Adiantamento" | "Renda Extra" | "Salario" | "Sal\u00e1rio";

export type PaymentSplit = {
  amount: number;
  expense_id?: number;
  payment_source: PaymentSource | string;
};

export type Category = {
  id: number;
  name: string;
  user_id: number;
};

export type Expense = {
  amount: number;
  category?: string;
  category_id?: number;
  current_installment: number | null;
  date: string;
  description: string;
  id: number;
  installments: number;
  month?: number;
  notes?: string | null;
  payment_source: PaymentSource | string;
  payment_splits?: PaymentSplit[];
  is_paid: boolean;
  paid_at: string | null;
  type: ExpenseType | string;
  user_id?: number;
  year?: number;
};

export type ExpensesResponse = {
  expenses: Expense[];
  total: number;
};

export type ExpenseResponse = {
  data?: Expense;
  expense?: Expense;
};

export type CategoriesResponse = {
  categories: Category[];
  total: number;
};

export type CategoryMutationResponse = {
  data?: Category;
  category?: Category;
  message: string;
};

export type ExpenseMutationResponse = {
  message: string;
};

export type ExpensePaymentStatus = "paid" | "pending";

export type PaymentStatusMutationResponse = {
  expense: Pick<Expense, "id" | "is_paid" | "paid_at">;
  message: string;
};

export type CreateCategoryRequest = {
  name: string;
};

export type UpdateCategoryRequest = {
  name: string;
};

type ExpenseRequestBase = {
  amount: number;
  category_id: number;
  date: string;
  description: string;
  installments: number;
  notes?: string;
  type: ExpenseType;
};

type ExpensePaymentSourceRequest = {
  payment_source: PaymentSource;
  payment_splits?: never;
};

type ExpensePaymentSplitsRequest = {
  payment_source?: never;
  payment_splits: Array<{
    amount: number;
    payment_source: PaymentSource;
  }>;
};

export type CreateExpenseRequest = ExpenseRequestBase &
  (ExpensePaymentSourceRequest | ExpensePaymentSplitsRequest);

export type UpdateExpenseRequest = {
  amount: number;
  category_id: number;
  date: string;
  description: string;
  notes?: string;
  update_future: boolean | null;
} & (ExpensePaymentSourceRequest | ExpensePaymentSplitsRequest);

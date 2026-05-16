export type ExpenseType = "Fixa" | "Parcelada" | "\u00danica";

export type ExpenseTypeFilter = "Fixas" | "Parceladas" | "Todas" | "\u00danicas";

export type PaymentSource = "Adiantamento" | "Renda Extra" | "Salario" | "Sal\u00e1rio";

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
  payment_source: PaymentSource | string;
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

export type CreateCategoryRequest = {
  name: string;
};

export type UpdateCategoryRequest = {
  name: string;
};

export type CreateExpenseRequest = {
  amount: number;
  category_id: number;
  date: string;
  description: string;
  installments: number;
  payment_source: PaymentSource;
  type: ExpenseType;
};

export type UpdateExpenseRequest = {
  amount: number;
  category_id: number;
  date: string;
  description: string;
  payment_source: PaymentSource;
  update_future: boolean | null;
};

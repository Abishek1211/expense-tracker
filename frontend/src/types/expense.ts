export const CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'HOUSING',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTH',
  'SHOPPING',
  'OTHER',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: number;
  amount: number;
  category: Category;
  date: string; // ISO yyyy-MM-dd
  note: string | null;
  createdAt: string;
}

export interface ExpenseRequest {
  amount: number;
  category: Category;
  date: string;
  note?: string | null;
}

export interface CategoryTotal {
  category: Category;
  total: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total: number;
  byCategory: CategoryTotal[];
}

/** Shape produced by Spring Data's VIA_DTO page serialization. */
export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

export interface ExpenseFilters {
  year?: number;
  month?: number;
  category?: Category;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

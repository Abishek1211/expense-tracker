import type { Category } from './expense';

export interface Budget {
  category: Category;
  amount: number;
}

export interface RecurringExpense {
  id: number;
  amount: number;
  category: Category;
  note: string | null;
  dayOfMonth: number;
  nextRun: string;
  active: boolean;
}

export interface RecurringExpenseRequest {
  amount: number;
  category: Category;
  note?: string | null;
  dayOfMonth: number;
  active?: boolean;
}

export interface MonthTotal {
  year: number;
  month: number;
  total: number;
}

export interface Insight {
  type: 'TOTAL_CHANGE' | 'TOP_CATEGORY' | 'BIGGEST_INCREASE' | 'DAILY_AVERAGE' | 'NO_DATA';
  message: string;
  changePercent?: number;
}

import { apiClient } from './client';
import type {
  Expense,
  ExpenseFilters,
  ExpenseRequest,
  MonthlySummary,
  Page,
} from '../types/expense';

const BASE = '/api/v1/expenses';

export async function listExpenses(filters: ExpenseFilters): Promise<Page<Expense>> {
  const { data } = await apiClient.get<Page<Expense>>(BASE, {
    params: { sort: 'date,desc', ...filters },
  });
  return data;
}

export async function getExpense(id: number): Promise<Expense> {
  const { data } = await apiClient.get<Expense>(`${BASE}/${id}`);
  return data;
}

export async function createExpense(request: ExpenseRequest): Promise<Expense> {
  const { data } = await apiClient.post<Expense>(BASE, request);
  return data;
}

export async function updateExpense(id: number, request: ExpenseRequest): Promise<Expense> {
  const { data } = await apiClient.put<Expense>(`${BASE}/${id}`, request);
  return data;
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const { data } = await apiClient.get<MonthlySummary>(`${BASE}/summary`, {
    params: { year, month },
  });
  return data;
}

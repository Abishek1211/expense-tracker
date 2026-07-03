import { apiClient } from './client';
import type { Insight, MonthTotal } from '../types/budget';
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

export async function getTrend(months = 6): Promise<MonthTotal[]> {
  const { data } = await apiClient.get<MonthTotal[]>(`${BASE}/trend`, { params: { months } });
  return data;
}

export async function getInsights(year: number, month: number): Promise<Insight[]> {
  const { data } = await apiClient.get<Insight[]>(`${BASE}/insights`, {
    params: { year, month },
  });
  return data;
}

export async function downloadCsv(filters: ExpenseFilters): Promise<void> {
  const { data } = await apiClient.get<Blob>(`${BASE}/export`, {
    params: filters,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'expenses.csv';
  link.click();
  URL.revokeObjectURL(url);
}

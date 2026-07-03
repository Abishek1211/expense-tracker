import { apiClient } from './client';
import type { Budget, RecurringExpense, RecurringExpenseRequest } from '../types/budget';
import type { Category } from '../types/expense';

export async function listBudgets(): Promise<Budget[]> {
  const { data } = await apiClient.get<Budget[]>('/api/v1/budgets');
  return data;
}

export async function upsertBudget(category: Category, amount: number): Promise<Budget> {
  const { data } = await apiClient.put<Budget>(`/api/v1/budgets/${category}`, { amount });
  return data;
}

export async function deleteBudget(category: Category): Promise<void> {
  await apiClient.delete(`/api/v1/budgets/${category}`);
}

export async function listRecurring(): Promise<RecurringExpense[]> {
  const { data } = await apiClient.get<RecurringExpense[]>('/api/v1/recurring');
  return data;
}

export async function createRecurring(request: RecurringExpenseRequest): Promise<RecurringExpense> {
  const { data } = await apiClient.post<RecurringExpense>('/api/v1/recurring', request);
  return data;
}

export async function updateRecurring(
  id: number,
  request: RecurringExpenseRequest,
): Promise<RecurringExpense> {
  const { data } = await apiClient.put<RecurringExpense>(`/api/v1/recurring/${id}`, request);
  return data;
}

export async function deleteRecurring(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/recurring/${id}`);
}

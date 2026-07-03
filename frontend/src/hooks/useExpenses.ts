import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createExpense,
  deleteExpense,
  getMonthlySummary,
  listExpenses,
  updateExpense,
} from '../api/expenses';
import type { ExpenseFilters, ExpenseRequest } from '../types/expense';

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
  summary: (year: number, month: number) => ['expenses', 'summary', year, month] as const,
};

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => listExpenses(filters),
  });
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: expenseKeys.summary(year, month),
    queryFn: () => getMonthlySummary(year, month),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ExpenseRequest) => createExpense(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ExpenseRequest }) =>
      updateExpense(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRecurring,
  deleteBudget,
  deleteRecurring,
  listBudgets,
  listRecurring,
  updateRecurring,
  upsertBudget,
} from '../api/budgets';
import type { RecurringExpenseRequest } from '../types/budget';
import type { Category } from '../types/expense';
import { expenseKeys } from './useExpenses';

export const budgetKeys = {
  budgets: ['budgets'] as const,
  recurring: ['recurring'] as const,
};

export function useBudgets() {
  return useQuery({ queryKey: budgetKeys.budgets, queryFn: listBudgets });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, amount }: { category: Category; amount: number }) =>
      upsertBudget(category, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.budgets }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: Category) => deleteBudget(category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.budgets }),
  });
}

export function useRecurring() {
  return useQuery({ queryKey: budgetKeys.recurring, queryFn: listRecurring });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RecurringExpenseRequest) => createRecurring(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.recurring }),
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: RecurringExpenseRequest }) =>
      updateRecurring(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.recurring });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRecurring(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.recurring }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createExpense,
  deleteExpense,
  getInsights,
  getMonthlySummary,
  getTrend,
  listExpenses,
  updateExpense,
} from '../api/expenses';
import type { Expense, ExpenseFilters, ExpenseRequest, Page } from '../types/expense';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: ['expenses', 'list'] as const,
  list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
  summary: (year: number, month: number) => ['expenses', 'summary', year, month] as const,
  trend: (months: number) => ['expenses', 'trend', months] as const,
  insights: (year: number, month: number) => ['expenses', 'insights', year, month] as const,
};

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => listExpenses(filters),
    placeholderData: (previous) => previous, // keep table content while refetching
  });
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: expenseKeys.summary(year, month),
    queryFn: () => getMonthlySummary(year, month),
  });
}

export function useTrend(months = 6) {
  return useQuery({
    queryKey: expenseKeys.trend(months),
    queryFn: () => getTrend(months),
  });
}

export function useInsights(year: number, month: number) {
  return useQuery({
    queryKey: expenseKeys.insights(year, month),
    queryFn: () => getInsights(year, month),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ExpenseRequest) => createExpense(request),
    // Optimistically prepend to any cached list so the row appears instantly.
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists });
      const snapshots = queryClient.getQueriesData<Page<Expense>>({ queryKey: expenseKeys.lists });
      const optimistic: Expense = {
        id: -Date.now(),
        amount: request.amount,
        category: request.category,
        date: request.date,
        note: request.note ?? null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueriesData<Page<Expense>>({ queryKey: expenseKeys.lists }, (page) =>
        page
          ? {
              ...page,
              content: [optimistic, ...page.content],
              page: { ...page.page, totalElements: page.page.totalElements + 1 },
            }
          : page,
      );
      return { snapshots };
    },
    onError: (_error, _request, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ExpenseRequest }) =>
      updateExpense(id, request),
    onMutate: async ({ id, request }) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists });
      const snapshots = queryClient.getQueriesData<Page<Expense>>({ queryKey: expenseKeys.lists });
      queryClient.setQueriesData<Page<Expense>>({ queryKey: expenseKeys.lists }, (page) =>
        page
          ? {
              ...page,
              content: page.content.map((expense) =>
                expense.id === id
                  ? { ...expense, ...request, note: request.note ?? null }
                  : expense,
              ),
            }
          : page,
      );
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists });
      const snapshots = queryClient.getQueriesData<Page<Expense>>({ queryKey: expenseKeys.lists });
      queryClient.setQueriesData<Page<Expense>>({ queryKey: expenseKeys.lists }, (page) =>
        page
          ? {
              ...page,
              content: page.content.filter((expense) => expense.id !== id),
              page: { ...page.page, totalElements: Math.max(0, page.page.totalElements - 1) },
            }
          : page,
      );
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

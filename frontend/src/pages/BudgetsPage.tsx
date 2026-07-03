import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ErrorMessage from '../components/ErrorMessage';
import { SkeletonRows } from '../components/Skeletons';
import { useBudgets, useDeleteBudget, useUpsertBudget } from '../hooks/useBudgets';
import { useMonthlySummary } from '../hooks/useExpenses';
import { CATEGORY_COLORS } from '../lib/categories';
import { formatCurrency, titleCase } from '../lib/format';
import { CATEGORIES, type Category } from '../types/expense';

interface BudgetRowProps {
  category: Category;
  budget: number | null;
  spent: number;
}

function BudgetRow({ category, budget, spent }: BudgetRowProps) {
  const [value, setValue] = useState(budget === null ? '' : String(budget));
  const upsertMutation = useUpsertBudget();
  const deleteMutation = useDeleteBudget();

  const dirty = value !== (budget === null ? '' : String(budget));
  const ratio = budget && budget > 0 ? Math.min(spent / budget, 1) : 0;
  const over = budget !== null && spent > budget;

  const save = () => {
    const amount = Number(value);
    if (!value.trim() || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    upsertMutation.mutate(
      { category, amount },
      {
        onSuccess: () => toast.success(`${titleCase(category)} budget saved`),
        onError: () => toast.error('Could not save the budget'),
      },
    );
  };

  const remove = () => {
    deleteMutation.mutate(category, {
      onSuccess: () => {
        setValue('');
        toast.success(`${titleCase(category)} budget removed`);
      },
      onError: () => toast.error('Could not remove the budget'),
    });
  };

  return (
    <div className="glass rounded-2xl p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
          />
          <span className="font-medium">{titleCase(category)}</span>
          {budget !== null && (
            <span className={`text-sm ${over ? 'font-semibold text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatCurrency(spent)} spent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="100"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="No budget"
            aria-label={`${titleCase(category)} budget`}
            className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-right text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={save}
            disabled={!dirty || upsertMutation.isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
          >
            Save
          </button>
          {budget !== null && (
            <button
              type="button"
              onClick={remove}
              disabled={deleteMutation.isPending}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {budget !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: over ? '#ef4444' : CATEGORY_COLORS[category] }}
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}

export default function BudgetsPage() {
  const now = new Date();
  const budgets = useBudgets();
  const summary = useMonthlySummary(now.getFullYear(), now.getMonth() + 1);

  if (budgets.isPending || summary.isPending) {
    return <SkeletonRows rows={5} />;
  }
  if (budgets.isError) {
    return <ErrorMessage error={budgets.error} onRetry={() => budgets.refetch()} />;
  }

  const budgetByCategory = new Map(budgets.data.map((b) => [b.category, b.amount]));
  const spentByCategory = new Map(
    (summary.data?.byCategory ?? []).map((item) => [item.category, item.total]),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Budgets</h2>
        <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
          Monthly limits per category — progress reflects the current month
        </p>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((category) => (
          <BudgetRow
            key={category}
            category={category}
            budget={budgetByCategory.get(category) ?? null}
            spent={spentByCategory.get(category) ?? 0}
          />
        ))}
      </div>
    </motion.div>
  );
}

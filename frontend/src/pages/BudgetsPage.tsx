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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
          />
          <span className="font-medium">{titleCase(category)}</span>
          {budget !== null && (
            <span
              className={`text-sm tabular-nums ${
                over
                  ? 'font-semibold text-red-600 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
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
            className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-1.5 text-right text-sm tabular-nums shadow-sm transition-colors focus:border-emerald-500 focus:outline-none sm:w-32 dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={save}
            disabled={!dirty || upsertMutation.isPending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            Save
          </button>
          {budget !== null && (
            <button
              type="button"
              onClick={remove}
              disabled={deleteMutation.isPending}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {budget !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: over ? '#dc2626' : CATEGORY_COLORS[category] }}
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Budgets</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Monthly limits per category — progress reflects the current month
        </p>
      </div>

      <div className="space-y-2.5">
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

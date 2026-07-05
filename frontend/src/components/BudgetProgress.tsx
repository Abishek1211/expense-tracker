import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CATEGORY_COLORS } from '../lib/categories';
import { formatCurrency, titleCase } from '../lib/format';
import type { Budget } from '../types/budget';
import type { CategoryTotal } from '../types/expense';

interface BudgetProgressProps {
  budgets: Budget[];
  spending: CategoryTotal[];
}

export default function BudgetProgress({ budgets, spending }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        No budgets set yet —{' '}
        <Link
          to="/budgets"
          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          create one
        </Link>{' '}
        to track your limits here.
      </p>
    );
  }

  const spentByCategory = new Map(spending.map((item) => [item.category, item.total]));

  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {budgets.map((budget) => {
        const spent = spentByCategory.get(budget.category) ?? 0;
        const ratio = Math.min(spent / budget.amount, 1);
        const over = spent > budget.amount;

        return (
          <div key={budget.category}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{titleCase(budget.category)}</span>
              <span
                className={`tabular-nums ${
                  over ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {formatCurrency(spent)} / {formatCurrency(budget.amount)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: over ? '#dc2626' : CATEGORY_COLORS[budget.category] }}
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {over && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                Over by {formatCurrency(spent - budget.amount)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

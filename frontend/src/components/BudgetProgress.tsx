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
      <p className="text-sm text-gray-400 dark:text-gray-500">
        No budgets set yet —{' '}
        <Link to="/budgets" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          create one
        </Link>{' '}
        to track your limits here.
      </p>
    );
  }

  const spentByCategory = new Map(spending.map((item) => [item.category, item.total]));

  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const spent = spentByCategory.get(budget.category) ?? 0;
        const ratio = Math.min(spent / budget.amount, 1);
        const over = spent > budget.amount;
        const near = !over && ratio >= 0.75;
        const barColor = over ? '#ef4444' : near ? '#f59e0b' : CATEGORY_COLORS[budget.category];

        return (
          <div key={budget.category}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium">{titleCase(budget.category)}</span>
              <span className={over ? 'font-semibold text-red-500' : 'text-gray-400 dark:text-gray-500'}>
                {formatCurrency(spent)} / {formatCurrency(budget.amount)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            {over && (
              <p className="mt-1 text-xs font-medium text-red-500">
                Over budget by {formatCurrency(spent - budget.amount)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

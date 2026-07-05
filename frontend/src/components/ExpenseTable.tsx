import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCreateExpense, useDeleteExpense } from '../hooks/useExpenses';
import { CATEGORY_BADGE_CLASSES } from '../lib/categories';
import { formatCurrency, formatDate, titleCase } from '../lib/format';
import type { Expense } from '../types/expense';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
}

function CategoryBadge({ expense }: { expense: Expense }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_BADGE_CLASSES[expense.category]}`}
    >
      {titleCase(expense.category)}
    </span>
  );
}

export default function ExpenseTable({ expenses, onEdit }: ExpenseTableProps) {
  const deleteMutation = useDeleteExpense();
  const createMutation = useCreateExpense();

  const handleDelete = (expense: Expense) => {
    deleteMutation.mutate(expense.id, {
      onSuccess: () => {
        toast.success('Expense deleted', {
          action: {
            label: 'Undo',
            onClick: () =>
              createMutation.mutate({
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                note: expense.note,
              }),
          },
        });
      },
      onError: () => toast.error('Could not delete the expense'),
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No expenses found for this period.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Add one with the button above, or adjust the filters.
        </p>
      </div>
    );
  }

  const actionButtons = (expense: Expense) => (
    <>
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => handleDelete(expense)}
        className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Delete
      </button>
    </>
  );

  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence initial={false}>
              {expenses.map((expense) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge expense={expense} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                    {expense.note ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="inline-flex gap-3 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                      {actionButtons(expense)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Phones: card list */}
      <div className="space-y-2 md:hidden">
        <AnimatePresence initial={false}>
          {expenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3">
                <CategoryBadge expense={expense} />
                <span className="font-semibold tabular-nums">{formatCurrency(expense.amount)}</span>
              </div>
              {expense.note && (
                <p className="mt-1.5 truncate text-sm text-slate-600 dark:text-slate-400">
                  {expense.note}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(expense.date)}
                </span>
                <span className="flex gap-4">{actionButtons(expense)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

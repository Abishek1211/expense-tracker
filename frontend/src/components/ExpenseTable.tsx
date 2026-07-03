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
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
        <p className="text-sm text-gray-400 dark:text-gray-500">No expenses found for this period.</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Add one with the button above, or adjust the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
        <thead className="bg-gray-50/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.02] dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          <AnimatePresence initial={false}>
            {expenses.map((expense) => (
              <motion.tr
                key={expense.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className="group transition-colors hover:bg-indigo-50/40 dark:hover:bg-white/[0.03]"
              >
                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatDate(expense.date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASSES[expense.category]}`}
                  >
                    {titleCase(expense.category)}
                  </span>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-gray-500 dark:text-gray-400">
                  {expense.note ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex gap-3 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(expense)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense)}
                      className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

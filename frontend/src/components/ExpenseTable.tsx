import { useState } from 'react';
import { useDeleteExpense } from '../hooks/useExpenses';
import { CATEGORY_BADGE_CLASSES } from '../lib/categories';
import { formatCurrency, formatDate, titleCase } from '../lib/format';
import type { Expense } from '../types/expense';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
}

export default function ExpenseTable({ expenses, onEdit }: ExpenseTableProps) {
  const deleteMutation = useDeleteExpense();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, { onSettled: () => setConfirmingId(null) });
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
        No expenses found for this period. Add your first one!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                {formatDate(expense.date)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASSES[expense.category]}`}
                >
                  {titleCase(expense.category)}
                </span>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-500">{expense.note ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {formatCurrency(expense.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {confirmingId === expense.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-gray-500">Delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(expense)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(expense.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

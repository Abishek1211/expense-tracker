import { useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import ExpenseFormModal from '../components/ExpenseFormModal';
import ExpenseTable from '../components/ExpenseTable';
import LoadingSpinner from '../components/LoadingSpinner';
import MonthPicker from '../components/MonthPicker';
import { useExpenses } from '../hooks/useExpenses';
import { titleCase } from '../lib/format';
import { CATEGORIES, type Category, type Expense } from '../types/expense';

const PAGE_SIZE = 20;

export default function ExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [category, setCategory] = useState<Category | ''>('');
  const [page, setPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data, isPending, isError, error, refetch } = useExpenses({
    year,
    month,
    category: category === '' ? undefined : category,
    page,
    size: PAGE_SIZE,
  });

  const openCreate = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const totalPages = data?.page.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Expenses</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add expense
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker
          year={year}
          month={month}
          onChange={(nextYear, nextMonth) => {
            setYear(nextYear);
            setMonth(nextMonth);
            setPage(0);
          }}
        />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as Category | '');
            setPage(0);
          }}
          aria-label="Filter by category"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
      </div>

      {isPending && <LoadingSpinner label="Loading expenses…" />}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <ExpenseTable expenses={data.content} onEdit={openEdit} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ExpenseFormModal
        open={modalOpen}
        expense={editingExpense}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

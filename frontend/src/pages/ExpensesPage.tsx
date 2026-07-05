import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { downloadCsv } from '../api/expenses';
import ErrorMessage from '../components/ErrorMessage';
import ExpenseFormModal from '../components/ExpenseFormModal';
import ExpenseTable from '../components/ExpenseTable';
import { DownloadIcon, PlusIcon, SearchIcon } from '../components/Icons';
import MonthPicker from '../components/MonthPicker';
import { SkeletonTable } from '../components/Skeletons';
import { useExpenses } from '../hooks/useExpenses';
import { titleCase } from '../lib/format';
import { CATEGORIES, type Category, type Expense } from '../types/expense';

const PAGE_SIZE = 20;

function isCategory(value: string | null): value is Category {
  return CATEGORIES.includes(value as Category);
}

export default function ExpensesPage() {
  const now = new Date();
  const [searchParams, setSearchParams] = useSearchParams();

  const year = Number(searchParams.get('year')) || now.getFullYear();
  const month = Number(searchParams.get('month')) || now.getMonth() + 1;
  const categoryParam = searchParams.get('category');
  const category: Category | '' = isCategory(categoryParam) ? categoryParam : '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const filters = {
    year,
    month,
    category: category === '' ? undefined : category,
    q: debouncedSearch || undefined,
    page,
    size: PAGE_SIZE,
  };

  const { data, isPending, isError, error, refetch } = useExpenses(filters);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
    setPage(0);
  };

  const handleExport = async () => {
    try {
      await downloadCsv({ ...filters, page: undefined, size: undefined });
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Expenses</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {data
              ? `${data.page.totalElements} record${data.page.totalElements === 1 ? '' : 's'}`
              : ' '}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <DownloadIcon width={15} height={15} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 sm:px-3.5"
          >
            <PlusIcon width={15} height={15} />
            Add expense
          </button>
        </div>
      </div>

      {/* Filters: single row on desktop, stacked grid on phones */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="col-span-2 sm:col-span-1">
          <MonthPicker
            year={year}
            month={month}
            onChange={(nextYear, nextMonth) =>
              updateParams({ year: String(nextYear), month: String(nextMonth) })
            }
          />
        </div>
        <select
          value={category}
          onChange={(event) =>
            updateParams({ category: event.target.value === '' ? null : event.target.value })
          }
          aria-label="Filter by category"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {titleCase(option)}
            </option>
          ))}
        </select>
        <div className="relative sm:min-w-56 sm:flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon width={15} height={15} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Search notes…"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {isPending && <SkeletonTable />}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <ExpenseTable expenses={data.content} onEdit={openEdit} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <span className="tabular-nums">
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
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
    </motion.div>
  );
}

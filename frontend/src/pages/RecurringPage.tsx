import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import ErrorMessage from '../components/ErrorMessage';
import { SkeletonRows } from '../components/Skeletons';
import {
  useCreateRecurring,
  useDeleteRecurring,
  useRecurring,
  useUpdateRecurring,
} from '../hooks/useBudgets';
import { CATEGORY_BADGE_CLASSES } from '../lib/categories';
import { formatCurrency, formatDate, titleCase } from '../lib/format';
import type { RecurringExpense } from '../types/budget';
import { CATEGORIES, type Category } from '../types/expense';

interface FormValues {
  amount: string;
  category: Category;
  dayOfMonth: string;
  note: string;
}

const emptyForm = (): FormValues => ({ amount: '', category: 'HOUSING', dayOfMonth: '1', note: '' });

export default function RecurringPage() {
  const { data, isPending, isError, error, refetch } = useRecurring();
  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const deleteMutation = useDeleteRecurring();

  const [values, setValues] = useState<FormValues>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);

  const setField = (field: keyof FormValues, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const startEdit = (item: RecurringExpense) => {
    setEditingId(item.id);
    setValues({
      amount: String(item.amount),
      category: item.category,
      dayOfMonth: String(item.dayOfMonth),
      note: item.note ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setValues(emptyForm());
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(values.amount);
    const dayOfMonth = Number(values.dayOfMonth);
    if (!values.amount.trim() || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      toast.error('Day of month must be between 1 and 31');
      return;
    }

    const request = {
      amount,
      category: values.category,
      dayOfMonth,
      note: values.note.trim() || null,
    };

    if (editingId !== null) {
      updateMutation.mutate(
        { id: editingId, request },
        {
          onSuccess: () => {
            toast.success('Recurring expense updated');
            cancelEdit();
          },
          onError: () => toast.error('Could not update'),
        },
      );
    } else {
      createMutation.mutate(request, {
        onSuccess: () => {
          toast.success('Recurring expense added');
          setValues(emptyForm());
        },
        onError: () => toast.error('Could not add'),
      });
    }
  };

  const toggleActive = (item: RecurringExpense) => {
    updateMutation.mutate(
      {
        id: item.id,
        request: {
          amount: item.amount,
          category: item.category,
          dayOfMonth: item.dayOfMonth,
          note: item.note,
          active: !item.active,
        },
      },
      {
        onSuccess: () =>
          toast.success(item.active ? 'Paused — no new expenses will be created' : 'Resumed'),
      },
    );
  };

  const remove = (item: RecurringExpense) => {
    deleteMutation.mutate(item.id, {
      onSuccess: () => toast.success('Recurring expense deleted'),
      onError: () => toast.error('Could not delete'),
    });
  };

  const inputClass =
    'rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800';
  const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Recurring expenses</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Rent, subscriptions, EMIs — added automatically every month
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* 2-col grid on phones, single row on desktop */}
        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="rec-amount" className={labelClass}>
              Amount
            </label>
            <input
              id="rec-amount"
              type="number"
              step="0.01"
              min="0"
              value={values.amount}
              onChange={(event) => setField('amount', event.target.value)}
              className={`${inputClass} w-full lg:w-28`}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rec-category" className={labelClass}>
              Category
            </label>
            <select
              id="rec-category"
              value={values.category}
              onChange={(event) => setField('category', event.target.value)}
              className={`${inputClass} w-full lg:w-auto`}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {titleCase(category)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rec-day" className={labelClass}>
              Day of month
            </label>
            <input
              id="rec-day"
              type="number"
              min="1"
              max="31"
              value={values.dayOfMonth}
              onChange={(event) => setField('dayOfMonth', event.target.value)}
              className={`${inputClass} w-full lg:w-20`}
            />
          </div>
          <div className="flex flex-col gap-1 lg:min-w-40 lg:flex-1">
            <label htmlFor="rec-note" className={labelClass}>
              Note
            </label>
            <input
              id="rec-note"
              type="text"
              maxLength={500}
              value={values.note}
              onChange={(event) => setField('note', event.target.value)}
              className={`${inputClass} w-full`}
              placeholder="e.g. Rent"
            />
          </div>
          <div className="col-span-2 flex gap-2 lg:col-span-1">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 lg:flex-none"
            >
              {editingId !== null ? 'Save' : 'Add'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {isPending && <SkeletonRows rows={3} />}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Nothing recurring yet — add your rent or a subscription above.
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {data.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900 ${
                  item.active ? '' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_BADGE_CLASSES[item.category]}`}
                  >
                    {titleCase(item.category)}
                  </span>
                  <div>
                    <p className="font-medium tabular-nums">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {item.note || 'No note'} · day {item.dayOfMonth} ·{' '}
                      {item.active ? `next on ${formatDate(item.nextRun)}` : 'paused'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium sm:gap-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {item.active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

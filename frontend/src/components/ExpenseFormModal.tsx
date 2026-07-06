import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { extractApiError } from '../api/client';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import { titleCase } from '../lib/format';
import { CATEGORIES, type Category, type Expense, type ExpenseRequest } from '../types/expense';

interface ExpenseFormModalProps {
  open: boolean;
  expense: Expense | null; // null = create mode
  onClose: () => void;
}

interface FormValues {
  amount: string;
  category: Category;
  date: string;
  note: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): FormValues => ({
  amount: '',
  category: 'FOOD',
  date: today(),
  note: '',
});

// Mirrors the backend's Jakarta Bean Validation rules on ExpenseRequest.
function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.amount.trim() === '') {
    errors.amount = 'Amount is required';
  } else {
    const amount = Number(values.amount);
    if (Number.isNaN(amount)) errors.amount = 'Amount must be a number';
    else if (amount <= 0) errors.amount = 'Amount must be greater than zero';
    else if (!/^\d+(\.\d{1,2})?$/.test(values.amount.trim()))
      errors.amount = 'Amount must have at most 2 decimal places';
  }
  if (!values.date) errors.date = 'Date is required';
  if (values.note.length > 500) errors.note = 'Note must be at most 500 characters';
  return errors;
}

export default function ExpenseFormModal({ open, expense, onClose }: ExpenseFormModalProps) {
  const [values, setValues] = useState<FormValues>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setValues(
        expense
          ? {
              amount: String(expense.amount),
              category: expense.category,
              date: expense.date,
              note: expense.note ?? '',
            }
          : emptyForm(),
      );
      setErrors({});
      setSubmitError(null);
    }
  }, [open, expense]);

  const setField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const request: ExpenseRequest = {
      amount: Number(values.amount),
      category: values.category,
      date: values.date,
      note: values.note.trim() === '' ? null : values.note.trim(),
    };

    try {
      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, request });
        toast.success('Expense updated');
      } else {
        await createMutation.mutateAsync(request);
        toast.success('Expense added');
      }
      onClose();
    } catch (error) {
      const apiError = extractApiError(error);
      if (apiError?.fieldErrors) {
        setErrors(apiError.fieldErrors);
      } else {
        setSubmitError(apiError?.message ?? 'Failed to save expense. Is the backend running?');
      }
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100 ${
      errors[field]
        ? 'border-red-300 focus:ring-red-200 dark:border-red-800'
        : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-600/20 dark:border-slate-700'
    }`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md rounded-t-xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-semibold">{expense ? 'Edit expense' : 'Add expense'}</h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="amount"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={values.amount}
                  onChange={(event) => setField('amount', event.target.value)}
                  className={inputClass('amount')}
                  placeholder="0.00"
                  autoFocus
                />
                {errors.amount && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="category"
                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={values.category}
                    onChange={(event) => setField('category', event.target.value)}
                    className={inputClass('category')}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {titleCase(category)}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={values.date}
                    onChange={(event) => setField('date', event.target.value)}
                    className={inputClass('date')}
                  />
                  {errors.date && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.date}</p>}
                </div>
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="note"
                  rows={2}
                  maxLength={500}
                  value={values.note}
                  onChange={(event) => setField('note', event.target.value)}
                  className={inputClass('note')}
                  placeholder="What was this for?"
                />
                {errors.note && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.note}</p>}
              </div>

              {submitError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {submitError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPending ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

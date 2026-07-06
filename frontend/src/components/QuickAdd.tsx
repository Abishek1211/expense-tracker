import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useCreateExpense } from '../hooks/useExpenses';
import { parseQuickAdd } from '../lib/quickAdd';
import { formatCurrency, formatDate, titleCase } from '../lib/format';
import { PlusIcon } from './Icons';

export default function QuickAdd() {
  const [text, setText] = useState('');
  const createMutation = useCreateExpense();
  const parsed = useMemo(() => parseQuickAdd(text), [text]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!parsed) return;
    createMutation.mutate(
      {
        amount: parsed.amount,
        category: parsed.category,
        date: parsed.date,
        note: parsed.note || null,
      },
      {
        onSuccess: () =>
          toast.success(`Added ${formatCurrency(parsed.amount)} to ${titleCase(parsed.category)}`),
        onError: () => toast.error('Could not add the expense'),
      },
    );
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors focus-within:border-emerald-500 sm:p-4 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-emerald-500"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Quick add — e.g. "coffee 150 yesterday" or "uber 320"'
          aria-label="Quick add expense"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!parsed || createMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
        >
          <PlusIcon width={14} height={14} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      {parsed && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            {formatCurrency(parsed.amount)}
          </span>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {titleCase(parsed.category)}
          </span>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {formatDate(parsed.date)}
          </span>
          {parsed.note && (
            <span className="truncate text-slate-400 dark:text-slate-500">“{parsed.note}”</span>
          )}
        </div>
      )}
    </form>
  );
}

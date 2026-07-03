import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useCreateExpense } from '../hooks/useExpenses';
import { parseQuickAdd } from '../lib/quickAdd';
import { formatCurrency, formatDate, titleCase } from '../lib/format';
import { SparklesIcon } from './Icons';

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
        onSuccess: () => toast.success(`Added ${formatCurrency(parsed.amount)} to ${titleCase(parsed.category)}`),
        onError: () => toast.error('Could not add the expense'),
      },
    );
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-4 transition focus-within:ring-2 focus-within:ring-indigo-500/40"
    >
      <div className="flex items-center gap-3">
        <span className="text-indigo-500 dark:text-indigo-400">
          <SparklesIcon />
        </span>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Quick add — try "coffee 150 yesterday" or "uber 320"'
          aria-label="Quick add expense"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!parsed || createMutation.isPending}
          className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {parsed && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {formatCurrency(parsed.amount)}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {titleCase(parsed.category)}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {formatDate(parsed.date)}
          </span>
          {parsed.note && <span className="text-gray-400 dark:text-gray-500">“{parsed.note}”</span>}
        </div>
      )}
    </form>
  );
}

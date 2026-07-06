import { monthLabel } from '../lib/format';

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const shift = (delta: number) => {
    const shifted = new Date(year, month - 1 + delta, 1);
    onChange(shifted.getFullYear(), shifted.getMonth() + 1);
  };

  return (
    <div className="inline-flex items-center rounded-md border border-slate-300 bg-white text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className="border-r border-slate-200 px-2.5 py-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        ←
      </button>
      <span className="min-w-32 px-3 text-center font-medium tabular-nums">
        {monthLabel(year, month)}
      </span>
      <button
        type="button"
        onClick={() => shift(1)}
        aria-label="Next month"
        className="border-l border-slate-200 px-2.5 py-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        →
      </button>
    </div>
  );
}

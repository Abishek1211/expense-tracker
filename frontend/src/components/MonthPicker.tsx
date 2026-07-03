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
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className="rounded-md px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        ←
      </button>
      <span className="min-w-36 text-center text-sm font-medium">{monthLabel(year, month)}</span>
      <button
        type="button"
        onClick={() => shift(1)}
        aria-label="Next month"
        className="rounded-md px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        →
      </button>
    </div>
  );
}

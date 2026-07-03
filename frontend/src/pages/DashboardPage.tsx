import { useState } from 'react';
import CategoryPieChart from '../components/CategoryPieChart';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import MonthPicker from '../components/MonthPicker';
import { useMonthlySummary } from '../hooks/useExpenses';
import { formatCurrency, titleCase } from '../lib/format';

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isPending, isError, error, refetch } = useMonthlySummary(year, month);

  const topCategory = data?.byCategory[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <MonthPicker
          year={year}
          month={month}
          onChange={(nextYear, nextMonth) => {
            setYear(nextYear);
            setMonth(nextMonth);
          }}
        />
      </div>

      {isPending && <LoadingSpinner label="Loading summary…" />}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total spent</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.total)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Top category</p>
              <p className="mt-1 text-2xl font-semibold">
                {topCategory ? titleCase(topCategory.category) : '—'}
              </p>
              {topCategory && (
                <p className="text-sm text-gray-400">{formatCurrency(topCategory.total)}</p>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Categories used</p>
              <p className="mt-1 text-2xl font-semibold">{data.byCategory.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Spending by category</h3>
            <CategoryPieChart data={data.byCategory} />
          </div>
        </>
      )}
    </div>
  );
}

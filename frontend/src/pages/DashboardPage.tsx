import { useState } from 'react';
import { motion } from 'framer-motion';
import BudgetProgress from '../components/BudgetProgress';
import CategoryPieChart from '../components/CategoryPieChart';
import ErrorMessage from '../components/ErrorMessage';
import InsightsRow from '../components/InsightsRow';
import MonthPicker from '../components/MonthPicker';
import QuickAdd from '../components/QuickAdd';
import { SkeletonCards, SkeletonChart } from '../components/Skeletons';
import TrendChart from '../components/TrendChart';
import { useBudgets } from '../hooks/useBudgets';
import { useCountUp } from '../hooks/useCountUp';
import { useInsights, useMonthlySummary, useTrend } from '../hooks/useExpenses';
import { formatCurrency, titleCase } from '../lib/format';

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{formatCurrency(animated)}</>;
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const summary = useMonthlySummary(year, month);
  const insights = useInsights(year, month);
  const trend = useTrend(6);
  const budgets = useBudgets();

  const topCategory = summary.data?.byCategory[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
            Your spending at a glance
          </p>
        </div>
        <MonthPicker
          year={year}
          month={month}
          onChange={(nextYear, nextMonth) => {
            setYear(nextYear);
            setMonth(nextMonth);
          }}
        />
      </div>

      <QuickAdd />

      {summary.isPending && <SkeletonCards />}
      {summary.isError && <ErrorMessage error={summary.error} onRetry={() => summary.refetch()} />}

      {summary.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/20">
              <p className="text-sm text-indigo-100">Total spent</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                <AnimatedCurrency value={summary.data.total} />
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Top category</p>
              <p className="mt-1 text-2xl font-semibold">
                {topCategory ? titleCase(topCategory.category) : '—'}
              </p>
              {topCategory && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {formatCurrency(topCategory.total)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories used</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {summary.data.byCategory.length}
              </p>
            </div>
          </div>

          {insights.data && <InsightsRow insights={insights.data} />}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Spending by category
              </h3>
              <CategoryPieChart data={summary.data.byCategory} year={year} month={month} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Last 6 months
              </h3>
              {trend.data ? <TrendChart data={trend.data} /> : <SkeletonChart />}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Budgets this month
            </h3>
            <BudgetProgress budgets={budgets.data ?? []} spending={summary.data.byCategory} />
          </div>
        </>
      )}
    </motion.div>
  );
}

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
  const animated = useCountUp(value, 400);
  return <>{formatCurrency(animated)}</>;
}

const card =
  'rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900';
const sectionTitle =
  'mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const summary = useMonthlySummary(year, month);
  const insights = useInsights(year, month);
  const trend = useTrend(6);
  const budgets = useBudgets();

  const topCategory = summary.data?.byCategory[0];
  const totalChange = insights.data?.find((i) => i.type === 'TOTAL_CHANGE')?.changePercent;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className={card}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total spent
                </p>
                {typeof totalChange === 'number' && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                      totalChange >= 0
                        ? 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                    }`}
                  >
                    {totalChange >= 0 ? '+' : ''}
                    {totalChange.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight lg:text-3xl">
                <AnimatedCurrency value={summary.data.total} />
              </p>
            </div>

            <div className={card}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top category
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">
                {topCategory ? titleCase(topCategory.category) : '—'}
              </p>
              {topCategory && (
                <p className="mt-0.5 text-sm tabular-nums text-slate-400 dark:text-slate-500">
                  {formatCurrency(topCategory.total)}
                </p>
              )}
            </div>

            <div className={card}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Categories used
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight lg:text-3xl">
                {summary.data.byCategory.length}
              </p>
              <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">
                of 8 {summary.data.byCategory.length === 1 ? 'category' : 'categories'}
              </p>
            </div>
          </div>

          {insights.data && <InsightsRow insights={insights.data} />}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h3 className={sectionTitle}>Spending by category</h3>
              <CategoryPieChart data={summary.data.byCategory} year={year} month={month} />
            </div>
            <div className={card}>
              <h3 className={sectionTitle}>Last 6 months</h3>
              {trend.data ? <TrendChart data={trend.data} /> : <SkeletonChart />}
            </div>
          </div>

          <div className={card}>
            <h3 className={sectionTitle}>Budgets this month</h3>
            <BudgetProgress budgets={budgets.data ?? []} spending={summary.data.byCategory} />
          </div>
        </>
      )}
    </motion.div>
  );
}

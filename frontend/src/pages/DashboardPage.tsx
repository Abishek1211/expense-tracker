import { useState } from 'react';
import { motion } from 'framer-motion';
import BudgetProgress from '../components/BudgetProgress';
import CategoryPieChart from '../components/CategoryPieChart';
import ErrorMessage from '../components/ErrorMessage';
import InsightsRow from '../components/InsightsRow';
import MonthPicker from '../components/MonthPicker';
import QuickAdd from '../components/QuickAdd';
import { SkeletonCards, SkeletonChart } from '../components/Skeletons';
import Sparkline from '../components/Sparkline';
import TrendChart from '../components/TrendChart';
import { useBudgets } from '../hooks/useBudgets';
import { useCountUp } from '../hooks/useCountUp';
import { useInsights, useMonthlySummary, useTrend } from '../hooks/useExpenses';
import { CATEGORY_COLORS } from '../lib/categories';
import { formatCurrency, titleCase } from '../lib/format';
import { CATEGORIES } from '../types/expense';

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value, 400);
  return <>{formatCurrency(animated)}</>;
}

const card =
  'rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900';
const sectionTitle =
  'mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
const microLabel = 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
const statValue = 'text-2xl font-semibold tabular-nums tracking-tight lg:text-3xl';
const footNote = 'text-xs text-slate-400 dark:text-slate-500';

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
  const total = summary.data?.total ?? 0;
  const topShare = topCategory && total > 0 ? (topCategory.total / total) * 100 : 0;
  const usedCategories = new Set(summary.data?.byCategory.map((item) => item.category) ?? []);

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
            {/* Total spent — headline figure, month-over-month delta, 6-month shape */}
            <div className={`${card} flex flex-col`}>
              <div className="flex items-center justify-between gap-2">
                <p className={microLabel}>Total spent</p>
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
              <p className={`mt-2 ${statValue}`}>
                <AnimatedCurrency value={summary.data.total} />
              </p>
              {trend.data && trend.data.length > 1 && (
                <div className="mt-auto pt-3">
                  <Sparkline
                    data={trend.data.map((point) => point.total)}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <p className={`mt-1 ${footNote}`}>Last 6 months</p>
                </div>
              )}
            </div>

            {/* Top category — with its share of the month, not just an amount */}
            <div className={`${card} flex flex-col`}>
              <p className={microLabel}>Top category</p>
              <p className={`mt-2 ${statValue}`}>
                {topCategory ? titleCase(topCategory.category) : '—'}
              </p>
              {topCategory && (
                <div className="mt-auto pt-3">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="tabular-nums text-slate-400 dark:text-slate-500">
                      {formatCurrency(topCategory.total)}
                    </span>
                    <span className="font-semibold tabular-nums">{topShare.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[topCategory.category] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${topShare}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <p className={`mt-1 ${footNote}`}>of this month&rsquo;s spending</p>
                </div>
              )}
            </div>

            {/* Categories used — the dots show *which*, not just how many */}
            <div className={`${card} flex flex-col`}>
              <p className={microLabel}>Categories used</p>
              <p className={`mt-2 ${statValue}`}>
                {usedCategories.size}
                <span className="text-base font-normal text-slate-400 dark:text-slate-500">
                  {' / '}
                  {CATEGORIES.length}
                </span>
              </p>
              <div className="mt-auto pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((category) => (
                    <span
                      key={category}
                      title={titleCase(category)}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[category],
                        opacity: usedCategories.has(category) ? 1 : 0.18,
                      }}
                    />
                  ))}
                </div>
                <p className={`mt-2 ${footNote}`}>
                  {CATEGORIES.length - usedCategories.size} unused this month
                </p>
              </div>
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

import { useState } from 'react';
import { motion } from 'framer-motion';
import BudgetProgress from '../components/BudgetProgress';
import CategoryPieChart from '../components/CategoryPieChart';
import ErrorMessage from '../components/ErrorMessage';
import { LayersIcon, TagIcon, WalletIcon } from '../components/Icons';
import InsightsRow from '../components/InsightsRow';
import MonthPicker from '../components/MonthPicker';
import QuickAdd from '../components/QuickAdd';
import { SkeletonCards, SkeletonChart } from '../components/Skeletons';
import StatCard from '../components/StatCard';
import TrendChart from '../components/TrendChart';
import { useBudgets } from '../hooks/useBudgets';
import { useCountUp } from '../hooks/useCountUp';
import { useInsights, useMonthlySummary, useTrend } from '../hooks/useExpenses';
import { formatCurrency, titleCase } from '../lib/format';

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{formatCurrency(animated)}</>;
}

const panel =
  'glass rounded-2xl p-5 transition-shadow hover:shadow-md';

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
            <StatCard
              featured
              index={0}
              label="Total spent"
              icon={<WalletIcon width={18} height={18} />}
              value={<AnimatedCurrency value={summary.data.total} />}
              changePercent={totalChange}
              sub={totalChange !== undefined ? 'vs last month' : undefined}
            />
            <StatCard
              index={1}
              label="Top category"
              icon={<TagIcon width={18} height={18} />}
              value={topCategory ? titleCase(topCategory.category) : '—'}
              sub={topCategory ? formatCurrency(topCategory.total) : undefined}
            />
            <StatCard
              index={2}
              label="Categories used"
              icon={<LayersIcon width={18} height={18} />}
              value={summary.data.byCategory.length}
              sub={summary.data.byCategory.length === 1 ? 'category' : 'categories'}
            />
          </div>

          {insights.data && <InsightsRow insights={insights.data} />}

          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              whileHover={{ y: -3 }}
              className={panel}
            >
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Spending by category
              </h3>
              <CategoryPieChart data={summary.data.byCategory} year={year} month={month} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              whileHover={{ y: -3 }}
              className={panel}
            >
              <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Last 6 months
              </h3>
              {trend.data ? <TrendChart data={trend.data} /> : <SkeletonChart />}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
            className={panel}
          >
            <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Budgets this month
            </h3>
            <BudgetProgress budgets={budgets.data ?? []} spending={summary.data.byCategory} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

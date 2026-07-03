import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { TrendDownIcon, TrendUpIcon } from './Icons';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  /** Signed percentage vs. a comparison period; renders a coloured pill. */
  changePercent?: number;
  /** Highlighted hero styling (gradient fill). */
  featured?: boolean;
  /** Entrance stagger index. */
  index?: number;
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  changePercent,
  featured = false,
  index = 0,
}: StatCardProps) {
  const hasChange = typeof changePercent === 'number' && Number.isFinite(changePercent);
  const up = (changePercent ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl p-5 transition-shadow ${
        featured
          ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
          : 'glass hover:shadow-md'
      }`}
    >
      {featured && (
        <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
      )}

      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm ${featured ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            featured
              ? 'bg-white/15 text-white'
              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
          }`}
        >
          {icon}
        </span>
      </div>

      <p
        className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${
          featured ? 'text-white' : ''
        }`}
      >
        {value}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {sub && (
          <span className={`text-sm ${featured ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>
            {sub}
          </span>
        )}
        {hasChange && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
              featured
                ? 'bg-white/15 text-white'
                : up
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
            }`}
          >
            {up ? <TrendUpIcon width={12} height={12} /> : <TrendDownIcon width={12} height={12} />}
            {Math.abs(changePercent ?? 0).toFixed(0)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

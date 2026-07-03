import { motion } from 'framer-motion';
import type { ReactElement } from 'react';
import type { Insight } from '../types/budget';
import { SparklesIcon, TrendDownIcon, TrendUpIcon } from './Icons';

function insightStyle(insight: Insight): { icon: ReactElement; classes: string } {
  if (insight.type === 'TOTAL_CHANGE') {
    const up = (insight.changePercent ?? 0) >= 0;
    return up
      ? {
          icon: <TrendUpIcon width={16} height={16} />,
          classes: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
        }
      : {
          icon: <TrendDownIcon width={16} height={16} />,
          classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        };
  }
  return {
    icon: <SparklesIcon width={16} height={16} />,
    classes: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  };
}

export default function InsightsRow({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((insight, index) => {
        const { icon, classes } = insightStyle(insight);
        return (
          <motion.span
            key={insight.type}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${classes}`}
          >
            {icon}
            {insight.message}
          </motion.span>
        );
      })}
    </div>
  );
}

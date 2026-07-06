import type { Insight } from '../types/budget';
import { TrendDownIcon, TrendUpIcon } from './Icons';

function chipClasses(insight: Insight): string {
  if (insight.type === 'TOTAL_CHANGE') {
    // Spending up is bad (red), down is good (green).
    return (insight.changePercent ?? 0) >= 0
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300';
  }
  return 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
}

export default function InsightsRow({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((insight) => (
        <span
          key={insight.type}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${chipClasses(insight)}`}
        >
          {insight.type === 'TOTAL_CHANGE' &&
            ((insight.changePercent ?? 0) >= 0 ? (
              <TrendUpIcon width={13} height={13} />
            ) : (
              <TrendDownIcon width={13} height={13} />
            ))}
          {insight.message}
        </span>
      ))}
    </div>
  );
}

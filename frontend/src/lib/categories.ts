import type { Category } from '../types/expense';

/** Chart palette — muted, data-visualization friendly. */
export const CATEGORY_COLORS: Record<Category, string> = {
  FOOD: '#d97706',
  TRANSPORT: '#2563eb',
  HOUSING: '#7c3aed',
  UTILITIES: '#0891b2',
  ENTERTAINMENT: '#db2777',
  HEALTH: '#059669',
  SHOPPING: '#dc2626',
  OTHER: '#64748b',
};

/** Subtle tinted badges with an inset ring, consistent in both themes. */
export const CATEGORY_BADGE_CLASSES: Record<Category, string> = {
  FOOD: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  TRANSPORT: 'bg-blue-50 text-blue-800 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
  HOUSING: 'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
  UTILITIES: 'bg-cyan-50 text-cyan-800 ring-cyan-600/20 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/20',
  ENTERTAINMENT: 'bg-pink-50 text-pink-800 ring-pink-600/20 dark:bg-pink-400/10 dark:text-pink-300 dark:ring-pink-400/20',
  HEALTH: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  SHOPPING: 'bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20',
  OTHER: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
};

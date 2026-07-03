import type { Category } from '../types/expense';

export const CATEGORY_COLORS: Record<Category, string> = {
  FOOD: '#f59e0b',
  TRANSPORT: '#3b82f6',
  HOUSING: '#8b5cf6',
  UTILITIES: '#06b6d4',
  ENTERTAINMENT: '#ec4899',
  HEALTH: '#10b981',
  SHOPPING: '#ef4444',
  OTHER: '#6b7280',
};

export const CATEGORY_BADGE_CLASSES: Record<Category, string> = {
  FOOD: 'bg-amber-100 text-amber-800',
  TRANSPORT: 'bg-blue-100 text-blue-800',
  HOUSING: 'bg-violet-100 text-violet-800',
  UTILITIES: 'bg-cyan-100 text-cyan-800',
  ENTERTAINMENT: 'bg-pink-100 text-pink-800',
  HEALTH: 'bg-emerald-100 text-emerald-800',
  SHOPPING: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

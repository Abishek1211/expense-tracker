import type { Category } from '../types/expense';

export interface ParsedQuickAdd {
  amount: number;
  category: Category;
  date: string;
  note: string;
}

const CATEGORY_KEYWORDS: Record<string, Category> = {
  // FOOD
  coffee: 'FOOD', tea: 'FOOD', lunch: 'FOOD', dinner: 'FOOD', breakfast: 'FOOD',
  grocery: 'FOOD', groceries: 'FOOD', snack: 'FOOD', snacks: 'FOOD', pizza: 'FOOD',
  restaurant: 'FOOD', swiggy: 'FOOD', zomato: 'FOOD', biryani: 'FOOD', food: 'FOOD',
  // TRANSPORT
  uber: 'TRANSPORT', ola: 'TRANSPORT', cab: 'TRANSPORT', taxi: 'TRANSPORT',
  bus: 'TRANSPORT', train: 'TRANSPORT', metro: 'TRANSPORT', fuel: 'TRANSPORT',
  petrol: 'TRANSPORT', diesel: 'TRANSPORT', auto: 'TRANSPORT', flight: 'TRANSPORT',
  // HOUSING
  rent: 'HOUSING', maintenance: 'HOUSING',
  // UTILITIES
  electricity: 'UTILITIES', water: 'UTILITIES', wifi: 'UTILITIES', internet: 'UTILITIES',
  recharge: 'UTILITIES', broadband: 'UTILITIES', gas: 'UTILITIES', bill: 'UTILITIES',
  // ENTERTAINMENT
  movie: 'ENTERTAINMENT', cinema: 'ENTERTAINMENT', netflix: 'ENTERTAINMENT',
  spotify: 'ENTERTAINMENT', game: 'ENTERTAINMENT', gaming: 'ENTERTAINMENT',
  concert: 'ENTERTAINMENT',
  // HEALTH
  medicine: 'HEALTH', pharmacy: 'HEALTH', doctor: 'HEALTH', gym: 'HEALTH',
  hospital: 'HEALTH', dentist: 'HEALTH',
  // SHOPPING
  amazon: 'SHOPPING', flipkart: 'SHOPPING', clothes: 'SHOPPING', shoes: 'SHOPPING',
  shirt: 'SHOPPING', dress: 'SHOPPING', shopping: 'SHOPPING', myntra: 'SHOPPING',
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses free text like "coffee 150 yesterday" into an expense draft.
 * Returns null when no amount can be found.
 */
export function parseQuickAdd(input: string): ParsedQuickAdd | null {
  const text = input.trim();
  if (!text) return null;

  // Amount: first standalone number (supports 1,234.56)
  const amountMatch = text.match(/(?:^|\s)(?:rs\.?|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)(?=\s|$)/i);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let remaining = text.replace(amountMatch[0], ' ');

  // Date words
  const today = new Date();
  let date = toIso(today);
  const lower = remaining.toLowerCase();

  if (/\byesterday\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    date = toIso(d);
    remaining = remaining.replace(/\byesterday\b/i, ' ');
  } else if (/\btoday\b/.test(lower)) {
    remaining = remaining.replace(/\btoday\b/i, ' ');
  } else {
    const isoMatch = remaining.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoMatch) {
      date = isoMatch[1];
      remaining = remaining.replace(isoMatch[0], ' ');
    } else {
      for (let i = 0; i < WEEKDAYS.length; i++) {
        const pattern = new RegExp(`\\b(?:last\\s+)?${WEEKDAYS[i]}\\b`, 'i');
        if (pattern.test(remaining)) {
          const d = new Date(today);
          const diff = (d.getDay() - i + 7) % 7 || 7; // previous occurrence
          d.setDate(d.getDate() - diff);
          date = toIso(d);
          remaining = remaining.replace(pattern, ' ');
          break;
        }
      }
    }
  }

  // Category from keywords
  let category: Category = 'OTHER';
  for (const word of remaining.toLowerCase().split(/[^a-z]+/)) {
    if (word && CATEGORY_KEYWORDS[word]) {
      category = CATEGORY_KEYWORDS[word];
      break;
    }
  }

  const note = remaining.replace(/\s+/g, ' ').trim();
  const capitalized = note ? note.charAt(0).toUpperCase() + note.slice(1) : '';

  return { amount, category, date, note: capitalized };
}

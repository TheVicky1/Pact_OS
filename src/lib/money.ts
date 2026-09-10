/**
 * PACT Phase 4I-2: Pure Money, Currency & Financial Calculation Layer
 * Enforces integer-cents precision, deterministic formatting, and server-authoritative calculations.
 */

export type TransactionType = 'expense' | 'income';
export type FinanceColorTag = 'gold' | 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  color_tag: FinanceColorTag;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount_cents: number;
  description: string;
  transaction_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; color_tag: FinanceColorTag } | null;
}

export interface FinanceSummary {
  balanceCents: number;
  totalIncomeCents: number;
  totalExpensesCents: number;
  netSavingsCents: number;
  savingsRatePercent: number;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  colorTag: FinanceColorTag;
  totalCents: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrendItem {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Sep 2026"
  incomeCents: number;
  expenseCents: number;
  netSavingsCents: number;
}

/**
 * Formats a "YYYY-MM" string to "Month YYYY" (e.g. "September 2026").
 */
export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month) return yearMonth;
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Safely parses a user-entered monetary amount string into integer cents.
 * Handles inputs like "45", "45.5", "45.99", "1,250.00", "₹1200".
 */
export function parseAmountToCents(input: string | number): {
  cents: number | null;
  error: string | null;
} {
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input) || input <= 0) {
      return { cents: null, error: 'Amount must be greater than zero.' };
    }
    const cents = Math.round(input * 100);
    return { cents, error: null };
  }

  if (typeof input !== 'string' || !input.trim()) {
    return { cents: null, error: 'Amount is required.' };
  }

  // Strip currency symbols and whitespace
  const sanitized = input.replace(/[^0-9.,]/g, '').trim();
  if (!sanitized) {
    return { cents: null, error: 'Please enter a valid numeric amount.' };
  }

  // Normalize commas as thousand separators or decimal point
  // Standard format: commas removed, dot as decimal
  const normalized = sanitized.replace(/,/g, '');
  const num = parseFloat(normalized);

  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return { cents: null, error: 'Amount must be a positive number.' };
  }

  // Check maximum safe financial amount (e.g. 100 million = 100,000,000)
  if (num > 100000000) {
    return { cents: null, error: 'Amount exceeds maximum allowable threshold.' };
  }

  const cents = Math.round(num * 100);
  return { cents, error: null };
}

/**
 * Formats integer cents into a localized currency string.
 * Defaults to INR (₹) or standard ISO currency code.
 */
export function formatCentsToCurrency(
  cents: number,
  currencyCode: string = 'INR',
  options?: { showFractional?: boolean; compact?: boolean }
): string {
  const amount = cents / 100;
  const isINR = currencyCode.toUpperCase() === 'INR';

  try {
    const formatter = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: options?.showFractional === false ? 0 : 2,
      maximumFractionDigits: 2,
      notation: options?.compact ? 'compact' : 'standard',
    });

    return formatter.format(amount);
  } catch {
    const symbol = isINR ? '₹' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Computes authoritative financial summary metrics from a list of transactions.
 */
export function calculateFinanceSummary(
  transactions: FinanceTransaction[]
): FinanceSummary {
  let totalIncomeCents = 0;
  let totalExpensesCents = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncomeCents += t.amount_cents;
    } else if (t.type === 'expense') {
      totalExpensesCents += t.amount_cents;
    }
  }

  const netSavingsCents = totalIncomeCents - totalExpensesCents;
  const savingsRatePercent =
    totalIncomeCents > 0
      ? Math.max(0, Math.round((netSavingsCents / totalIncomeCents) * 100))
      : 0;

  return {
    balanceCents: netSavingsCents,
    totalIncomeCents,
    totalExpensesCents,
    netSavingsCents,
    savingsRatePercent,
    transactionCount: transactions.length,
  };
}

/**
 * Computes category breakdown for expenses.
 */
export function calculateCategoryBreakdown(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[]
): CategoryBreakdownItem[] {
  const categoryMap = new Map<string, FinanceCategory>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  let totalExpenseCents = 0;
  const totalsByCat = new Map<string, { cents: number; count: number }>();

  for (const t of expenseTransactions) {
    totalExpenseCents += t.amount_cents;
    const catId = t.category_id || 'uncategorized';
    const current = totalsByCat.get(catId) || { cents: 0, count: 0 };
    current.cents += t.amount_cents;
    current.count += 1;
    totalsByCat.set(catId, current);
  }

  const breakdown: CategoryBreakdownItem[] = [];

  for (const [catId, data] of totalsByCat.entries()) {
    const category = catId !== 'uncategorized' ? categoryMap.get(catId) : null;
    const categoryName = category?.name || (catId === 'uncategorized' ? 'Uncategorized' : 'Other');
    const colorTag = category?.color_tag || 'slate';
    const percentage =
      totalExpenseCents > 0
        ? Math.round((data.cents / totalExpenseCents) * 100)
        : 0;

    breakdown.push({
      categoryId: catId === 'uncategorized' ? null : catId,
      categoryName,
      colorTag,
      totalCents: data.cents,
      percentage,
      count: data.count,
    });
  }

  // Sort descending by total spent
  breakdown.sort((a, b) => b.totalCents - a.totalCents);
  return breakdown;
}

/**
 * Computes monthly trend data comparing income vs expenses for real historical months.
 */
export function calculateMonthlyTrends(
  transactions: FinanceTransaction[],
  timeZone: string,
  monthsCount: number = 6
): MonthlyTrendItem[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const groups = new Map<string, { incomeCents: number; expenseCents: number }>();

  for (const t of transactions) {
    // t.transaction_date is "YYYY-MM-DD"
    const monthKey = t.transaction_date.slice(0, 7); // "YYYY-MM"
    const current = groups.get(monthKey) || { incomeCents: 0, expenseCents: 0 };
    if (t.type === 'income') {
      current.incomeCents += t.amount_cents;
    } else if (t.type === 'expense') {
      current.expenseCents += t.amount_cents;
    }
    groups.set(monthKey, current);
  }

  // Sort months chronologically
  const sortedKeys = Array.from(groups.keys()).sort();
  const recentKeys = sortedKeys.slice(-monthsCount);

  return recentKeys.map((monthKey) => {
    const data = groups.get(monthKey)!;
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1, 15));
    const monthLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      month: 'short',
      year: 'numeric',
    }).format(d);

    return {
      monthKey,
      monthLabel,
      incomeCents: data.incomeCents,
      expenseCents: data.expenseCents,
      netSavingsCents: data.incomeCents - data.expenseCents,
    };
  });
}

/**
 * Default starter categories for new users.
 */
export const DEFAULT_FINANCE_CATEGORIES: Array<{
  name: string;
  color_tag: FinanceColorTag;
}> = [
  { name: 'Housing & Utilities', color_tag: 'gold' },
  { name: 'Food & Dining', color_tag: 'amber' },
  { name: 'Transport', color_tag: 'blue' },
  { name: 'Work & Tech', color_tag: 'cyan' },
  { name: 'Health & Fitness', color_tag: 'emerald' },
  { name: 'Entertainment', color_tag: 'purple' },
  { name: 'Salary / Income', color_tag: 'emerald' },
  { name: 'Freelance & Business', color_tag: 'gold' },
];

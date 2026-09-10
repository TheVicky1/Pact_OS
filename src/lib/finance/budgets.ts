/**
 * PACT Phase 5E: Pure Budget Calculation & Discipline Engine
 * Calculates category budget limits, monthly spending, remaining balance,
 * utilization percentages, and idempotent notification thresholds.
 */

import { FinanceCategory, FinanceColorTag, FinanceTransaction } from '../money';

export interface FinanceBudget {
  id: string;
  user_id: string;
  category_id: string;
  period: string; // "YYYY-MM"
  limit_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; color_tag: FinanceColorTag } | null;
}

export interface CategoryBudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  colorTag: FinanceColorTag;
  period: string; // "YYYY-MM"
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  utilizationPercent: number;
  isApproaching: boolean; // >= 80% and < 100%
  isExceeded: boolean;    // >= 100%
}

export interface MonthlyBudgetOverview {
  period: string;
  totalBudgetLimitCents: number;
  totalBudgetSpentCents: number;
  totalBudgetRemainingCents: number;
  overallUtilizationPercent: number;
  categories: CategoryBudgetStatus[];
  exceededCount: number;
  approachingCount: number;
}

/**
 * Computes category budget status and monthly aggregate utilization.
 */
export function calculateBudgetStatus(
  budgets: FinanceBudget[],
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  period: string
): MonthlyBudgetOverview {
  const categoryMap = new Map<string, FinanceCategory>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  // Filter transactions for this specific month period and type = 'expense'
  const monthlyExpenses = transactions.filter((t) => {
    const txPeriod = t.transaction_date.slice(0, 7);
    return txPeriod === period && t.type === 'expense';
  });

  // Calculate total spent per category in cents
  const spendingByCat = new Map<string, number>();
  for (const t of monthlyExpenses) {
    const catId = t.category_id || 'uncategorized';
    spendingByCat.set(catId, (spendingByCat.get(catId) || 0) + t.amount_cents);
  }

  const activeBudgets = budgets.filter((b) => b.is_active && b.period === period);
  const categoryStatuses: CategoryBudgetStatus[] = [];

  let totalLimitCents = 0;
  let totalSpentInBudgetsCents = 0;
  let exceededCount = 0;
  let approachingCount = 0;

  for (const b of activeBudgets) {
    const cat = categoryMap.get(b.category_id);
    const catName = cat?.name || 'Category';
    const colorTag = cat?.color_tag || 'gold';
    const spentCents = spendingByCat.get(b.category_id) || 0;
    const remainingCents = b.limit_cents - spentCents;
    const utilizationPercent =
      b.limit_cents > 0 ? Math.round((spentCents / b.limit_cents) * 100) : 0;

    const isExceeded = spentCents >= b.limit_cents;
    const isApproaching = spentCents >= Math.round(b.limit_cents * 0.8) && !isExceeded;

    if (isExceeded) exceededCount++;
    if (isApproaching) approachingCount++;

    totalLimitCents += b.limit_cents;
    totalSpentInBudgetsCents += spentCents;

    categoryStatuses.push({
      budgetId: b.id,
      categoryId: b.category_id,
      categoryName: catName,
      colorTag,
      period,
      limitCents: b.limit_cents,
      spentCents,
      remainingCents,
      utilizationPercent,
      isApproaching,
      isExceeded,
    });
  }

  // Sort by utilization percentage descending (highest utilized first)
  categoryStatuses.sort((a, b) => b.utilizationPercent - a.utilizationPercent);

  const totalRemainingCents = totalLimitCents - totalSpentInBudgetsCents;
  const overallUtilizationPercent =
    totalLimitCents > 0
      ? Math.round((totalSpentInBudgetsCents / totalLimitCents) * 100)
      : 0;

  return {
    period,
    totalBudgetLimitCents: totalLimitCents,
    totalBudgetSpentCents: totalSpentInBudgetsCents,
    totalBudgetRemainingCents: totalRemainingCents,
    overallUtilizationPercent,
    categories: categoryStatuses,
    exceededCount,
    approachingCount,
  };
}

/**
 * Evaluates whether a budget alert notification should be dispatched for a category status.
 */
export function evaluateBudgetAlert(
  userId: string,
  status: CategoryBudgetStatus
): {
  shouldNotify: boolean;
  type?: 'budget_approaching_limit' | 'budget_exceeded';
  title?: string;
  body?: string;
  idempotencyKey?: string;
} {
  if (status.isExceeded) {
    return {
      shouldNotify: true,
      type: 'budget_exceeded',
      title: `Budget Exceeded: ${status.categoryName}`,
      body: `You have spent 100% or more of your ${status.period} budget for ${status.categoryName}.`,
      idempotencyKey: `budget_exceeded_${userId}_${status.categoryId}_${status.period}`,
    };
  }

  if (status.isApproaching) {
    return {
      shouldNotify: true,
      type: 'budget_approaching_limit',
      title: `Budget Alert: ${status.categoryName}`,
      body: `You have reached ${status.utilizationPercent}% of your ${status.period} budget for ${status.categoryName}.`,
      idempotencyKey: `budget_approaching_${userId}_${status.categoryId}_${status.period}`,
    };
  }

  return { shouldNotify: false };
}

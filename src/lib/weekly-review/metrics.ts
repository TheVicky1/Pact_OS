/**
 * PACT Phase 6D: Weekly Review Pure Metrics Aggregation Engine
 * Deterministically computes weekly metrics across all 7 PACT domains:
 * Tasks, Goals/Projects, Accountability, Focus, Habits, and Finance.
 */

import {
  WeeklyTaskMetrics,
  WeeklyGoalProjectMetrics,
  WeeklyAccountabilityMetrics,
  WeeklyFocusMetrics,
  WeeklyHabitMetrics,
  WeeklyFinanceMetrics,
  WeeklyReviewMetrics,
  CategoryBudgetUtilization,
} from './types';
import { formatDurationHoursMinutes } from '../analytics';
import { formatCentsToCurrency } from '../money';

export interface RawTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at?: string;
  deadline_at?: string;
  completed_at?: string | null;
  missed_at?: string | null;
  goal_id?: string | null;
  project_id?: string | null;
}

export interface RawGoalItem {
  id: string;
  title: string;
  status: string;
}

export interface RawProjectItem {
  id: string;
  title: string;
  status: string;
  goal_id?: string | null;
}

export interface RawAccountabilityItem {
  id: string;
  commitment_status: string;
  activated_at?: string | null;
}

export interface RawFocusSessionItem {
  id: string;
  status: string;
  mode: string;
  planned_duration_seconds: number;
  started_at: string;
  ended_at?: string | null;
  accumulated_paused_seconds?: number;
  completion_reason?: string | null;
}

export interface RawHabitOccurrenceItem {
  id: string;
  habit_template_id: string;
  scheduled_date: string; // YYYY-MM-DD
  status: string; // 'pending' | 'completed' | 'skipped' | 'missed'
}

export interface RawFinanceTransactionItem {
  id: string;
  category_id?: string | null;
  amount_cents: number;
  transaction_type: 'income' | 'expense';
  transaction_date: string; // YYYY-MM-DD
}

export interface RawFinanceBudgetItem {
  id: string;
  category_id: string;
  target_amount_cents: number;
  period: string; // 'monthly'
  categories?: {
    id: string;
    name: string;
    color_tag: string;
  } | null;
}

export interface RawFinanceCategoryItem {
  id: string;
  name: string;
  color_tag: string;
}

/**
 * Computes task metrics for the week interval [startDateStr, endDateStr].
 */
export function calculateWeeklyTaskMetrics(
  tasks: RawTaskItem[],
  startDateStr: string,
  endDateStr: string,
  timeZone: string
): WeeklyTaskMetrics {
  let createdCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let pendingCount = 0;
  let missedCount = 0;

  const toLocalDate = (isoStr?: string | null): string | null => {
    if (!isoStr) return null;
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(isoStr));
    } catch {
      return null;
    }
  };

  for (const t of tasks) {
    const createdDate = toLocalDate(t.created_at);
    const completedDate = toLocalDate(t.completed_at);
    const deadlineDate = toLocalDate(t.deadline_at);
    const missedDate = toLocalDate(t.missed_at);

    if (createdDate && createdDate >= startDateStr && createdDate <= endDateStr) {
      createdCount++;
    }

    if (t.status === 'completed' && completedDate && completedDate >= startDateStr && completedDate <= endDateStr) {
      completedCount++;
    }

    if (t.status === 'missed' && missedDate && missedDate >= startDateStr && missedDate <= endDateStr) {
      missedCount++;
    }

    if (t.status === 'pending') {
      pendingCount++;
      if (deadlineDate && deadlineDate < startDateStr) {
        overdueCount++;
      } else if (deadlineDate && deadlineDate >= startDateStr && deadlineDate <= endDateStr && deadlineDate < endDateStr) {
        // Due earlier in week and still pending
        overdueCount++;
      }
    }
  }

  const denominator = completedCount + missedCount + pendingCount;
  const completionRate = denominator > 0 ? Math.round((completedCount / denominator) * 100) : (completedCount > 0 ? 100 : 0);

  return {
    createdCount,
    completedCount,
    overdueCount,
    pendingCount,
    missedCount,
    completionRate: Math.min(100, Math.max(0, completionRate)),
  };
}

/**
 * Computes goals and projects metrics.
 */
export function calculateWeeklyGoalProjectMetrics(
  goals: RawGoalItem[],
  projects: RawProjectItem[],
  tasks: RawTaskItem[]
): WeeklyGoalProjectMetrics {
  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeProjects = projects.filter((p) => p.status === 'active');

  let goalsWithProgressCount = 0;
  let stalledGoalsCount = 0;

  for (const g of activeGoals) {
    const goalTasks = tasks.filter((t) => t.goal_id === g.id);
    const hasCompletedTask = goalTasks.some((t) => t.status === 'completed');
    if (hasCompletedTask) {
      goalsWithProgressCount++;
    } else {
      stalledGoalsCount++;
    }
  }

  return {
    activeGoalsCount: activeGoals.length,
    activeProjectsCount: activeProjects.length,
    goalsWithProgressCount,
    stalledGoalsCount,
  };
}

/**
 * Computes accountability metrics.
 */
export function calculateWeeklyAccountabilityMetrics(
  commitments: RawAccountabilityItem[]
): WeeklyAccountabilityMetrics {
  let totalActivated = 0;
  let totalFulfilled = 0;
  let totalMissed = 0;
  let totalWaived = 0;
  let unresolvedCount = 0;

  for (const c of commitments) {
    if (c.commitment_status === 'activated') {
      totalActivated++;
      unresolvedCount++;
    } else if (c.commitment_status === 'fulfilled') {
      totalActivated++;
      totalFulfilled++;
    } else if (c.commitment_status === 'missed') {
      totalActivated++;
      totalMissed++;
    } else if (c.commitment_status === 'waived') {
      totalActivated++;
      totalWaived++;
    }
  }

  return {
    totalActivated,
    totalFulfilled,
    totalMissed,
    totalWaived,
    unresolvedCount,
  };
}

/**
 * Computes focus metrics for sessions completed or ended within the week window.
 */
export function calculateWeeklyFocusMetrics(
  sessions: RawFocusSessionItem[],
  startDateStr: string,
  endDateStr: string,
  timeZone: string
): WeeklyFocusMetrics {
  let totalSeconds = 0;
  let completedSessions = 0;
  let interruptedSessions = 0;

  const toLocalDate = (isoStr?: string | null): string | null => {
    if (!isoStr) return null;
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(isoStr));
    } catch {
      return null;
    }
  };

  for (const s of sessions) {
    const sessionDate = toLocalDate(s.ended_at || s.started_at);
    if (!sessionDate || sessionDate < startDateStr || sessionDate > endDateStr) {
      continue;
    }

    if (s.status === 'completed') {
      completedSessions++;
      if (s.mode === 'countdown') {
        const paused = s.accumulated_paused_seconds || 0;
        totalSeconds += Math.max(0, s.planned_duration_seconds - paused);
      } else if (s.started_at && s.ended_at) {
        const diffSec = Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000);
        const paused = s.accumulated_paused_seconds || 0;
        totalSeconds += Math.max(0, diffSec - paused);
      }
    } else if (s.status === 'abandoned') {
      interruptedSessions++;
    }
  }

  const totalSessions = completedSessions + interruptedSessions;
  const averageSessionMinutes = completedSessions > 0
    ? Math.round((totalSeconds / 60) / completedSessions)
    : 0;

  return {
    totalSessions,
    totalSeconds,
    formattedDuration: formatDurationHoursMinutes(totalSeconds),
    completedSessions,
    interruptedSessions,
    averageSessionMinutes,
  };
}

/**
 * Computes habits metrics for occurrences falling within the week.
 */
export function calculateWeeklyHabitMetrics(
  occurrences: RawHabitOccurrenceItem[],
  activeHabitsCount: number,
  startDateStr: string,
  endDateStr: string
): WeeklyHabitMetrics {
  let scheduledOccurrences = 0;
  let completedOccurrences = 0;
  let missedOccurrences = 0;
  let skippedOccurrences = 0;

  for (const o of occurrences) {
    if (o.scheduled_date >= startDateStr && o.scheduled_date <= endDateStr) {
      scheduledOccurrences++;
      if (o.status === 'completed') completedOccurrences++;
      else if (o.status === 'missed') missedOccurrences++;
      else if (o.status === 'skipped') skippedOccurrences++;
    }
  }

  const denominator = completedOccurrences + missedOccurrences;
  const completionRate = denominator > 0
    ? Math.round((completedOccurrences / denominator) * 100)
    : (completedOccurrences > 0 ? 100 : 0);

  return {
    scheduledOccurrences,
    completedOccurrences,
    missedOccurrences,
    skippedOccurrences,
    completionRate: Math.min(100, Math.max(0, completionRate)),
    activeHabitsCount,
  };
}

/**
 * Computes weekly financial metrics and budget utilization.
 */
export function calculateWeeklyFinanceMetrics(
  transactions: RawFinanceTransactionItem[],
  budgets: RawFinanceBudgetItem[],
  categories: RawFinanceCategoryItem[],
  startDateStr: string,
  endDateStr: string
): WeeklyFinanceMetrics {
  let totalIncomeCents = 0;
  let totalExpenseCents = 0;

  const categorySpendingMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.transaction_date >= startDateStr && tx.transaction_date <= endDateStr) {
      if (tx.transaction_type === 'income') {
        totalIncomeCents += tx.amount_cents;
      } else if (tx.transaction_type === 'expense') {
        totalExpenseCents += tx.amount_cents;
        if (tx.category_id) {
          const current = categorySpendingMap.get(tx.category_id) || 0;
          categorySpendingMap.set(tx.category_id, current + tx.amount_cents);
        }
      }
    }
  }

  const netCashFlowCents = totalIncomeCents - totalExpenseCents;

  const categoryUtilizations: CategoryBudgetUtilization[] = [];
  let exceededBudgetsCount = 0;

  for (const b of budgets) {
    const catName = b.categories?.name || categories.find((c) => c.id === b.category_id)?.name || 'General';
    const colorTag = b.categories?.color_tag || categories.find((c) => c.id === b.category_id)?.color_tag || '#6366f1';
    const spentCents = categorySpendingMap.get(b.category_id) || 0;
    // For weekly review against monthly budget, prorate or compare direct spending
    const budgetCents = b.target_amount_cents;
    const utilizationPercent = budgetCents > 0 ? Math.round((spentCents / budgetCents) * 100) : 0;
    const isOverBudget = spentCents > budgetCents;

    if (isOverBudget) exceededBudgetsCount++;

    categoryUtilizations.push({
      categoryId: b.category_id,
      categoryName: catName,
      colorTag,
      spentCents,
      budgetCents,
      utilizationPercent,
      isOverBudget,
    });
  }

  return {
    totalIncomeCents,
    totalExpenseCents,
    netCashFlowCents,
    formattedIncome: formatCentsToCurrency(totalIncomeCents),
    formattedExpense: formatCentsToCurrency(totalExpenseCents),
    formattedNet: formatCentsToCurrency(netCashFlowCents),
    categoryUtilizations,
    exceededBudgetsCount,
  };
}

/**
 * Computes all authoritative weekly review metrics across all domains.
 */
export function calculateAllWeeklyMetrics(params: {
  tasks: RawTaskItem[];
  goals: RawGoalItem[];
  projects: RawProjectItem[];
  commitments: RawAccountabilityItem[];
  focusSessions: RawFocusSessionItem[];
  habitOccurrences: RawHabitOccurrenceItem[];
  activeHabitsCount: number;
  transactions: RawFinanceTransactionItem[];
  budgets: RawFinanceBudgetItem[];
  categories: RawFinanceCategoryItem[];
  startDateStr: string;
  endDateStr: string;
  timeZone: string;
}): WeeklyReviewMetrics {
  const {
    tasks,
    goals,
    projects,
    commitments,
    focusSessions,
    habitOccurrences,
    activeHabitsCount,
    transactions,
    budgets,
    categories,
    startDateStr,
    endDateStr,
    timeZone,
  } = params;

  return {
    tasks: calculateWeeklyTaskMetrics(tasks, startDateStr, endDateStr, timeZone),
    goalsAndProjects: calculateWeeklyGoalProjectMetrics(goals, projects, tasks),
    accountability: calculateWeeklyAccountabilityMetrics(commitments),
    focus: calculateWeeklyFocusMetrics(focusSessions, startDateStr, endDateStr, timeZone),
    habits: calculateWeeklyHabitMetrics(habitOccurrences, activeHabitsCount, startDateStr, endDateStr),
    finance: calculateWeeklyFinanceMetrics(transactions, budgets, categories, startDateStr, endDateStr),
  };
}

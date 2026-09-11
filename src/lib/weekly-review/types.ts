/**
 * PACT Phase 6D: Structured Weekly Review & Sunday Planning Ritual Types
 * Strictly typed domain entities, factual metrics, structured reflections,
 * cleanup decisions, and next-week planning commitments.
 */

import { Task, Goal, Project } from '../../types/domain';
import { HabitTemplate } from '../habits/types';

export type WeeklyReviewStatus = 'in_progress' | 'completed';
export type WeeklyReviewStep = 1 | 2 | 3 | 4 | 5;

export interface WeeklyTaskMetrics {
  createdCount: number;
  completedCount: number;
  overdueCount: number;
  pendingCount: number;
  missedCount: number;
  completionRate: number; // 0 - 100 percentage
}

export interface WeeklyGoalProjectMetrics {
  activeGoalsCount: number;
  activeProjectsCount: number;
  goalsWithProgressCount: number;
  stalledGoalsCount: number;
}

export interface WeeklyAccountabilityMetrics {
  totalActivated: number;
  totalFulfilled: number;
  totalMissed: number;
  totalWaived: number;
  unresolvedCount: number;
}

export interface WeeklyFocusMetrics {
  totalSessions: number;
  totalSeconds: number;
  formattedDuration: string;
  completedSessions: number;
  interruptedSessions: number;
  averageSessionMinutes: number;
}

export interface WeeklyHabitMetrics {
  scheduledOccurrences: number;
  completedOccurrences: number;
  missedOccurrences: number;
  skippedOccurrences: number;
  completionRate: number; // 0 - 100 percentage
  activeHabitsCount: number;
}

export interface CategoryBudgetUtilization {
  categoryId: string;
  categoryName: string;
  colorTag: string;
  spentCents: number;
  budgetCents: number;
  utilizationPercent: number;
  isOverBudget: boolean;
}

export interface WeeklyFinanceMetrics {
  totalIncomeCents: number;
  totalExpenseCents: number;
  netCashFlowCents: number;
  formattedIncome: string;
  formattedExpense: string;
  formattedNet: string;
  categoryUtilizations: CategoryBudgetUtilization[];
  exceededBudgetsCount: number;
}

export interface WeeklyReviewMetrics {
  tasks: WeeklyTaskMetrics;
  goalsAndProjects: WeeklyGoalProjectMetrics;
  accountability: WeeklyAccountabilityMetrics;
  focus: WeeklyFocusMetrics;
  habits: WeeklyHabitMetrics;
  finance: WeeklyFinanceMetrics;
}

export interface WeeklyReflection {
  biggestWin: string;
  biggestChallenge: string;
  whatWorked: string;
  whatDidNotWork: string;
  lessonLearned: string;
  whatToStop: string;
  whatToContinue: string;
  whatToStart: string;
}

export interface RescheduledTaskItem {
  taskId: string;
  title: string;
  previousDeadline: string;
  newDeadline: string;
  reason?: string;
}

export interface CarriedForwardTaskItem {
  taskId: string;
  title: string;
  newDeadline: string;
}

export interface ArchivedTaskItem {
  taskId: string;
  title: string;
}

export interface PausedHabitItem {
  habitId: string;
  name: string;
}

export interface WeeklyCleanupDecisions {
  rescheduledTasks: RescheduledTaskItem[];
  carriedForwardTasks: CarriedForwardTaskItem[];
  archivedTasks: ArchivedTaskItem[];
  pausedHabits: PausedHabitItem[];
}

export interface TopPriorityItem {
  id: string;
  text: string;
}

export interface NextWeekPlan {
  topPriorities: TopPriorityItem[];
  committedTaskIds: string[];
  focusGoalIds: string[];
  focusProjectIds: string[];
  targetHabitIds: string[];
  focusTargetMinutes?: number;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD (ISO Monday)
  week_end: string; // YYYY-MM-DD (ISO Sunday)
  status: WeeklyReviewStatus;
  current_step: number;
  reflection: WeeklyReflection;
  cleanup_decisions: WeeklyCleanupDecisions;
  next_week_plan: NextWeekPlan;
  snapshot_metrics: WeeklyReviewMetrics | null;
  started_at: string;
  completed_at: string | null;
  committed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReviewBootstrapData {
  currentReview: WeeklyReview | null;
  weekStart: string; // YYYY-MM-DD (ISO Monday)
  weekEnd: string; // YYYY-MM-DD (ISO Sunday)
  weekLabel: string;
  isSundayRitual: boolean;
  isReviewAvailable: boolean;
  userTimezone: string;
  liveMetrics: WeeklyReviewMetrics;
  unfinishedTasks: Task[];
  activeGoals: Goal[];
  activeProjects: Project[];
  activeHabits: HabitTemplate[];
  historyReviews: WeeklyReview[];
}

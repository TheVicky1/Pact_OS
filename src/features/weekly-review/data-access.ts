/**
 * PACT Phase 6D: Weekly Review & Planning Data Access Layer
 * Authenticated, tenant-isolated data loaders aggregating domain entities
 * across Tasks, Goals, Projects, Accountability, Focus, Habits, and Finance.
 */

import { createClient } from '@/lib/supabase/server';
import {
  WeeklyReview,
  WeeklyReviewBootstrapData,
} from '@/lib/weekly-review/types';
import {
  getReviewWeekBounds,
  isSundayRitualDay,
  isReviewAvailable,
} from '@/lib/weekly-review/week';
import {
  calculateAllWeeklyMetrics,
  RawTaskItem,
  RawGoalItem,
  RawProjectItem,
  RawAccountabilityItem,
  RawFocusSessionItem,
  RawHabitOccurrenceItem,
  RawFinanceTransactionItem,
  RawFinanceBudgetItem,
  RawFinanceCategoryItem,
} from '@/lib/weekly-review/metrics';
import { getLocalDateString } from '@/lib/time';
import { Task, Goal, Project } from '@/types/domain';
import { HabitTemplate } from '@/lib/habits/types';

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Loads all data needed to bootstrap the weekly review workspace for a given week.
 * If weekStart is omitted, defaults to the current week in the user's authoritative timezone.
 */
export async function getWeeklyReviewBootstrapData(options?: {
  weekStart?: string;
  dateStr?: string;
}): Promise<WeeklyReviewBootstrapData | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // 1. Fetch user profile for authoritative IANA timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const userTimezone = profile?.timezone || 'UTC';
    const todayLocalDateStr = getLocalDateString(new Date(), userTimezone);
    const targetDateStr = options?.weekStart || options?.dateStr || todayLocalDateStr;
    const weekBounds = getReviewWeekBounds(targetDateStr, userTimezone);

    // 2. Parallel queries across all domains
    const [
      reviewRes,
      tasksRes,
      goalsRes,
      projectsRes,
      commitmentsRes,
      focusRes,
      habitsTemplatesRes,
      habitsOccurrencesRes,
      financeTxRes,
      financeBudgetsRes,
      financeCatsRes,
      historyReviewsRes,
    ] = await Promise.all([
      // Current week review entity
      supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekBounds.weekStart)
        .maybeSingle(),
      // Tasks
      supabase
        .from('tasks')
        .select('id, title, status, priority, created_at, deadline_at, completed_at, missed_at, goal_id, project_id, description')
        .eq('user_id', user.id)
        .order('deadline_at', { ascending: true }),
      // Goals
      supabase
        .from('goals')
        .select('id, title, status, target_date, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      // Projects
      supabase
        .from('projects')
        .select('id, title, status, goal_id, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      // Accountability Commitments
      supabase
        .from('task_accountability_commitments')
        .select('id, commitment_status, activated_at')
        .eq('user_id', user.id),
      // Focus Sessions
      supabase
        .from('focus_sessions')
        .select('id, status, mode, planned_duration_seconds, started_at, ended_at, accumulated_paused_seconds, completion_reason')
        .eq('user_id', user.id),
      // Habit Templates
      supabase
        .from('habit_templates')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived'),
      // Habit Occurrences for week window
      supabase
        .from('habit_occurrences')
        .select('id, habit_template_id, scheduled_date, status')
        .eq('user_id', user.id)
        .gte('scheduled_date', weekBounds.weekStart)
        .lte('scheduled_date', weekBounds.weekEnd),
      // Finance Transactions for week window
      supabase
        .from('finance_transactions')
        .select('id, category_id, amount_cents, transaction_type, transaction_date')
        .eq('user_id', user.id)
        .gte('transaction_date', weekBounds.weekStart)
        .lte('transaction_date', weekBounds.weekEnd),
      // Finance Budgets
      supabase
        .from('finance_budgets')
        .select('id, category_id, target_amount_cents, period, categories:finance_categories(id, name, color_tag)')
        .eq('user_id', user.id),
      // Finance Categories
      supabase
        .from('finance_categories')
        .select('id, name, color_tag')
        .eq('user_id', user.id),
      // History Reviews
      supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(12),
    ]);

    const currentReview = (reviewRes.data as WeeklyReview | null) || null;
    const allTasks = (tasksRes.data || []) as unknown as Task[];
    const allGoals = (goalsRes.data || []) as unknown as Goal[];
    const allProjects = (projectsRes.data || []) as unknown as Project[];
    const allHabitTemplates = (habitsTemplatesRes.data || []) as unknown as HabitTemplate[];
    const historyReviews = (historyReviewsRes.data || []) as unknown as WeeklyReview[];

    // 3. Compute live authoritative metrics for this week
    const liveMetrics = calculateAllWeeklyMetrics({
      tasks: (tasksRes.data || []) as unknown as RawTaskItem[],
      goals: (goalsRes.data || []) as unknown as RawGoalItem[],
      projects: (projectsRes.data || []) as unknown as RawProjectItem[],
      commitments: (commitmentsRes.data || []) as unknown as RawAccountabilityItem[],
      focusSessions: (focusRes.data || []) as unknown as RawFocusSessionItem[],
      habitOccurrences: (habitsOccurrencesRes.data || []) as unknown as RawHabitOccurrenceItem[],
      activeHabitsCount: allHabitTemplates.filter((h) => h.status === 'active').length,
      transactions: (financeTxRes.data || []) as unknown as RawFinanceTransactionItem[],
      budgets: (financeBudgetsRes.data || []) as unknown as RawFinanceBudgetItem[],
      categories: (financeCatsRes.data || []) as unknown as RawFinanceCategoryItem[],
      startDateStr: weekBounds.weekStart,
      endDateStr: weekBounds.weekEnd,
      timeZone: userTimezone,
    });

    // 4. Identify unfinished/overdue tasks for Step 4 Cleanup
    const unfinishedTasks = allTasks.filter(
      (t) => t.status === 'pending' || t.status === 'missed'
    );

    const isSundayRitual = isSundayRitualDay(todayLocalDateStr, userTimezone);
    const reviewAvailable = isReviewAvailable(
      todayLocalDateStr,
      weekBounds.weekEnd,
      userTimezone
    );

    return {
      currentReview,
      weekStart: weekBounds.weekStart,
      weekEnd: weekBounds.weekEnd,
      weekLabel: weekBounds.weekLabel,
      isSundayRitual,
      isReviewAvailable: reviewAvailable,
      userTimezone,
      liveMetrics,
      unfinishedTasks,
      activeGoals: allGoals.filter((g) => g.status === 'active'),
      activeProjects: allProjects.filter((p) => p.status === 'active'),
      activeHabits: allHabitTemplates.filter((h) => h.status === 'active'),
      historyReviews,
    };
  } catch (err: unknown) {
    console.error('getWeeklyReviewBootstrapData error:', err);
    return null;
  }
}

/**
 * Retrieves historical completed weekly reviews for the authenticated user.
 */
export async function getHistoricalWeeklyReviews(
  limit: number = 20
): Promise<DataAccessResult<WeeklyReview[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as WeeklyReview[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve review history.';
    return { data: null, error: msg };
  }
}

/**
 * Retrieves a single weekly review by ID with strict ownership validation.
 */
export async function getWeeklyReviewById(
  reviewId: string
): Promise<DataAccessResult<WeeklyReview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return { data: null, error: 'Weekly review not found.' };
    }

    return { data: data as WeeklyReview, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve weekly review.';
    return { data: null, error: msg };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import {
  startWeeklyReviewSchema,
  saveReviewDraftSchema,
  commitWeeklyReviewSchema,
  carryForwardTasksSchema,
  reopenWeeklyReviewSchema,
} from '@/lib/validations/weekly-review';
import { getReviewWeekBounds } from '@/lib/weekly-review/week';
import { calculateAllWeeklyMetrics, RawTaskItem, RawGoalItem, RawProjectItem, RawAccountabilityItem, RawFocusSessionItem, RawHabitOccurrenceItem, RawFinanceTransactionItem, RawFinanceBudgetItem, RawFinanceCategoryItem } from '@/lib/weekly-review/metrics';
import { getLocalDateString } from '@/lib/time';
import { WeeklyReview } from '@/lib/weekly-review/types';
import { revalidatePath } from 'next/cache';

export interface WeeklyReviewActionResult<T = WeeklyReview> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Initializes or retrieves an in-progress weekly review entity for a specific week.
 */
export async function startWeeklyReviewAction(
  payload?: unknown
): Promise<WeeklyReviewActionResult<WeeklyReview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const validation = startWeeklyReviewSchema.safeParse(payload || {});
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid parameters.' };
    }

    // Resolve user's timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const userTimezone = profile?.timezone || 'UTC';
    const targetDateStr = validation.data.weekStart || getLocalDateString(new Date(), userTimezone);
    const weekBounds = getReviewWeekBounds(targetDateStr, userTimezone);

    // Check if review already exists
    const { data: existing } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekBounds.weekStart)
      .maybeSingle();

    if (existing) {
      return { success: true, data: existing as WeeklyReview };
    }

    // Insert new review row
    const { data: created, error: insertError } = await supabase
      .from('weekly_reviews')
      .insert({
        user_id: user.id,
        week_start: weekBounds.weekStart,
        week_end: weekBounds.weekEnd,
        status: 'in_progress',
        current_step: 1,
        reflection: {},
        cleanup_decisions: {},
        next_week_plan: {},
      })
      .select('*')
      .single();

    if (insertError || !created) {
      return { success: false, error: insertError?.message || 'Failed to start weekly review.' };
    }

    revalidatePath('/app/review');
    revalidatePath('/app');

    return { success: true, data: created as WeeklyReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error starting weekly review.';
    return { success: false, error: msg };
  }
}

/**
 * Saves in-progress review draft state, reflection answers, cleanup decisions, and next-week plans.
 */
export async function saveReviewDraftAction(
  payload: unknown
): Promise<WeeklyReviewActionResult<WeeklyReview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const validation = saveReviewDraftSchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid draft data.' };
    }

    const { reviewId, currentStep, reflection, cleanupDecisions, nextWeekPlan } = validation.data;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Review not found or unauthorized.' };
    }

    if (existing.status === 'completed') {
      return { success: false, error: 'Cannot modify a completed and committed weekly review without reopening.' };
    }

    const updatePayload: Record<string, unknown> = {
      current_step: currentStep,
      updated_at: new Date().toISOString(),
    };

    if (reflection) updatePayload.reflection = reflection;
    if (cleanupDecisions) updatePayload.cleanup_decisions = cleanupDecisions;
    if (nextWeekPlan) updatePayload.next_week_plan = nextWeekPlan;

    const { data: updated, error: updateError } = await supabase
      .from('weekly_reviews')
      .update(updatePayload)
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to save review draft.' };
    }

    revalidatePath('/app/review');

    return { success: true, data: updated as WeeklyReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error saving review draft.';
    return { success: false, error: msg };
  }
}

/**
 * Executes carry-forward of overdue or unfinished tasks into the upcoming week.
 * Preserves the original task ID and updates deadline_at and status.
 */
export async function carryForwardTasksAction(
  payload: unknown
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, count: 0, error: 'Authentication required.' };
    }

    const validation = carryForwardTasksSchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, count: 0, error: validation.error.issues[0]?.message || 'Invalid task carry-forward data.' };
    }

    let updatedCount = 0;

    for (const item of validation.data.tasks) {
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id, user_id, status')
        .eq('id', item.taskId)
        .eq('user_id', user.id)
        .single();

      if (existingTask) {
        // Carry forward: set new deadline, reset status to pending if missed
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            deadline_at: item.newDeadline,
            status: existingTask.status === 'missed' ? 'pending' : existingTask.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.taskId)
          .eq('user_id', user.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    revalidatePath('/app/tasks');
    revalidatePath('/app/review');
    revalidatePath('/app');

    return { success: true, count: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error carrying forward tasks.';
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Commits and locks the weekly review, generating an immutable metrics snapshot.
 */
export async function commitWeeklyReviewAction(
  payload: unknown
): Promise<WeeklyReviewActionResult<WeeklyReview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const validation = commitWeeklyReviewSchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid review completion data.' };
    }

    const { reviewId, reflection, cleanupDecisions, nextWeekPlan } = validation.data;

    // Fetch review row
    const { data: review, error: reviewError } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (reviewError || !review) {
      return { success: false, error: 'Review not found or unauthorized.' };
    }

    // Resolve user profile timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();
    const userTimezone = profile?.timezone || 'UTC';

    // Compute live metrics snapshot for immutable storage
    const [
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
    ] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('task_accountability_commitments').select('*').eq('user_id', user.id),
      supabase.from('focus_sessions').select('*').eq('user_id', user.id),
      supabase.from('habit_templates').select('*').eq('user_id', user.id),
      supabase.from('habit_occurrences').select('*').eq('user_id', user.id).gte('scheduled_date', review.week_start).lte('scheduled_date', review.week_end),
      supabase.from('finance_transactions').select('*').eq('user_id', user.id).gte('transaction_date', review.week_start).lte('transaction_date', review.week_end),
      supabase.from('finance_budgets').select('*, categories:finance_categories(id, name, color_tag)').eq('user_id', user.id),
      supabase.from('finance_categories').select('*').eq('user_id', user.id),
    ]);

    const allHabitTemplates = habitsTemplatesRes.data || [];
    const computedSnapshot = calculateAllWeeklyMetrics({
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
      startDateStr: review.week_start,
      endDateStr: review.week_end,
      timeZone: userTimezone,
    });

    const nowIso = new Date().toISOString();

    const { data: committed, error: commitError } = await supabase
      .from('weekly_reviews')
      .update({
        status: 'completed',
        current_step: 5,
        reflection,
        cleanup_decisions: cleanupDecisions,
        next_week_plan: nextWeekPlan,
        snapshot_metrics: computedSnapshot,
        completed_at: review.completed_at || nowIso,
        committed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (commitError || !committed) {
      return { success: false, error: commitError?.message || 'Failed to commit weekly review.' };
    }

    revalidatePath('/app/review');
    revalidatePath('/app');

    return { success: true, data: committed as WeeklyReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error committing weekly review.';
    return { success: false, error: msg };
  }
}

/**
 * Reopens a completed review for explicit adjustments.
 */
export async function reopenWeeklyReviewAction(
  payload: unknown
): Promise<WeeklyReviewActionResult<WeeklyReview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const validation = reopenWeeklyReviewSchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid parameters.' };
    }

    const { reviewId } = validation.data;

    const { data: updated, error: updateError } = await supabase
      .from('weekly_reviews')
      .update({
        status: 'in_progress',
        committed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to reopen review.' };
    }

    revalidatePath('/app/review');
    revalidatePath('/app');

    return { success: true, data: updated as WeeklyReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error reopening review.';
    return { success: false, error: msg };
  }
}

'use server';

/**
 * PACT Phase 6C: Habit & Routine Server Actions
 * Authenticated mutations for habit templates, occurrence completions,
 * routine definitions, reordering, and milestone notification alerts.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createHabitSchema,
  updateHabitSchema,
  completeOccurrenceSchema,
  occurrenceActionSchema,
  createRoutineSchema,
  updateRoutineSchema,
  reorderRoutineItemsSchema,
} from '@/lib/validations/habits';
import { HabitTemplate, HabitOccurrence, RoutineTemplate } from '@/lib/habits/types';
import { getLocalDateString } from '@/lib/time';
import { isHabitScheduledOnDate } from '@/lib/habits/recurrence';
import { calculateHabitStreak } from '@/lib/habits/streaks';
import { deliverInApp } from '@/lib/notifications/delivery';

export interface HabitActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Create a new habit template.
 */
export async function createHabitAction(
  payload: unknown
): Promise<HabitActionResult<HabitTemplate>> {
  try {
    const validated = createHabitSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    // Resolve user profile timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const tz = profile?.timezone || 'UTC';
    const todayStr = getLocalDateString(new Date(), tz);
    const startDate = validated.startDate || validated.start_date || todayStr;
    const frequency = validated.frequencyType || validated.frequency_type || 'daily';
    const selectedDays = validated.selectedDays || validated.selected_days || [];
    const intervalDays = validated.intervalDays || validated.interval_days || 1;
    const targetTime = validated.targetTimeLocal || validated.target_time_local || null;
    const targetDuration = validated.targetDurationMinutes ?? validated.target_duration_minutes ?? null;
    const linkedTaskId = validated.linkedTaskId || validated.linked_task_id || null;
    const endDate = validated.endDate ?? validated.end_date ?? null;

    // Insert template
    const { data: newTemplate, error: insertError } = await supabase
      .from('habit_templates')
      .insert({
        user_id: user.id,
        name: validated.name,
        description: validated.description || null,
        category: validated.category,
        frequency_type: frequency,
        selected_days: selectedDays,
        interval_days: intervalDays,
        target_time_local: targetTime,
        target_duration_minutes: targetDuration,
        linked_task_id: linkedTaskId,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
      })
      .select('*')
      .single();

    if (insertError || !newTemplate) {
      return { success: false, error: insertError?.message || 'Failed to create habit.' };
    }

    const createdHabit = newTemplate as unknown as HabitTemplate;

    // If habit is scheduled for today, generate today's occurrence row immediately
    if (isHabitScheduledOnDate(createdHabit, todayStr)) {
      await supabase.from('habit_occurrences').upsert({
        user_id: user.id,
        habit_template_id: createdHabit.id,
        scheduled_date: todayStr,
        status: 'pending',
      }, { onConflict: 'user_id,habit_template_id,scheduled_date' });
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: createdHabit };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create habit.',
    };
  }
}

/**
 * Server Action: Update an existing habit template.
 */
export async function updateHabitAction(
  payload: unknown
): Promise<HabitActionResult<HabitTemplate>> {
  try {
    const validated = updateHabitSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.category !== undefined) updates.category = validated.category;
    if (validated.frequencyType !== undefined || validated.frequency_type !== undefined) {
      updates.frequency_type = validated.frequencyType || validated.frequency_type;
    }
    if (validated.selectedDays !== undefined || validated.selected_days !== undefined) {
      updates.selected_days = validated.selectedDays || validated.selected_days;
    }
    if (validated.intervalDays !== undefined || validated.interval_days !== undefined) {
      updates.interval_days = validated.intervalDays || validated.interval_days;
    }
    if (validated.targetTimeLocal !== undefined || validated.target_time_local !== undefined) {
      updates.target_time_local = validated.targetTimeLocal || validated.target_time_local;
    }
    if (validated.targetDurationMinutes !== undefined || validated.target_duration_minutes !== undefined) {
      updates.target_duration_minutes = validated.targetDurationMinutes ?? validated.target_duration_minutes;
    }
    if (validated.linkedTaskId !== undefined || validated.linked_task_id !== undefined) {
      updates.linked_task_id = validated.linkedTaskId || validated.linked_task_id;
    }
    if (validated.status !== undefined) updates.status = validated.status;
    if (validated.startDate !== undefined || validated.start_date !== undefined) {
      updates.start_date = validated.startDate || validated.start_date;
    }
    if (validated.endDate !== undefined || validated.end_date !== undefined) {
      updates.end_date = validated.endDate ?? validated.end_date;
    }

    const { data: updated, error: updateError } = await supabase
      .from('habit_templates')
      .update(updates)
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to update habit.' };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: updated as unknown as HabitTemplate };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update habit.',
    };
  }
}

/**
 * Server Action: Archive a habit template.
 */
export async function archiveHabitAction(
  habitId: string
): Promise<HabitActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('habit_templates')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to archive habit.',
    };
  }
}

/**
 * Server Action: Unarchive a habit template.
 */
export async function unarchiveHabitAction(
  habitId: string
): Promise<HabitActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('habit_templates')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to unarchive habit.',
    };
  }
}

/**
 * Server Action: Toggle habit active/paused status.
 */
export async function toggleHabitStatusAction(
  habitId: string,
  newStatus: 'active' | 'paused'
): Promise<HabitActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('habit_templates')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update habit status.',
    };
  }
}

/**
 * Server Action: Delete a habit template permanently.
 */
export async function deleteHabitAction(
  habitId: string
): Promise<HabitActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('habit_templates')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete habit.',
    };
  }
}

/**
 * Server Action: Complete a habit occurrence.
 */
export async function completeHabitOccurrenceAction(
  payload: unknown
): Promise<HabitActionResult<HabitOccurrence>> {
  try {
    const validated = completeOccurrenceSchema.parse(payload);
    const occurrenceId = validated.occurrenceId || validated.occurrence_id;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: updatedOcc, error: rpcError } = await supabase.rpc(
      'pact_complete_habit_occurrence',
      {
        p_user_id: user.id,
        p_occurrence_id: occurrenceId,
        p_notes: validated.notes || null,
      }
    );

    if (rpcError || !updatedOcc) {
      return { success: false, error: rpcError?.message || 'Failed to complete habit occurrence.' };
    }

    const occ = updatedOcc as unknown as HabitOccurrence;

    // Check streak milestone to trigger celebration notification
    try {
      const { data: template } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('id', occ.habit_template_id)
        .single();

      if (template) {
        const { data: occurrences } = await supabase
          .from('habit_occurrences')
          .select('scheduled_date, status')
          .eq('habit_template_id', template.id)
          .eq('user_id', user.id);

        if (occurrences) {
          const streak = calculateHabitStreak(template as HabitTemplate, occurrences, occ.scheduled_date);
          // Milestones: 7 days, 14 days, 30 days, 60 days, 100 days
          const milestones = [7, 14, 30, 60, 100];
          if (milestones.includes(streak.currentStreak)) {
            await deliverInApp(supabase, {
              userId: user.id,
              type: 'system',
              title: `🔥 Streak Milestone: ${streak.currentStreak} Days!`,
              body: `Incredible discipline! You achieved a ${streak.currentStreak}-day streak on "${template.name}".`,
              actionUrl: '/app/habits',
              idempotencyKey: `habit_streak_${template.id}_${streak.currentStreak}`,
            });
          }
        }
      }
    } catch {
      // Non-blocking notification failure
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: occ };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to complete habit.',
    };
  }
}

/**
 * Server Action: Uncomplete / Undo a habit occurrence.
 */
export async function uncompleteHabitOccurrenceAction(
  payload: unknown
): Promise<HabitActionResult<HabitOccurrence>> {
  try {
    const validated = occurrenceActionSchema.parse(payload);
    const occurrenceId = validated.occurrenceId || validated.occurrence_id;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: updatedOcc, error: rpcError } = await supabase.rpc(
      'pact_uncomplete_habit_occurrence',
      {
        p_user_id: user.id,
        p_occurrence_id: occurrenceId,
      }
    );

    if (rpcError || !updatedOcc) {
      return { success: false, error: rpcError?.message || 'Failed to undo habit completion.' };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: updatedOcc as unknown as HabitOccurrence };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to undo habit completion.',
    };
  }
}

/**
 * Server Action: Skip a habit occurrence.
 */
export async function skipHabitOccurrenceAction(
  payload: unknown
): Promise<HabitActionResult<HabitOccurrence>> {
  try {
    const validated = occurrenceActionSchema.parse(payload);
    const occurrenceId = validated.occurrenceId || validated.occurrence_id;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: updatedOcc, error: rpcError } = await supabase.rpc(
      'pact_skip_habit_occurrence',
      {
        p_user_id: user.id,
        p_occurrence_id: occurrenceId,
      }
    );

    if (rpcError || !updatedOcc) {
      return { success: false, error: rpcError?.message || 'Failed to skip habit occurrence.' };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: updatedOcc as unknown as HabitOccurrence };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to skip habit.',
    };
  }
}

/**
 * Server Action: Create a Routine Template with ordered items.
 */
export async function createRoutineAction(
  payload: unknown
): Promise<HabitActionResult<RoutineTemplate>> {
  try {
    const validated = createRoutineSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const habitIds = validated.habitTemplateIds || validated.habit_template_ids || [];
    const targetTime = validated.targetTimeLocal || validated.target_time_local || null;

    // 1. Insert routine template
    const { data: routineRaw, error: routineError } = await supabase
      .from('routine_templates')
      .insert({
        user_id: user.id,
        name: validated.name,
        description: validated.description || null,
        target_time_local: targetTime,
        is_active: true,
      })
      .select('*')
      .single();

    if (routineError || !routineRaw) {
      return { success: false, error: routineError?.message || 'Failed to create routine.' };
    }

    const routine = routineRaw as unknown as RoutineTemplate;

    // 2. Insert routine items in order
    if (habitIds.length > 0) {
      const itemsToInsert = habitIds.map((hId, index) => ({
        user_id: user.id,
        routine_template_id: routine.id,
        habit_template_id: hId,
        sort_order: index,
      }));

      await supabase.from('routine_template_items').insert(itemsToInsert);
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: routine };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create routine.',
    };
  }
}

/**
 * Server Action: Update a Routine Template.
 */
export async function updateRoutineAction(
  payload: unknown
): Promise<HabitActionResult<RoutineTemplate>> {
  try {
    const validated = updateRoutineSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.targetTimeLocal !== undefined || validated.target_time_local !== undefined) {
      updates.target_time_local = validated.targetTimeLocal || validated.target_time_local;
    }
    if (validated.isActive !== undefined || validated.is_active !== undefined) {
      updates.is_active = validated.isActive ?? validated.is_active;
    }

    const { data: updated, error: updateError } = await supabase
      .from('routine_templates')
      .update(updates)
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to update routine.' };
    }

    const routine = updated as unknown as RoutineTemplate;
    const habitIds = validated.habitTemplateIds || validated.habit_template_ids;

    if (habitIds !== undefined) {
      // Re-sync routine items
      await supabase.from('routine_template_items').delete().eq('routine_template_id', routine.id);

      if (habitIds.length > 0) {
        const itemsToInsert = habitIds.map((hId, index) => ({
          user_id: user.id,
          routine_template_id: routine.id,
          habit_template_id: hId,
          sort_order: index,
        }));
        await supabase.from('routine_template_items').insert(itemsToInsert);
      }
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: routine };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update routine.',
    };
  }
}

/**
 * Server Action: Delete a Routine Template.
 */
export async function deleteRoutineAction(
  routineId: string
): Promise<HabitActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('routine_templates')
      .delete()
      .eq('id', routineId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete routine.',
    };
  }
}

/**
 * Server Action: Reorder items inside a routine template.
 */
export async function reorderRoutineItemsAction(
  payload: unknown
): Promise<HabitActionResult<boolean>> {
  try {
    const validated = reorderRoutineItemsSchema.parse(payload);
    const routineId = validated.routineId || validated.routine_id;
    const habitIds = validated.habitTemplateIds || validated.habit_template_ids || [];
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    await supabase.from('routine_template_items').delete().eq('routine_template_id', routineId);

    if (habitIds.length > 0) {
      const itemsToInsert = habitIds.map((hId, index) => ({
        user_id: user.id,
        routine_template_id: routineId,
        habit_template_id: hId,
        sort_order: index,
      }));
      await supabase.from('routine_template_items').insert(itemsToInsert);
    }

    revalidatePath('/app');
    revalidatePath('/app/habits');

    return { success: true, data: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reorder routine items.',
    };
  }
}

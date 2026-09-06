'use server';

import { createClient } from '@/lib/supabase/server';
import { createGoalSchema, updateGoalSchema } from '@/lib/validations/domain';
import { Goal } from '@/types/domain';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface GoalActionResult<T = Goal> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to create a new Goal for the authenticated user.
 * Ownership (user_id) is derived strictly from the server-verified auth session.
 */
export async function createGoalAction(
  payload: unknown
): Promise<GoalActionResult<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to create a goal.' };
    }

    const validation = createGoalSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return { success: false, error: firstIssue?.message || 'Invalid goal details provided.' };
    }

    const { title, description, target_date } = validation.data;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        target_date: target_date || null,
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to create goal. Please try again.' };
    }

    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: data as Goal };
  } catch {
    return { success: false, error: 'An unexpected error occurred while creating the goal.' };
  }
}

/**
 * Server action to update an existing Goal owned by the authenticated user.
 */
export async function updateGoalAction(
  goalId: string,
  payload: unknown
): Promise<GoalActionResult<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to update goal.' };
    }

    if (!goalId || typeof goalId !== 'string') {
      return { success: false, error: 'Invalid goal identifier.' };
    }

    const validation = updateGoalSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return { success: false, error: firstIssue?.message || 'Invalid goal update details.' };
    }

    const updatePayload: Record<string, unknown> = {};
    if (validation.data.title !== undefined) updatePayload.title = validation.data.title;
    if (validation.data.description !== undefined) updatePayload.description = validation.data.description;
    if (validation.data.target_date !== undefined) updatePayload.target_date = validation.data.target_date;
    if (validation.data.status !== undefined) updatePayload.status = validation.data.status;

    const { data, error } = await supabase
      .from('goals')
      .update(updatePayload)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to update goal or access denied.' };
    }

    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: data as Goal };
  } catch {
    return { success: false, error: 'An unexpected error occurred while updating the goal.' };
  }
}

/**
 * Server action to archive a Goal owned by the authenticated user.
 */
export async function archiveGoalAction(goalId: string): Promise<GoalActionResult<Goal>> {
  return updateGoalAction(goalId, { status: 'archived' });
}

/**
 * Server action to delete a Goal owned by the authenticated user.
 */
export async function deleteGoalAction(goalId: string): Promise<GoalActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to delete goal.' };
    }

    const uuidValidation = z.string().uuid().safeParse(goalId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid goal identifier format.' };
    }

    const { error, count } = await supabase
      .from('goals')
      .delete({ count: 'exact' })
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: 'Failed to delete goal.' };
    }

    if (count === 0) {
      return { success: false, error: 'Goal not found or access denied.' };
    }

    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: null };
  } catch {
    return { success: false, error: 'An unexpected error occurred while deleting the goal.' };
  }
}

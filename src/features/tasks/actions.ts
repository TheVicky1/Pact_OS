'use server';

import { createClient } from '@/lib/supabase/server';
import { createTaskSchema, updateTaskSchema } from '@/lib/validations/domain';
import { localToUtc } from '@/lib/time';
import { Task } from '@/types/domain';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface TaskActionResult<T = Task> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to create a new Task (Commitment) for the authenticated user.
 * Ownership (user_id) is derived strictly from the server-verified auth session.
 * Cross-user parent Goal and Project linkages are verified server-side prior to insertion.
 * Direct setting of trusted fields (completed_at, missed_at) is prohibited.
 */
export async function createTaskAction(
  payload: unknown
): Promise<TaskActionResult<Task>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to create a task.' };
    }

    // Preprocess payload if local_deadline and timezone are supplied
    let processedPayload = payload;
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      if (!p.deadline_at && p.local_deadline && typeof p.local_deadline === 'string') {
        const tz = (typeof p.timezone === 'string' && p.timezone) || 'UTC';
        const conv = localToUtc(p.local_deadline, tz);
        if (conv.error || !conv.utcIso) {
          return { success: false, error: conv.error || 'Invalid local deadline or timezone.' };
        }
        processedPayload = { ...p, deadline_at: conv.utcIso };
      }
    }

    const validation = createTaskSchema.safeParse(processedPayload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return { success: false, error: firstIssue?.message || 'Invalid task details provided.' };
    }

    const { title, deadline_at, project_id, goal_id, description, priority } = validation.data;

    // 1. Verify parent Goal ownership if goal_id exists
    if (goal_id) {
      const { data: targetGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('id', goal_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!targetGoal) {
        return { success: false, error: 'You can only associate a task with a goal you own.' };
      }
    }

    // 2. Verify parent Project ownership if project_id exists
    if (project_id) {
      const { data: targetProject } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!targetProject) {
        return { success: false, error: 'You can only associate a task with a project you own.' };
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        goal_id: goal_id || null,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: 'pending',
        deadline_at,
      })
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to create task. Please try again.' };
    }

    revalidatePath('/app/tasks');
    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: data as Task };
  } catch {
    return { success: false, error: 'An unexpected error occurred while creating the task.' };
  }
}

/**
 * Server action to update an existing Task owned by the authenticated user.
 * Enforces strict user ownership and parent entity linkage verification.
 */
export async function updateTaskAction(
  taskId: string,
  payload: unknown
): Promise<TaskActionResult<Task>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to update task.' };
    }

    if (!taskId || typeof taskId !== 'string') {
      return { success: false, error: 'Invalid task identifier.' };
    }

    // Preprocess payload if local_deadline and timezone are supplied
    let processedPayload = payload;
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      if (!p.deadline_at && p.local_deadline && typeof p.local_deadline === 'string') {
        const tz = (typeof p.timezone === 'string' && p.timezone) || 'UTC';
        const conv = localToUtc(p.local_deadline, tz);
        if (conv.error || !conv.utcIso) {
          return { success: false, error: conv.error || 'Invalid local deadline or timezone.' };
        }
        processedPayload = { ...p, deadline_at: conv.utcIso };
      }
    }

    const validation = updateTaskSchema.safeParse(processedPayload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return { success: false, error: firstIssue?.message || 'Invalid task update details.' };
    }

    const { goal_id, project_id } = validation.data;

    // 1. Verify parent Goal ownership if updated goal_id exists
    if (goal_id) {
      const { data: targetGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('id', goal_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!targetGoal) {
        return { success: false, error: 'You can only associate a task with a goal you own.' };
      }
    }

    // 2. Verify parent Project ownership if updated project_id exists
    if (project_id) {
      const { data: targetProject } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!targetProject) {
        return { success: false, error: 'You can only associate a task with a project you own.' };
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (validation.data.title !== undefined) updatePayload.title = validation.data.title;
    if (validation.data.description !== undefined) updatePayload.description = validation.data.description;
    if (validation.data.priority !== undefined) updatePayload.priority = validation.data.priority;
    if (validation.data.status !== undefined) updatePayload.status = validation.data.status;
    if (validation.data.deadline_at !== undefined) updatePayload.deadline_at = validation.data.deadline_at;
    if (validation.data.goal_id !== undefined) updatePayload.goal_id = validation.data.goal_id;
    if (validation.data.project_id !== undefined) updatePayload.project_id = validation.data.project_id;

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to update task or access denied.' };
    }

    revalidatePath('/app/tasks');
    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: data as Task };
  } catch {
    return { success: false, error: 'An unexpected error occurred while updating the task.' };
  }
}

/**
 * Server action to archive a Task owned by the authenticated user.
 */
export async function archiveTaskAction(taskId: string): Promise<TaskActionResult<Task>> {
  return updateTaskAction(taskId, { status: 'archived' });
}

/**
 * Server action to delete a Task owned by the authenticated user.
 */
export async function deleteTaskAction(taskId: string): Promise<TaskActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to delete task.' };
    }

    const uuidValidation = z.string().uuid().safeParse(taskId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid task identifier format.' };
    }

    const { error, count } = await supabase
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: 'Failed to delete task.' };
    }

    if (count === 0) {
      return { success: false, error: 'Task not found or access denied.' };
    }

    revalidatePath('/app/tasks');
    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: null };
  } catch {
    return { success: false, error: 'An unexpected error occurred while deleting the task.' };
  }
}

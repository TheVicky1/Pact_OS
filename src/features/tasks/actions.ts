'use server';

import { createClient } from '@/lib/supabase/server';
import { createTaskSchema, updateTaskSchema } from '@/lib/validations/domain';
import { localToUtc } from '@/lib/time';
import { Task } from '@/types/domain';
import {
  resolveDefaultConsequence,
  getConsequenceDefinitionById,
  createTaskAccountabilityCommitment,
} from '@/lib/accountability/service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  bulkCompleteTasksSchema,
  bulkUpdateTaskStatusSchema,
  bulkRescheduleTasksSchema,
  bulkDeleteTasksSchema,
  BulkOperationResult,
} from '@/lib/validations/bulk';

export interface TaskActionResult<T = Task> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to create a new Task (Commitment) for the authenticated user.
 * Ownership (user_id) is derived strictly from the server-verified auth session.
 * Cross-user parent Goal, Project, and Consequence linkages are verified server-side prior to insertion.
 * Resolves accountability defaults automatically for low-friction task creation.
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
        let tz: string = (typeof p.timezone === 'string' && p.timezone) || '';
        if (!tz) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', user.id)
            .maybeSingle();
          tz = profile?.timezone || user.user_metadata?.timezone || 'UTC';
        }
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

    const {
      title,
      deadline_at,
      project_id,
      goal_id,
      description,
      priority,
      accountability_mode = 'default',
      consequence_id,
    } = validation.data;

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

    // 3. Resolve target consequence definition if explicit accountability mode is requested
    let targetConsequenceDefinition = null;
    if (accountability_mode === 'explicit') {
      if (!consequence_id) {
        return { success: false, error: 'Explicit accountability mode requires a valid consequence definition ID.' };
      }

      const explicitConsequence = await getConsequenceDefinitionById(consequence_id);
      if (!explicitConsequence || explicitConsequence.user_id !== user.id || !explicitConsequence.is_enabled) {
        return { success: false, error: 'The selected consequence definition is invalid, disabled, or not owned by you.' };
      }
      targetConsequenceDefinition = explicitConsequence;
    } else if (accountability_mode === 'default') {
      // Resolve active default consequence deterministically
      targetConsequenceDefinition = await resolveDefaultConsequence();
    }

    // 4. Create Task record
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

    // 5. Attach Accountability Commitment Snapshot if a consequence definition was resolved
    if (targetConsequenceDefinition && accountability_mode !== 'none') {
      await createTaskAccountabilityCommitment(data.id, targetConsequenceDefinition);
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
        let tz: string = (typeof p.timezone === 'string' && p.timezone) || '';
        if (!tz) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', user.id)
            .maybeSingle();
          tz = profile?.timezone || user.user_metadata?.timezone || 'UTC';
        }
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

    if (validation.data.status === 'completed' || validation.data.status === 'missed') {
      return {
        success: false,
        error: `Direct status update to '${validation.data.status}' is prohibited. Use authoritative completion or missed transition actions.`,
      };
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
 * Server action to authoritatively complete a Task owned by the authenticated user.
 * Invokes the database RPC function `complete_task` with row locking and temporal deadline validation.
 */
export async function completeTaskAction(taskId: string): Promise<TaskActionResult<Task>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to complete task.' };
    }

    const uuidValidation = z.string().uuid().safeParse(taskId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid task identifier format.' };
    }

    const { data, error } = await supabase.rpc('complete_task', { p_task_id: taskId });

    if (error || !data) {
      return { success: false, error: 'Failed to execute task completion RPC.' };
    }

    const rpcRes = data as { success: boolean; code?: string; error?: string; data?: Task };

    if (!rpcRes.success) {
      return { success: false, error: rpcRes.error || 'Task completion was rejected.' };
    }

    revalidatePath('/app/tasks');
    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: rpcRes.data as Task };
  } catch {
    return { success: false, error: 'An unexpected error occurred while completing the task.' };
  }
}

/**
 * Server action to authoritatively mark an eligible Task as missed.
 * Invokes the database RPC function `mark_task_missed` with row locking and temporal deadline validation.
 */
export async function markTaskMissedAction(taskId: string): Promise<TaskActionResult<Task>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to mark task missed.' };
    }

    const uuidValidation = z.string().uuid().safeParse(taskId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid task identifier format.' };
    }

    const { data, error } = await supabase.rpc('mark_task_missed', { p_task_id: taskId });

    if (error || !data) {
      return { success: false, error: 'Failed to execute missed transition RPC.' };
    }

    const rpcRes = data as { success: boolean; code?: string; error?: string; data?: Task };

    if (!rpcRes.success) {
      return { success: false, error: rpcRes.error || 'Missed transition was rejected.' };
    }

    revalidatePath('/app/tasks');
    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: rpcRes.data as Task };
  } catch {
    return { success: false, error: 'An unexpected error occurred while marking the task missed.' };
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

/**
 * Phase 6E: Authoritative bulk task completion action.
 * Evaluates each task against domain lifecycle invariants and invokes complete_task RPC.
 * Returns deterministic outcome report with partial failure accounting.
 */
export async function bulkCompleteTasksAction(
  payload: unknown
): Promise<BulkOperationResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: 'Authentication required for bulk operations.',
      };
    }

    const validation = bulkCompleteTasksSchema.safeParse(payload);
    if (!validation.success) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: validation.error.issues[0]?.message || 'Invalid task selection.',
      };
    }

    const { taskIds } = validation.data;
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];
    const skipped: string[] = [];

    // Process each task authoritatively
    for (const taskId of taskIds) {
      try {
        const { data: rpcRes, error } = await supabase.rpc('complete_task', { p_task_id: taskId });
        if (error) {
          failed.push({ id: taskId, reason: error.message || 'Database error' });
          continue;
        }

        const res = rpcRes as { success: boolean; code?: string; error?: string };
        if (res.success) {
          succeeded.push(taskId);
        } else {
          if (res.code === 'ALREADY_COMPLETED') {
            skipped.push(taskId);
          } else {
            failed.push({ id: taskId, reason: res.error || 'Failed to complete task' });
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown execution error';
        failed.push({ id: taskId, reason: msg });
      }
    }

    if (succeeded.length > 0) {
      revalidatePath('/app/tasks');
      revalidatePath('/app/projects');
      revalidatePath('/app/goals');
      revalidatePath('/app/review');
      revalidatePath('/app');
    }

    return {
      success: succeeded.length > 0 || (skipped.length > 0 && failed.length === 0),
      total: taskIds.length,
      succeeded,
      failed,
      skipped,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected bulk operation failure.';
    return {
      success: false,
      total: 0,
      succeeded: [],
      failed: [],
      skipped: [],
      error: msg,
    };
  }
}

/**
 * Phase 6E: Authoritative bulk task status update (pending | in_progress | archived).
 */
export async function bulkUpdateTaskStatusAction(
  payload: unknown
): Promise<BulkOperationResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: 'Authentication required for bulk operations.',
      };
    }

    const validation = bulkUpdateTaskStatusSchema.safeParse(payload);
    if (!validation.success) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: validation.error.issues[0]?.message || 'Invalid bulk status update request.',
      };
    }

    const { taskIds, status } = validation.data;

    // Fetch existing tasks owned by user to enforce lifecycle rules
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status')
      .in('id', taskIds)
      .eq('user_id', user.id);

    if (fetchError || !existingTasks) {
      return {
        success: false,
        total: taskIds.length,
        succeeded: [],
        failed: taskIds.map((id) => ({ id, reason: 'Failed to query task status' })),
        skipped: [],
        error: 'Database query failed.',
      };
    }

    const foundIds = new Set(existingTasks.map((t) => t.id));
    const failed: Array<{ id: string; reason: string }> = [];
    const eligibleIds: string[] = [];

    for (const taskId of taskIds) {
      if (!foundIds.has(taskId)) {
        failed.push({ id: taskId, reason: 'Task not found or access denied' });
        continue;
      }

      const task = existingTasks.find((t) => t.id === taskId)!;
      if (task.status === 'completed' || task.status === 'missed') {
        failed.push({
          id: taskId,
          reason: `Cannot transition a '${task.status}' task via bulk status update.`,
        });
        continue;
      }

      eligibleIds.push(taskId);
    }

    if (eligibleIds.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', eligibleIds)
        .eq('user_id', user.id);

      if (updateError) {
        return {
          success: false,
          total: taskIds.length,
          succeeded: [],
          failed: taskIds.map((id) => ({ id, reason: updateError.message })),
          skipped: [],
          error: 'Bulk update execution failed.',
        };
      }

      revalidatePath('/app/tasks');
      revalidatePath('/app/projects');
      revalidatePath('/app/goals');
      revalidatePath('/app');
    }

    return {
      success: eligibleIds.length > 0,
      total: taskIds.length,
      succeeded: eligibleIds,
      failed,
      skipped: [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected bulk status update error.';
    return {
      success: false,
      total: 0,
      succeeded: [],
      failed: [],
      skipped: [],
      error: msg,
    };
  }
}

/**
 * Phase 6E: Authoritative bulk task rescheduling action.
 */
export async function bulkRescheduleTasksAction(
  payload: unknown
): Promise<BulkOperationResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: 'Authentication required for bulk operations.',
      };
    }

    const validation = bulkRescheduleTasksSchema.safeParse(payload);
    if (!validation.success) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: validation.error.issues[0]?.message || 'Invalid bulk reschedule request.',
      };
    }

    const { taskIds, deadline_at } = validation.data;

    // Fetch existing tasks owned by user
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status')
      .in('id', taskIds)
      .eq('user_id', user.id);

    if (fetchError || !existingTasks) {
      return {
        success: false,
        total: taskIds.length,
        succeeded: [],
        failed: taskIds.map((id) => ({ id, reason: 'Failed to query task status' })),
        skipped: [],
        error: 'Database query failed.',
      };
    }

    const foundIds = new Set(existingTasks.map((t) => t.id));
    const failed: Array<{ id: string; reason: string }> = [];
    const eligibleIds: string[] = [];

    for (const taskId of taskIds) {
      if (!foundIds.has(taskId)) {
        failed.push({ id: taskId, reason: 'Task not found or access denied' });
        continue;
      }

      const task = existingTasks.find((t) => t.id === taskId)!;
      if (task.status === 'completed' || task.status === 'missed') {
        failed.push({
          id: taskId,
          reason: `Cannot reschedule a '${task.status}' task.`,
        });
        continue;
      }

      eligibleIds.push(taskId);
    }

    if (eligibleIds.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ deadline_at, updated_at: new Date().toISOString() })
        .in('id', eligibleIds)
        .eq('user_id', user.id);

      if (updateError) {
        return {
          success: false,
          total: taskIds.length,
          succeeded: [],
          failed: taskIds.map((id) => ({ id, reason: updateError.message })),
          skipped: [],
          error: 'Bulk reschedule execution failed.',
        };
      }

      revalidatePath('/app/tasks');
      revalidatePath('/app/calendar');
      revalidatePath('/app');
    }

    return {
      success: eligibleIds.length > 0,
      total: taskIds.length,
      succeeded: eligibleIds,
      failed,
      skipped: [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected bulk reschedule error.';
    return {
      success: false,
      total: 0,
      succeeded: [],
      failed: [],
      skipped: [],
      error: msg,
    };
  }
}

/**
 * Phase 6E: Authoritative bulk task deletion action.
 */
export async function bulkDeleteTasksAction(
  payload: unknown
): Promise<BulkOperationResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: 'Authentication required for bulk operations.',
      };
    }

    const validation = bulkDeleteTasksSchema.safeParse(payload);
    if (!validation.success) {
      return {
        success: false,
        total: 0,
        succeeded: [],
        failed: [],
        skipped: [],
        error: validation.error.issues[0]?.message || 'Invalid bulk delete request.',
      };
    }

    const { taskIds } = validation.data;

    const { data: deletedRows, error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds)
      .eq('user_id', user.id)
      .select('id');

    if (deleteError) {
      return {
        success: false,
        total: taskIds.length,
        succeeded: [],
        failed: taskIds.map((id) => ({ id, reason: deleteError.message })),
        skipped: [],
        error: 'Bulk delete execution failed.',
      };
    }

    const deletedIds = (deletedRows || []).map((r) => r.id);
    const deletedSet = new Set(deletedIds);
    const failed: Array<{ id: string; reason: string }> = [];

    for (const taskId of taskIds) {
      if (!deletedSet.has(taskId)) {
        failed.push({ id: taskId, reason: 'Task not found or access denied' });
      }
    }

    if (deletedIds.length > 0) {
      revalidatePath('/app/tasks');
      revalidatePath('/app/projects');
      revalidatePath('/app/goals');
      revalidatePath('/app');
    }

    return {
      success: deletedIds.length > 0,
      total: taskIds.length,
      succeeded: deletedIds,
      failed,
      skipped: [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected bulk delete error.';
    return {
      success: false,
      total: 0,
      succeeded: [],
      failed: [],
      skipped: [],
      error: msg,
    };
  }
}


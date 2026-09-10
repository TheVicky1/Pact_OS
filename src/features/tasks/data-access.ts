import { createClient } from '@/lib/supabase/server';
import { Task } from '@/types/domain';

export interface TaskWithParents extends Task {
  projects?: {
    id: string;
    title: string;
  } | null;
  goals?: {
    id: string;
    title: string;
  } | null;
  task_accountability_commitments?: Array<{
    id: string;
    commitment_status: string;
  }> | {
    id: string;
    commitment_status: string;
  } | null;
}

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all tasks owned by the currently authenticated user.
 * Joins parent project title, goal title, and commitment status if linked.
 * Database RLS enforces that only rows matching auth.uid() = user_id are returned.
 */
export async function getTasks(): Promise<DataAccessResult<TaskWithParents[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    // Run non-blocking user deadline sweep to ensure local wall-clock consistency
    try {
      await supabase.rpc('sweep_user_expired_tasks', { p_batch_size: 50 });
    } catch {
      // Gracefully continue if RPC fails or is still migrating
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(id, title), goals(id, title), task_accountability_commitments(id, commitment_status)')
      .order('deadline_at', { ascending: true });

    if (error) {
      return { data: null, error: 'Failed to retrieve tasks.' };
    }

    return { data: data as TaskWithParents[], error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching tasks.' };
  }
}

/**
 * Retrieves a specific task by ID owned by the currently authenticated user.
 * Returns null if the task does not exist or belongs to another user (via RLS).
 */
export async function getTaskById(id: string): Promise<DataAccessResult<TaskWithParents>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(id, title), goals(id, title), task_accountability_commitments(id, commitment_status)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: 'Failed to retrieve task.' };
    }

    if (!data) {
      return { data: null, error: 'Task not found or access denied.' };
    }

    return { data: data as TaskWithParents, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching the task.' };
  }
}

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
}

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all tasks owned by the currently authenticated user.
 * Joins parent project title and goal title if linked.
 * Database RLS enforces that only rows matching auth.uid() = user_id are returned.
 */
export async function getTasks(): Promise<DataAccessResult<TaskWithParents[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(id, title), goals(id, title)')
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
      .select('*, projects(id, title), goals(id, title)')
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

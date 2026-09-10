import { createClient } from '@/lib/supabase/server';
import { Project } from '@/types/domain';

export interface ProjectWithGoal extends Project {
  goals?: {
    id: string;
    title: string;
  } | null;
}

/**
 * Minimal task shape returned for project-scoped display.
 * Deliberately excludes accountability fields (task_accountability_commitments,
 * consequence_snapshot, etc.) to preserve accountability confidentiality.
 */
export interface ProjectTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline_at: string;
  completed_at: string | null;
}

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all projects owned by the currently authenticated user.
 * Joins associated goal title if linked.
 * Database RLS enforces that only rows matching auth.uid() = user_id are returned.
 */
export async function getProjects(): Promise<DataAccessResult<ProjectWithGoal[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*, goals(id, title)')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: 'Failed to retrieve projects.' };
    }

    return { data: data as ProjectWithGoal[], error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching projects.' };
  }
}

/**
 * Retrieves a specific project by ID owned by the currently authenticated user.
 * Returns null if the project does not exist or belongs to another user (via RLS).
 */
export async function getProjectById(id: string): Promise<DataAccessResult<ProjectWithGoal>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*, goals(id, title)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: 'Failed to retrieve project.' };
    }

    if (!data) {
      return { data: null, error: 'Project not found or access denied.' };
    }

    return { data: data as ProjectWithGoal, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching the project.' };
  }
}

/**
 * Retrieves tasks belonging to a specific project owned by the authenticated user.
 *
 * Progress calculation:
 *   completed tasks / total tasks  (where completed = status === 'completed')
 *
 * Security: Only selects display-safe fields. Does NOT join task_accountability_commitments,
 * consequence_snapshot, or any accountability enforcement data.
 * RLS on the tasks table ensures cross-user access is impossible at the database layer.
 */
export async function getProjectTasks(
  projectId: string
): Promise<DataAccessResult<ProjectTask[]>> {
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
      .from('tasks')
      .select('id, title, status, priority, deadline_at, completed_at')
      .eq('project_id', projectId)
      .order('deadline_at', { ascending: true });

    if (error) {
      return { data: null, error: 'Failed to retrieve project tasks.' };
    }

    return { data: data as ProjectTask[], error: null };
  } catch {
    return {
      data: null,
      error: 'An unexpected error occurred while fetching project tasks.',
    };
  }
}

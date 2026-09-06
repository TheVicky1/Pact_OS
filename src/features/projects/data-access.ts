import { createClient } from '@/lib/supabase/server';
import { Project } from '@/types/domain';

export interface ProjectWithGoal extends Project {
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

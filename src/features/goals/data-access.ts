import { createClient } from '@/lib/supabase/server';
import { Goal } from '@/types/domain';

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all goals owned by the currently authenticated user.
 * Database RLS enforces that only rows matching auth.uid() = user_id are returned.
 */
export async function getGoals(): Promise<DataAccessResult<Goal[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: 'Failed to retrieve goals.' };
    }

    return { data: data as Goal[], error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching goals.' };
  }
}

/**
 * Retrieves a specific goal by ID owned by the currently authenticated user.
 * Returns null if the goal does not exist or belongs to another user (via RLS).
 */
export async function getGoalById(id: string): Promise<DataAccessResult<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: 'Failed to retrieve goal.' };
    }

    if (!data) {
      return { data: null, error: 'Goal not found or access denied.' };
    }

    return { data: data as Goal, error: null };
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching the goal.' };
  }
}

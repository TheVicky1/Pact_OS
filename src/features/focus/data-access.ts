import { createClient } from '@/lib/supabase/server';
import { FocusSession, checkCountdownExpiration } from '@/lib/focus/timer';

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves the currently active or paused focus session for the authenticated user.
 * Automatically reconciles naturally expired countdown sessions.
 */
export async function getActiveFocusSession(): Promise<DataAccessResult<FocusSession | null>> {
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
      .from('focus_sessions')
      .select('*, tasks(id, title, status, priority)')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const session = data as FocusSession;

    // Check if active countdown session naturally expired while away
    if (session.status === 'active' && checkCountdownExpiration(session)) {
      try {
        const { data: reconciledData } = await supabase.rpc('pact_complete_focus_session', {
          p_user_id: user.id,
          p_session_id: session.id,
          p_reason: 'auto_reconciled',
        });
        if (reconciledData) {
          return { data: null, error: null };
        }
      } catch {
        // Fallback: continue returning session
      }
    }

    return { data: session, error: null };
  } catch {
    return { data: null, error: 'Failed to retrieve active focus session.' };
  }
}

/**
 * Retrieves past focus sessions for the authenticated user ordered by completion time.
 */
export async function getFocusHistory(limit: number = 20): Promise<DataAccessResult<FocusSession[]>> {
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
      .from('focus_sessions')
      .select('*, tasks(id, title, status, priority)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as FocusSession[]) || [], error: null };
  } catch {
    return { data: null, error: 'Failed to retrieve focus history.' };
  }
}

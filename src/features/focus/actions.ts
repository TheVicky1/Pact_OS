'use server';

import { createClient } from '@/lib/supabase/server';
import {
  startFocusSessionSchema,
  completeFocusSessionSchema,
  sessionActionSchema,
} from '@/lib/validations/focus';
import { FocusSession, formatTimerDisplay } from '@/lib/focus/timer';
import { deliverInApp } from '@/lib/notifications/delivery';
import { revalidatePath } from 'next/cache';

export interface FocusActionResult<T = FocusSession> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to start a new focus session.
 * Rejects if the user already has an active or paused session.
 */
export async function startFocusSessionAction(
  payload: unknown
): Promise<FocusActionResult<FocusSession>> {
  try {
    const validated = startFocusSessionSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data, error } = await supabase.rpc('pact_start_focus_session', {
      p_user_id: user.id,
      p_task_id: validated.taskId || null,
      p_mode: validated.mode,
      p_planned_duration_seconds: validated.plannedDurationSeconds,
      p_notes: validated.notes || null,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You already have an active focus session in progress.' };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/focus');

    return { success: true, data: data as unknown as FocusSession };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to start focus session.',
    };
  }
}

/**
 * Server Action to pause an active focus session.
 */
export async function pauseFocusSessionAction(
  payload: unknown
): Promise<FocusActionResult<FocusSession>> {
  try {
    const validated = sessionActionSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data, error } = await supabase.rpc('pact_pause_focus_session', {
      p_user_id: user.id,
      p_session_id: validated.sessionId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app/focus');
    return { success: true, data: data as unknown as FocusSession };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to pause focus session.',
    };
  }
}

/**
 * Server Action to resume a paused focus session.
 */
export async function resumeFocusSessionAction(
  payload: unknown
): Promise<FocusActionResult<FocusSession>> {
  try {
    const validated = sessionActionSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data, error } = await supabase.rpc('pact_resume_focus_session', {
      p_user_id: user.id,
      p_session_id: validated.sessionId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app/focus');
    return { success: true, data: data as unknown as FocusSession };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to resume focus session.',
    };
  }
}

/**
 * Server Action to complete a focus session and record notifications.
 */
export async function completeFocusSessionAction(
  payload: unknown
): Promise<FocusActionResult<FocusSession>> {
  try {
    const validated = completeFocusSessionSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data, error } = await supabase.rpc('pact_complete_focus_session', {
      p_user_id: user.id,
      p_session_id: validated.sessionId,
      p_reason: validated.reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const completedSession = data as unknown as FocusSession;

    // Dispatches In-App notification upon focus completion
    try {
      const durationFormatted = formatTimerDisplay(completedSession.planned_duration_seconds || 1500);
      await deliverInApp(supabase, {
        userId: user.id,
        type: 'system',
        title: 'Focus Session Completed',
        body: `You successfully completed a ${durationFormatted} deep work focus block.`,
        actionUrl: '/app/focus',
        idempotencyKey: `focus_completed_${completedSession.id}`,
      });
    } catch {
      // Non-blocking notification failure
    }

    revalidatePath('/app');
    revalidatePath('/app/focus');

    return { success: true, data: completedSession };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to complete focus session.',
    };
  }
}

/**
 * Server Action to abandon an active or paused focus session.
 */
export async function abandonFocusSessionAction(
  payload: unknown
): Promise<FocusActionResult<FocusSession>> {
  try {
    const validated = sessionActionSchema.parse(payload);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data, error } = await supabase.rpc('pact_abandon_focus_session', {
      p_user_id: user.id,
      p_session_id: validated.sessionId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app');
    revalidatePath('/app/focus');

    return { success: true, data: data as unknown as FocusSession };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to abandon focus session.',
    };
  }
}

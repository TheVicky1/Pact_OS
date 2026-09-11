'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  GoogleCalendarIntegrationStatus,
  GoogleCalendarSyncSummary,
} from '@/types/domain';
import { syncGoogleCalendar } from '@/lib/integrations/google-calendar/sync';

export interface GoogleActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Retrieves the current user's Google Calendar connection and sync status.
 * Server-authoritative query with strict user isolation (no raw tokens returned).
 */
export async function getGoogleCalendarStatusAction(): Promise<
  GoogleActionResult<GoogleCalendarIntegrationStatus>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required.',
      };
    }

    const { data, error } = await supabase.rpc('get_google_calendar_status', {
      p_user_id: user.id,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data as GoogleCalendarIntegrationStatus,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve Google Calendar status.';
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Triggers on-demand bi-directional synchronization with Google Calendar.
 */
export async function triggerGoogleCalendarSyncAction(
  forceFullSync = false
): Promise<GoogleActionResult<GoogleCalendarSyncSummary>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required.',
      };
    }

    const summary = await syncGoogleCalendar(supabase, user.id, {
      forceFullSync,
    });

    revalidatePath('/app');
    revalidatePath('/app/settings');

    return {
      success: summary.success,
      data: summary,
      error: summary.errors.length > 0 ? summary.errors.join('; ') : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to execute Google Calendar synchronization.';
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Disconnects Google Calendar integration safely, clearing stored tokens and setting status to disconnected.
 */
export async function disconnectGoogleCalendarAction(): Promise<GoogleActionResult<null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required.',
      };
    }

    const { error: updateError } = await supabase
      .from('google_calendar_integrations')
      .update({
        access_token: null,
        refresh_token: null,
        sync_status: 'disconnected',
        sync_token: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      return {
        success: false,
        error: 'Failed to disconnect Google Calendar.',
      };
    }

    revalidatePath('/app');
    revalidatePath('/app/settings');

    return {
      success: true,
      data: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to disconnect Google Calendar.';
    return {
      success: false,
      error: msg,
    };
  }
}

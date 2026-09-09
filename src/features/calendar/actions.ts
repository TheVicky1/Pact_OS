'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '@/lib/validations/calendar';
import { CalendarEvent, CalendarEventWithRelations } from '@/types/domain';
import { localToUtc, isValidIanaTimezone } from '@/lib/time';
import { revalidatePath } from 'next/cache';
import { getCalendarEventsForDay } from './data-access';

export interface CalendarActionResult<T = CalendarEvent> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to create a new calendar event for the authenticated user.
 * Supports either direct ISO timestamps (start_time, end_time) OR
 * local planner inputs (date: "YYYY-MM-DD", start_time: "HH:mm", end_time: "HH:mm", timezone: "IANA").
 */
export async function createCalendarEventAction(
  payload: unknown
): Promise<CalendarActionResult<CalendarEvent>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to create a calendar event.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    // Handle local date + time input format from the day planner UI
    if (
      processedPayload &&
      typeof processedPayload === 'object' &&
      processedPayload.local_date &&
      processedPayload.local_start_time &&
      processedPayload.local_end_time
    ) {
      let tz = (typeof processedPayload.timezone === 'string' && processedPayload.timezone) || '';
      if (!tz || !isValidIanaTimezone(tz)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', user.id)
          .maybeSingle();
        tz = profile?.timezone || user.user_metadata?.timezone || 'UTC';
      }

      const dateStr = String(processedPayload.local_date).trim();
      const startTimeStr = String(processedPayload.local_start_time).trim();
      const endTimeStr = String(processedPayload.local_end_time).trim();

      const startLocalIso = `${dateStr}T${startTimeStr}:00`;
      const endLocalIso = `${dateStr}T${endTimeStr}:00`;

      const startConv = localToUtc(startLocalIso, tz);
      const endConv = localToUtc(endLocalIso, tz);

      if (startConv.error || !startConv.utcIso) {
        return { success: false, error: startConv.error || 'Invalid start time.' };
      }
      if (endConv.error || !endConv.utcIso) {
        return { success: false, error: endConv.error || 'Invalid end time.' };
      }

      processedPayload = {
        ...processedPayload,
        start_time: startConv.utcIso,
        end_time: endConv.utcIso,
      };
    }

    const validation = createCalendarEventSchema.safeParse(processedPayload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return { success: false, error: issue ? issue.message : 'Invalid calendar event details.' };
    }

    const {
      title,
      description,
      start_time,
      end_time,
      color_tag,
      goal_id,
      project_id,
      task_id,
    } = validation.data;

    // Cross-user reference verification
    if (goal_id) {
      const { data: goal } = await supabase
        .from('goals')
        .select('id')
        .eq('id', goal_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!goal) return { success: false, error: 'Associated goal not found or access denied.' };
    }

    if (project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!project) return { success: false, error: 'Associated project not found or access denied.' };
    }

    if (task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', task_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!task) return { success: false, error: 'Associated task not found or access denied.' };
    }

    const { data: newEvent, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        start_time,
        end_time,
        color_tag: color_tag || 'gold',
        goal_id: goal_id || null,
        project_id: project_id || null,
        task_id: task_id || null,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: 'Failed to create calendar event.' };
    }

    revalidatePath('/app');
    revalidatePath('/app/calendar');
    return { success: true, data: newEvent as CalendarEvent };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to update an existing calendar event.
 */
export async function updateCalendarEventAction(
  id: string,
  payload: unknown
): Promise<CalendarActionResult<CalendarEvent>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    // Handle local date + time input format if supplied
    if (
      processedPayload &&
      typeof processedPayload === 'object' &&
      processedPayload.local_date &&
      processedPayload.local_start_time &&
      processedPayload.local_end_time
    ) {
      let tz = (typeof processedPayload.timezone === 'string' && processedPayload.timezone) || '';
      if (!tz || !isValidIanaTimezone(tz)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', user.id)
          .maybeSingle();
        tz = profile?.timezone || user.user_metadata?.timezone || 'UTC';
      }

      const dateStr = String(processedPayload.local_date).trim();
      const startTimeStr = String(processedPayload.local_start_time).trim();
      const endTimeStr = String(processedPayload.local_end_time).trim();

      const startConv = localToUtc(`${dateStr}T${startTimeStr}:00`, tz);
      const endConv = localToUtc(`${dateStr}T${endTimeStr}:00`, tz);

      if (startConv.error || !startConv.utcIso) {
        return { success: false, error: startConv.error || 'Invalid start time.' };
      }
      if (endConv.error || !endConv.utcIso) {
        return { success: false, error: endConv.error || 'Invalid end time.' };
      }

      processedPayload = {
        ...processedPayload,
        start_time: startConv.utcIso,
        end_time: endConv.utcIso,
      };
    }

    const validation = updateCalendarEventSchema.safeParse(processedPayload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return { success: false, error: issue ? issue.message : 'Invalid event update.' };
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('calendar_events')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: 'Failed to update calendar event.' };
    }

    revalidatePath('/app');
    revalidatePath('/app/calendar');
    return { success: true, data: updatedEvent as CalendarEvent };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to delete an existing calendar event.
 */
export async function deleteCalendarEventAction(
  id: string
): Promise<CalendarActionResult<null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return { success: false, error: 'Failed to delete calendar event.' };
    }

    revalidatePath('/app');
    revalidatePath('/app/calendar');
    return { success: true, data: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Client-callable Server Action to fetch events for a chosen day dynamically.
 */
export async function getCalendarEventsForDayAction(
  dateStr: string,
  timeZone: string
): Promise<CalendarEventWithRelations[]> {
  const result = await getCalendarEventsForDay(dateStr, timeZone);
  return result.data || [];
}

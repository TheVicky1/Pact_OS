import { createClient } from '@/lib/supabase/server';
import { CalendarEventWithRelations } from '@/types/domain';
import { getDayBoundariesUtc, isValidIanaTimezone } from '@/lib/time';

export type { CalendarEventWithRelations };

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all calendar events for a specific local date in the user's profile timezone.
 * Server-authoritative query with RLS filtering for auth.uid() = user_id.
 */
export async function getCalendarEventsForDay(
  dateStr: string, // "YYYY-MM-DD"
  timeZone: string
): Promise<DataAccessResult<CalendarEventWithRelations[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required to view calendar events.' };
    }

    const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
    const { startUtc, endUtc } = getDayBoundariesUtc(dateStr, safeTz);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, projects(id, title), goals(id, title), tasks(id, title)')
      .gte('end_time', startUtc)
      .lte('start_time', endUtc)
      .order('start_time', { ascending: true });

    if (error) {
      // Table may not yet exist on live Supabase if migrations haven't run against remote instance
      console.warn('Calendar events query warning:', error.message);
      return { data: [], error: null };
    }

    return { data: (data as CalendarEventWithRelations[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('getCalendarEventsForDay failed:', msg);
    return { data: [], error: null };
  }
}

/**
 * Retrieves a single calendar event by ID.
 */
export async function getCalendarEventById(
  id: string
): Promise<DataAccessResult<CalendarEventWithRelations>> {
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
      .from('calendar_events')
      .select('*, projects(id, title), goals(id, title), tasks(id, title)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return { data: null, error: 'Event not found.' };
    }

    return { data: data as CalendarEventWithRelations, error: null };
  } catch {
    return { data: null, error: 'Failed to retrieve event.' };
  }
}

/**
 * PACT Phase 5C: Google Calendar Bi-Directional Synchronization Engine
 * Handles delta synchronization, conflict resolution (Last-Write-Wins), loop prevention,
 * and canonical UTC storage.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  GoogleCalendarClient,
  GoogleCalendarApiEvent,
} from './client';
import {
  GoogleCalendarSyncSummary,
  CalendarEvent,
} from '../../../types/domain';

export interface SyncOptions {
  forceFullSync?: boolean;
  timeRangeDaysPast?: number;
  timeRangeDaysFuture?: number;
}

/**
 * Maps a Google Calendar API event to PACT calendar_events schema payload.
 */
export function mapGoogleToPactEvent(
  gEvent: GoogleCalendarApiEvent,
  userId: string
): {
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  color_tag: 'blue';
  google_event_id: string;
  google_etag: string | null;
  google_calendar_id: string;
  is_external: boolean;
  last_synced_at: string;
} {
  let startIso: string;
  let endIso: string;

  if (gEvent.start?.dateTime) {
    startIso = new Date(gEvent.start.dateTime).toISOString();
  } else if (gEvent.start?.date) {
    // All-day event: start of day in UTC
    startIso = new Date(`${gEvent.start.date}T00:00:00.000Z`).toISOString();
  } else {
    startIso = new Date().toISOString();
  }

  if (gEvent.end?.dateTime) {
    endIso = new Date(gEvent.end.dateTime).toISOString();
  } else if (gEvent.end?.date) {
    // All-day event: Google end date is exclusive (next day 00:00), map to 23:59:59.999Z
    const nextDay = new Date(`${gEvent.end.date}T00:00:00.000Z`);
    const endInstant = new Date(nextDay.getTime() - 1);
    endIso = endInstant.toISOString();
  } else {
    // Fallback: 1 hour after start
    endIso = new Date(new Date(startIso).getTime() + 3600000).toISOString();
  }

  return {
    user_id: userId,
    title: (gEvent.summary && gEvent.summary.trim()) || '(Untitled Google Event)',
    description: gEvent.description ? gEvent.description.trim() : null,
    start_time: startIso,
    end_time: endIso,
    color_tag: 'blue',
    google_event_id: gEvent.id,
    google_etag: gEvent.etag || null,
    google_calendar_id: 'primary',
    is_external: true,
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Maps a native PACT CalendarEvent to a Google Calendar event payload.
 */
export function mapPactToGoogleEvent(event: CalendarEvent): {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
} {
  return {
    summary: event.title,
    description: event.description || undefined,
    start: {
      dateTime: new Date(event.start_time).toISOString(),
    },
    end: {
      dateTime: new Date(event.end_time).toISOString(),
    },
  };
}

/**
 * Executes bi-directional synchronization between PACT and Google Calendar.
 */
export async function syncGoogleCalendar(
  supabase: SupabaseClient,
  userId: string,
  options?: SyncOptions
): Promise<GoogleCalendarSyncSummary> {
  const timestamp = new Date().toISOString();
  const summary: GoogleCalendarSyncSummary = {
    success: false,
    importedCount: 0,
    updatedCount: 0,
    deletedCount: 0,
    exportedCount: 0,
    pushedCount: 0,
    errors: [],
    timestamp,
  };

  try {
    // 1. Fetch integration credentials
    const { data: integration, error: intError } = await supabase
      .from('google_calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (intError || !integration || !integration.access_token) {
      summary.errors.push('Google Calendar is not connected or authorization is missing.');
      return summary;
    }

    if (integration.sync_status === 'revoked') {
      summary.errors.push('Google Calendar authorization has been revoked. Please reconnect.');
      return summary;
    }

    // Update status to 'syncing'
    await supabase
      .from('google_calendar_integrations')
      .update({ sync_status: 'syncing', updated_at: timestamp })
      .eq('user_id', userId);

    // 2. Initialize Google Calendar REST client
    const client = new GoogleCalendarClient({
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token || undefined,
      onTokenRefreshed: async (newToken, expiresAt) => {
        await supabase
          .from('google_calendar_integrations')
          .update({
            access_token: newToken,
            token_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      },
    });

    const calendarId = integration.calendar_id || 'primary';
    const pastDays = options?.timeRangeDaysPast || 30;
    const futureDays = options?.timeRangeDaysFuture || 90;

    const timeMin = new Date(Date.now() - pastDays * 86400000).toISOString();
    const timeMax = new Date(Date.now() + futureDays * 86400000).toISOString();

    let syncToken = options?.forceFullSync ? null : integration.sync_token;

    // =========================================================================
    // STEP A: GOOGLE → PACT PULL (Import / Update / Delete)
    // =========================================================================
    let listRes = await client.listEvents({
      calendarId,
      syncToken,
      timeMin: syncToken ? undefined : timeMin,
      timeMax: syncToken ? undefined : timeMax,
    });

    // If syncToken is expired (HTTP 410), perform full sync fallback
    if (listRes.syncTokenExpired) {
      syncToken = null;
      listRes = await client.listEvents({
        calendarId,
        timeMin,
        timeMax,
      });
    }

    if (listRes.error || !listRes.data) {
      summary.errors.push(listRes.error || 'Failed to list Google Calendar events.');
      await supabase
        .from('google_calendar_integrations')
        .update({
          sync_status: 'error',
          last_error: listRes.error,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      return summary;
    }

    const googleItems = listRes.data.items || [];
    summary.syncToken = listRes.data.nextSyncToken || null;

    // Process incoming Google events
    for (const gEvent of googleItems) {
      try {
        if (gEvent.status === 'cancelled') {
          // Event was deleted in Google Calendar
          const { error: delError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('user_id', userId)
            .eq('google_event_id', gEvent.id);

          if (!delError) summary.deletedCount++;
        } else {
          // Check existing local event
          const { data: existingEvent } = await supabase
            .from('calendar_events')
            .select('id, google_etag, updated_at')
            .eq('user_id', userId)
            .eq('google_event_id', gEvent.id)
            .maybeSingle();

          if (existingEvent) {
            // Loop prevention: if etags match, skip identical update
            if (existingEvent.google_etag && existingEvent.google_etag === gEvent.etag) {
              continue;
            }

            // Conflict resolution: Last-Write-Wins based on timestamps
            const googleUpdatedTime = gEvent.updated ? new Date(gEvent.updated).getTime() : 0;
            const localUpdatedTime = new Date(existingEvent.updated_at).getTime();

            // If Google is newer or equal, update local event
            if (googleUpdatedTime >= localUpdatedTime) {
              const mapped = mapGoogleToPactEvent(gEvent, userId);
              await supabase
                .from('calendar_events')
                .update({
                  title: mapped.title,
                  description: mapped.description,
                  start_time: mapped.start_time,
                  end_time: mapped.end_time,
                  google_etag: mapped.google_etag,
                  last_synced_at: mapped.last_synced_at,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingEvent.id)
                .eq('user_id', userId);

              summary.updatedCount++;
            }
          } else {
            // New event from Google -> insert into PACT
            const mapped = mapGoogleToPactEvent(gEvent, userId);
            const { error: insertError } = await supabase
              .from('calendar_events')
              .insert(mapped);

            if (!insertError) {
              summary.importedCount++;
            }
          }
        }
      } catch (itemErr: unknown) {
        const msg = itemErr instanceof Error ? itemErr.message : 'Unknown item processing error';
        summary.errors.push(`Event ${gEvent.id}: ${msg}`);
      }
    }

    // =========================================================================
    // STEP B: PACT → GOOGLE PUSH (Export unsynced / local modifications)
    // =========================================================================
    const { data: localEventsToSync } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_external', false)
      .gte('start_time', timeMin)
      .lte('start_time', timeMax);

    if (localEventsToSync && localEventsToSync.length > 0) {
      for (const localEvent of localEventsToSync as CalendarEvent[]) {
        try {
          if (!localEvent.google_event_id) {
            // Native PACT event not yet in Google Calendar -> Insert
            const gPayload = mapPactToGoogleEvent(localEvent);
            const insertRes = await client.insertEvent(gPayload, calendarId);

            if (insertRes.data && !insertRes.error) {
              await supabase
                .from('calendar_events')
                .update({
                  google_event_id: insertRes.data.id,
                  google_etag: insertRes.data.etag || null,
                  google_calendar_id: calendarId,
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', localEvent.id)
                .eq('user_id', userId);

              summary.exportedCount++;
            }
          } else if (
            localEvent.last_synced_at &&
            new Date(localEvent.updated_at).getTime() > new Date(localEvent.last_synced_at).getTime()
          ) {
            // Locally modified native PACT event -> Patch in Google Calendar
            const gPayload = mapPactToGoogleEvent(localEvent);
            const patchRes = await client.patchEvent(
              localEvent.google_event_id,
              gPayload,
              calendarId
            );

            if (patchRes.data && !patchRes.error) {
              await supabase
                .from('calendar_events')
                .update({
                  google_etag: patchRes.data.etag || null,
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', localEvent.id)
                .eq('user_id', userId);

              summary.pushedCount++;
            }
          }
        } catch (pushErr: unknown) {
          const msg = pushErr instanceof Error ? pushErr.message : 'Error pushing PACT event';
          summary.errors.push(`Local event ${localEvent.id}: ${msg}`);
        }
      }
    }

    // 3. Finalize Integration Status
    await supabase
      .from('google_calendar_integrations')
      .update({
        sync_status: 'synced',
        sync_token: summary.syncToken || integration.sync_token,
        last_synced_at: new Date().toISOString(),
        last_error: summary.errors.length > 0 ? summary.errors.join('; ') : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    summary.success = summary.errors.length === 0;
    return summary;
  } catch (syncErr: unknown) {
    const msg = syncErr instanceof Error ? syncErr.message : 'Unexpected sync error';
    summary.errors.push(msg);

    await supabase
      .from('google_calendar_integrations')
      .update({
        sync_status: 'error',
        last_error: msg,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return summary;
  }
}

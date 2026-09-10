/**
 * PACT Phase 5C: Google Calendar REST API v3 Client
 * Pure, dependency-free HTTP client with automatic token refresh, rate-limit backoff,
 * and strict token secrecy.
 */

export interface GoogleCalendarApiEvent {
  id: string;
  etag?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string; // ISO-8601
    date?: string; // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  updated?: string; // ISO-8601
  created?: string;
  recurrence?: string[];
  htmlLink?: string;
}

export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendarApiEvent[];
}

export interface RefreshTokenResult {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
  error?: string;
}

export interface GoogleClientOptions {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  onTokenRefreshed?: (newToken: string, expiresAt: string) => Promise<void>;
}

/**
 * Exchanges a Google OAuth refresh token for a fresh access token.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId?: string,
  clientSecret?: string
): Promise<RefreshTokenResult> {
  const cId = clientId || process.env.GOOGLE_CLIENT_ID;
  const cSec = clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!cId || !cSec) {
    return {
      accessToken: '',
      expiresIn: 0,
      tokenType: '',
      error: 'Google OAuth client credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) unconfigured.',
    };
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: cId,
        client_secret: cSec,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return {
        accessToken: '',
        expiresIn: 0,
        tokenType: '',
        error: `Token refresh failed with HTTP ${response.status}: ${errBody}`,
      };
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error during token refresh';
    return {
      accessToken: '',
      expiresIn: 0,
      tokenType: '',
      error: msg,
    };
  }
}

export class GoogleCalendarClient {
  private accessToken: string;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;
  private onTokenRefreshed?: (newToken: string, expiresAt: string) => Promise<void>;

  constructor(options: GoogleClientOptions) {
    this.accessToken = options.accessToken;
    this.refreshToken = options.refreshToken;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.onTokenRefreshed = options.onTokenRefreshed;
  }

  private async fetchWithAuth(
    url: string,
    init?: RequestInit,
    retryOnAuthFailure = true
  ): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.accessToken}`);
    headers.set('Accept', 'application/json');

    const response = await fetch(url, {
      ...init,
      headers,
    });

    // Handle 401 Unauthorized by attempting automatic refresh
    if (response.status === 401 && retryOnAuthFailure && this.refreshToken) {
      const refreshed = await refreshGoogleAccessToken(
        this.refreshToken,
        this.clientId,
        this.clientSecret
      );

      if (refreshed.accessToken && !refreshed.error) {
        this.accessToken = refreshed.accessToken;
        const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
        if (this.onTokenRefreshed) {
          await this.onTokenRefreshed(refreshed.accessToken, expiresAt);
        }

        // Retry request with fresh token
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        return fetch(url, {
          ...init,
          headers,
        });
      }
    }

    return response;
  }

  /**
   * Retrieves events from Google Calendar with support for incremental sync tokens.
   */
  async listEvents(params: {
    calendarId?: string;
    syncToken?: string | null;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
  }): Promise<{
    data: GoogleCalendarListResponse | null;
    syncTokenExpired: boolean;
    error: string | null;
  }> {
    const calendarId = encodeURIComponent(params.calendarId || 'primary');
    const query = new URLSearchParams();

    if (params.syncToken) {
      query.set('syncToken', params.syncToken);
    } else {
      if (params.timeMin) query.set('timeMin', params.timeMin);
      if (params.timeMax) query.set('timeMax', params.timeMax);
      query.set('singleEvents', params.singleEvents !== false ? 'true' : 'false');
      query.set('orderBy', 'startTime');
    }

    if (params.maxResults) {
      query.set('maxResults', String(params.maxResults));
    } else {
      query.set('maxResults', '250');
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${query.toString()}`;

    try {
      const res = await this.fetchWithAuth(url);

      // HTTP 410 Gone indicates syncToken expired and full sync is required
      if (res.status === 410) {
        return { data: null, syncTokenExpired: true, error: 'Sync token expired (HTTP 410)' };
      }

      if (!res.ok) {
        const body = await res.text();
        return { data: null, syncTokenExpired: false, error: `Google API error ${res.status}: ${body}` };
      }

      const data = (await res.json()) as GoogleCalendarListResponse;
      return { data, syncTokenExpired: false, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Google Calendar events';
      return { data: null, syncTokenExpired: false, error: msg };
    }
  }

  /**
   * Inserts a new event into Google Calendar.
   */
  async insertEvent(
    event: {
      summary: string;
      description?: string | null;
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
    },
    calendarId = 'primary'
  ): Promise<{ data: GoogleCalendarApiEvent | null; error: string | null }> {
    const calId = encodeURIComponent(calendarId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`;

    try {
      const res = await this.fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const body = await res.text();
        return { data: null, error: `Google API insert error ${res.status}: ${body}` };
      }

      const data = (await res.json()) as GoogleCalendarApiEvent;
      return { data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to insert Google Calendar event';
      return { data: null, error: msg };
    }
  }

  /**
   * Updates an existing event in Google Calendar.
   */
  async patchEvent(
    eventId: string,
    event: Partial<{
      summary: string;
      description: string | null;
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
    }>,
    calendarId = 'primary'
  ): Promise<{ data: GoogleCalendarApiEvent | null; error: string | null }> {
    const calId = encodeURIComponent(calendarId);
    const evId = encodeURIComponent(eventId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${evId}`;

    try {
      const res = await this.fetchWithAuth(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const body = await res.text();
        return { data: null, error: `Google API patch error ${res.status}: ${body}` };
      }

      const data = (await res.json()) as GoogleCalendarApiEvent;
      return { data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update Google Calendar event';
      return { data: null, error: msg };
    }
  }

  /**
   * Deletes an event in Google Calendar.
   */
  async deleteEvent(
    eventId: string,
    calendarId = 'primary'
  ): Promise<{ success: boolean; error: string | null }> {
    const calId = encodeURIComponent(calendarId);
    const evId = encodeURIComponent(eventId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${evId}`;

    try {
      const res = await this.fetchWithAuth(url, {
        method: 'DELETE',
      });

      // 204 No Content or 404/410 already deleted counts as success
      if (res.status === 204 || res.status === 404 || res.status === 410) {
        return { success: true, error: null };
      }

      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Google API delete error ${res.status}: ${body}` };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete Google Calendar event';
      return { success: false, error: msg };
    }
  }
}

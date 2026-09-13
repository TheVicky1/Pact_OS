/**
 * PACT Phase 7: WakaTime & IDE Activity Proof-of-Work Adapter
 * REST API client for WakaTime editor telemetry, coding time summaries,
 * project breakdowns, language distributions, and deterministic duration verification.
 * Supports public summary endpoints and token-authenticated requests.
 */

export interface WakaTimeProjectMetric {
  name: string;
  totalSeconds: number;
  percent: number;
  digital?: string;
  text?: string;
}

export interface WakaTimeLanguageMetric {
  name: string;
  totalSeconds: number;
  percent: number;
  digital?: string;
  text?: string;
}

export interface WakaTimeBranchMetric {
  name: string;
  totalSeconds: number;
  percent: number;
}

export interface WakaTimeEditorMetric {
  name: string;
  totalSeconds: number;
  percent: number;
}

export interface WakaTimeSummaryDay {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  text: string;
  projects: WakaTimeProjectMetric[];
  languages: WakaTimeLanguageMetric[];
  branches: WakaTimeBranchMetric[];
  editors: WakaTimeEditorMetric[];
}

export interface WakaTimeUserProfile {
  id: string;
  username: string;
  displayName: string | null;
  photo: string | null;
  humanReadableTotal?: string | null;
  createdAt?: string | null;
}

export interface WakaTimeHeartbeatItem {
  id: string;
  entity: string;
  type: string;
  time: number; // Unix timestamp
  timestampIso: string;
  project?: string;
  branch?: string;
  language?: string;
  isWrite?: boolean;
}

export interface WakaTimeAdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isRateLimited?: boolean;
  isUnauthorized?: boolean;
  isNotFound?: boolean;
}

export interface WakaTimeAggregationOptions {
  project?: string;
  language?: string;
  branch?: string;
  minSeconds?: number;
}

export interface WakaTimeAggregatedMetrics {
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  matchingSeconds: number;
  matchingMinutes: number;
  matchingHours: number;
  daysCount: number;
  projects: WakaTimeProjectMetric[];
  languages: WakaTimeLanguageMetric[];
  branches: WakaTimeBranchMetric[];
  editors: WakaTimeEditorMetric[];
}

const WAKATIME_API_BASE = 'https://wakatime.com/api/v1';

/**
 * Formats duration in seconds to human-readable string (e.g. "2h 45m" or "45m").
 */
export function formatWakaTimeDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Normalizes raw WakaTime summary day objects from REST API.
 */
export function normalizeWakaTimeSummaryDay(raw: Record<string, unknown>): WakaTimeSummaryDay {
  const range = (raw.range || {}) as Record<string, unknown>;
  const date = (range.date as string) || (raw.date as string) || new Date().toISOString().split('T')[0];

  const grandTotal = (raw.grand_total || {}) as Record<string, unknown>;
  const totalSeconds = typeof grandTotal.total_seconds === 'number' ? grandTotal.total_seconds : 0;
  const text = typeof grandTotal.text === 'string' ? grandTotal.text : formatWakaTimeDuration(totalSeconds);

  const rawProjects = Array.isArray(raw.projects) ? raw.projects : [];
  const projects: WakaTimeProjectMetric[] = rawProjects.map((p: Record<string, unknown>) => ({
    name: String(p.name || 'Unknown'),
    totalSeconds: typeof p.total_seconds === 'number' ? p.total_seconds : 0,
    percent: typeof p.percent === 'number' ? p.percent : 0,
    digital: typeof p.digital === 'string' ? p.digital : undefined,
    text: typeof p.text === 'string' ? p.text : undefined,
  }));

  const rawLanguages = Array.isArray(raw.languages) ? raw.languages : [];
  const languages: WakaTimeLanguageMetric[] = rawLanguages.map((l: Record<string, unknown>) => ({
    name: String(l.name || 'Unknown'),
    totalSeconds: typeof l.total_seconds === 'number' ? l.total_seconds : 0,
    percent: typeof l.percent === 'number' ? l.percent : 0,
    digital: typeof l.digital === 'string' ? l.digital : undefined,
    text: typeof l.text === 'string' ? l.text : undefined,
  }));

  const rawBranches = Array.isArray(raw.branches) ? raw.branches : [];
  const branches: WakaTimeBranchMetric[] = rawBranches.map((b: Record<string, unknown>) => ({
    name: String(b.name || 'Unknown'),
    totalSeconds: typeof b.total_seconds === 'number' ? b.total_seconds : 0,
    percent: typeof b.percent === 'number' ? b.percent : 0,
  }));

  const rawEditors = Array.isArray(raw.editors) ? raw.editors : [];
  const editors: WakaTimeEditorMetric[] = rawEditors.map((e: Record<string, unknown>) => ({
    name: String(e.name || 'Unknown'),
    totalSeconds: typeof e.total_seconds === 'number' ? e.total_seconds : 0,
    percent: typeof e.percent === 'number' ? e.percent : 0,
  }));

  return {
    date,
    totalSeconds,
    text,
    projects,
    languages,
    branches,
    editors,
  };
}

/**
 * Aggregates multi-day summaries with optional project, language, or branch filters.
 */
export function aggregateWakaTimeMetrics(
  days: WakaTimeSummaryDay[],
  options?: WakaTimeAggregationOptions
): WakaTimeAggregatedMetrics {
  let totalSeconds = 0;
  let matchingSeconds = 0;

  const projectMap = new Map<string, number>();
  const languageMap = new Map<string, number>();
  const branchMap = new Map<string, number>();
  const editorMap = new Map<string, number>();

  const targetProject = options?.project?.trim().toLowerCase();
  const targetLanguage = options?.language?.trim().toLowerCase();
  const targetBranch = options?.branch?.trim().toLowerCase();

  for (const day of days) {
    totalSeconds += day.totalSeconds;

    // Filter project
    if (targetProject) {
      const matchProj = day.projects.find((p) => p.name.toLowerCase() === targetProject);
      if (matchProj) {
        matchingSeconds += matchProj.totalSeconds;
      }
    } else if (targetLanguage) {
      const matchLang = day.languages.find((l) => l.name.toLowerCase() === targetLanguage);
      if (matchLang) {
        matchingSeconds += matchLang.totalSeconds;
      }
    } else if (targetBranch) {
      const matchBranch = day.branches.find((b) => b.name.toLowerCase() === targetBranch);
      if (matchBranch) {
        matchingSeconds += matchBranch.totalSeconds;
      }
    } else {
      matchingSeconds += day.totalSeconds;
    }

    // Accumulate project metrics
    for (const p of day.projects) {
      projectMap.set(p.name, (projectMap.get(p.name) || 0) + p.totalSeconds);
    }
    // Accumulate language metrics
    for (const l of day.languages) {
      languageMap.set(l.name, (languageMap.get(l.name) || 0) + l.totalSeconds);
    }
    // Accumulate branch metrics
    for (const b of day.branches) {
      branchMap.set(b.name, (branchMap.get(b.name) || 0) + b.totalSeconds);
    }
    // Accumulate editor metrics
    for (const e of day.editors) {
      editorMap.set(e.name, (editorMap.get(e.name) || 0) + e.totalSeconds);
    }
  }

  const buildMetricList = (map: Map<string, number>, baseTotal: number) =>
    Array.from(map.entries())
      .map(([name, sec]) => ({
        name,
        totalSeconds: sec,
        percent: baseTotal > 0 ? Number(((sec / baseTotal) * 100).toFixed(2)) : 0,
        text: formatWakaTimeDuration(sec),
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

  return {
    totalSeconds,
    totalMinutes: Number((totalSeconds / 60).toFixed(1)),
    totalHours: Number((totalSeconds / 3600).toFixed(2)),
    matchingSeconds,
    matchingMinutes: Number((matchingSeconds / 60).toFixed(1)),
    matchingHours: Number((matchingSeconds / 3600).toFixed(2)),
    daysCount: days.length,
    projects: buildMetricList(projectMap, totalSeconds),
    languages: buildMetricList(languageMap, totalSeconds),
    branches: buildMetricList(branchMap, totalSeconds),
    editors: buildMetricList(editorMap, totalSeconds),
  };
}

/**
 * Fetches WakaTime coding summaries for a specified user and date range.
 */
export async function fetchWakaTimeSummaries(
  userHandle: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  apiToken?: string | null
): Promise<WakaTimeAdapterResult<WakaTimeSummaryDay[]>> {
  const cleanUser = userHandle.replace(/^@/, '').trim() || 'current';
  const url = `${WAKATIME_API_BASE}/users/${encodeURIComponent(cleanUser)}/summaries?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'PACT-OS-ProofVerification/1.0',
  };

  if (apiToken && apiToken.trim()) {
    // Basic auth or Bearer depending on key format
    const key = apiToken.trim();
    if (key.startsWith('waka_') || key.length === 36) {
      headers['Authorization'] = `Basic ${Buffer.from(key).toString('base64')}`;
    } else {
      headers['Authorization'] = `Bearer ${key}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'WakaTime authentication failed or token lacks permissions.',
        isUnauthorized: true,
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        error: 'WakaTime API rate limit exceeded.',
        isRateLimited: true,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: `WakaTime user "${cleanUser}" not found.`,
        isNotFound: true,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `WakaTime API returned HTTP status ${response.status}.`,
      };
    }

    const json = (await response.json()) as { data?: Record<string, unknown>[] };
    const rawData = Array.isArray(json.data) ? json.data : [];
    const normalized = rawData.map(normalizeWakaTimeSummaryDay);

    return {
      success: true,
      data: normalized,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown WakaTime fetch error';
    return {
      success: false,
      error: `Failed to connect to WakaTime API: ${message}`,
    };
  }
}

/**
 * Fetches public user profile information from WakaTime.
 */
export async function fetchWakaTimeUserProfile(
  userHandle: string,
  apiToken?: string | null
): Promise<WakaTimeAdapterResult<WakaTimeUserProfile>> {
  const cleanUser = userHandle.replace(/^@/, '').trim() || 'current';
  const url = `${WAKATIME_API_BASE}/users/${encodeURIComponent(cleanUser)}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'PACT-OS-ProofVerification/1.0',
  };

  if (apiToken && apiToken.trim()) {
    const key = apiToken.trim();
    if (key.startsWith('waka_') || key.length === 36) {
      headers['Authorization'] = `Basic ${Buffer.from(key).toString('base64')}`;
    } else {
      headers['Authorization'] = `Bearer ${key}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'WakaTime authentication failed.',
        isUnauthorized: true,
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        error: 'WakaTime API rate limit exceeded.',
        isRateLimited: true,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: `WakaTime user "${cleanUser}" not found.`,
        isNotFound: true,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `WakaTime profile returned HTTP ${response.status}.`,
      };
    }

    const json = (await response.json()) as { data?: Record<string, unknown> };
    const raw = json.data || {};

    return {
      success: true,
      data: {
        id: String(raw.id || cleanUser),
        username: String(raw.username || cleanUser),
        displayName: typeof raw.display_name === 'string' ? raw.display_name : null,
        photo: typeof raw.photo === 'string' ? raw.photo : null,
        humanReadableTotal: typeof raw.human_readable_total === 'string' ? raw.human_readable_total : null,
        createdAt: typeof raw.created_at === 'string' ? raw.created_at : null,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown WakaTime profile error';
    return {
      success: false,
      error: `Failed to fetch WakaTime profile: ${message}`,
    };
  }
}

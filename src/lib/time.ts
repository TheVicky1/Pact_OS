/**
 * PACT Phase 2E — Pure Temporal Engine & Timezone Abstraction Layer
 * Provides deterministic, timezone-aware, server-safe temporal operations.
 */

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class TestClock implements Clock {
  private fixedInstant: Date;

  constructor(instant: Date | string | number) {
    this.fixedInstant = new Date(instant);
  }

  setInstant(instant: Date | string | number): void {
    this.fixedInstant = new Date(instant);
  }

  now(): Date {
    return new Date(this.fixedInstant.getTime());
  }
}

export const defaultClock: Clock = new SystemClock();

/**
 * Validates whether a string is a valid IANA timezone identifier.
 * Uses native Intl.DateTimeFormat to prevent invalid abbreviations like 'IST' or 'PST'.
 */
export function isValidIanaTimezone(timeZone: string): boolean {
  if (!timeZone || typeof timeZone !== 'string') return false;
  const trimmed = timeZone.trim();
  // Reject non-canonical abbreviations (e.g. IST, PST, EST) or GMT offset strings that lack slash
  if (
    !trimmed.includes('/') &&
    !['UTC', 'GMT', 'Etc/UTC', 'Etc/GMT'].includes(trimmed)
  ) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export interface LocalToUtcResult {
  utcIso: string | null;
  isNonexistent: boolean;
  isAmbiguous: boolean;
  error: string | null;
}

/**
 * Helper to get the UTC offset in minutes for a given wall-clock date in a specific IANA timezone.
 */
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => {
    const val = parts.find((p) => p.type === type)?.value;
    return val ? parseInt(val, 10) : 0;
  };

  const year = getPart('year');
  const month = getPart('month') - 1;
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === 24) hour = 0;
  const minute = getPart('minute');
  const second = getPart('second');

  const asUtc = Date.UTC(year, month, day, hour, minute, second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/**
 * Converts a local wall-clock date/time string (e.g. "2026-10-15T18:30") in a specific IANA timezone
 * to an absolute UTC ISO timestamp.
 * Handles DST spring-forward (nonexistent local times) and fall-back (ambiguous local times).
 */
export function localToUtc(localDateTimeStr: string, timeZone: string): LocalToUtcResult {
  if (!isValidIanaTimezone(timeZone)) {
    return { utcIso: null, isNonexistent: false, isAmbiguous: false, error: `Invalid IANA timezone: ${timeZone}` };
  }

  if (!localDateTimeStr || typeof localDateTimeStr !== 'string') {
    return { utcIso: null, isNonexistent: false, isAmbiguous: false, error: 'Invalid local date string provided.' };
  }

  // Parse YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  const match = localDateTimeStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return { utcIso: null, isNonexistent: false, isAmbiguous: false, error: 'Format must be YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss.' };
  }

  const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);
  const second = secStr ? parseInt(secStr, 10) : 0;

  // Initial estimate pretending local wall-clock components are UTC
  const targetUtcGuess = Date.UTC(year, month, day, hour, minute, second);
  const approxDate = new Date(targetUtcGuess);

  // Compute offset in timezone for this target date
  const offsetMinutes = getTimezoneOffsetMinutes(approxDate, timeZone);
  const calculatedUtcTime = targetUtcGuess - offsetMinutes * 60000;
  const finalDate = new Date(calculatedUtcTime);

  // Verify reverse conversion matches original wall-clock input
  const reverseOffset = getTimezoneOffsetMinutes(finalDate, timeZone);
  const reverseUtcTime = targetUtcGuess - reverseOffset * 60000;
  const reverseDate = new Date(reverseUtcTime);

  const checkFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Helper function to check if a UTC timestamp formats back to the target wall-clock time
  const formatsToTarget = (utcMs: number) => {
    const p = checkFormatter.formatToParts(new Date(utcMs));
    const g = (t: string) => parseInt(p.find((x) => x.type === t)?.value || '0', 10);
    let h = g('hour');
    if (h === 24) h = 0;
    return (
      g('year') === year &&
      g('month') - 1 === month &&
      g('day') === day &&
      h === hour &&
      g('minute') === minute
    );
  };

  const matchesOriginal = formatsToTarget(reverseUtcTime);

  if (!matchesOriginal) {
    // Nonexistent local time (e.g. DST spring forward gap)
    return {
      utcIso: reverseDate.toISOString(),
      isNonexistent: true,
      isAmbiguous: false,
      error: `Local time ${localDateTimeStr} does not exist in timezone ${timeZone} due to DST spring-forward shift.`,
    };
  }

  // Check for ambiguous time (fall-back overlap) by checking alternative UTC candidate offsets
  const offMinus1h = getTimezoneOffsetMinutes(new Date(reverseUtcTime - 3600000), timeZone);
  const offPlus1h = getTimezoneOffsetMinutes(new Date(reverseUtcTime + 3600000), timeZone);

  const altUtc1 = targetUtcGuess - offMinus1h * 60000;
  const altUtc2 = targetUtcGuess - offPlus1h * 60000;

  const isAmbiguous =
    (altUtc1 !== reverseUtcTime && formatsToTarget(altUtc1)) ||
    (altUtc2 !== reverseUtcTime && formatsToTarget(altUtc2));

  return {
    utcIso: reverseDate.toISOString(),
    isNonexistent: false,
    isAmbiguous: Boolean(isAmbiguous),
    error: null,
  };
}

/**
 * Converts a stored UTC ISO string to a user-local formatted string with timezone context.
 */
export function utcToLocal(
  utcIsoStr: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isValidIanaTimezone(timeZone)) {
    timeZone = 'UTC';
  }

  try {
    const date = new Date(utcIsoStr);
    if (isNaN(date.getTime())) return utcIsoStr;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
      ...options,
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch {
    return utcIsoStr;
  }
}

/**
 * Evaluates whether a Task deadline instant has been reached (now >= deadline).
 * Operates purely on absolute temporal comparison (Date milliseconds).
 */
export function isDeadlineReached(deadlineAt: Date | string, clock: Clock = defaultClock): boolean {
  const deadlineTime = new Date(deadlineAt).getTime();
  const nowTime = clock.now().getTime();
  if (isNaN(deadlineTime)) return false;
  return nowTime >= deadlineTime;
}

/**
 * Compares two temporal instants.
 * Returns negative if instantA < instantB, 0 if equal, positive if instantA > instantB.
 */
export function compareInstants(instantA: Date | string, instantB: Date | string): number {
  const timeA = new Date(instantA).getTime();
  const timeB = new Date(instantB).getTime();
  return timeA - timeB;
}

/**
 * Returns temporal deadline state ('FUTURE' or 'EXPIRED').
 */
export function getDeadlineStatus(deadlineAt: Date | string, clock: Clock = defaultClock): 'FUTURE' | 'EXPIRED' {
  return isDeadlineReached(deadlineAt, clock) ? 'EXPIRED' : 'FUTURE';
}

/**
 * Converts a stored UTC ISO string to a wall-clock "YYYY-MM-DDTHH:mm" string
 * formatted for <input type="datetime-local"> in a specific IANA timezone.
 */
export function utcToDatetimeLocalInput(utcIsoStr: string, timeZone: string): string {
  if (!isValidIanaTimezone(timeZone)) {
    timeZone = 'UTC';
  }
  const date = new Date(utcIsoStr);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  const minute = getPart('minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Gets the default wall-clock deadline string ("YYYY-MM-DDTHH:mm") for tomorrow at 23:59
 * in a specific IANA timezone.
 */
export function getDefaultLocalDeadline(timeZone: string, clock: Clock = defaultClock): string {
  if (!isValidIanaTimezone(timeZone)) {
    timeZone = 'UTC';
  }
  const now = clock.now();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const getPart = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || '0', 10);
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');

  // Advance by 1 calendar day
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
  const y = tomorrow.getUTCFullYear();
  const m = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T23:59`;
}

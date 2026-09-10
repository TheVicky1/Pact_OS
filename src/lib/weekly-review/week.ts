/**
 * PACT Phase 6D: Deterministic Weekly Review Temporal Engine
 * Computes authoritative ISO week boundaries, Sunday ritual availability,
 * and deterministic week navigation respecting the user's IANA timezone.
 */

import {
  isValidIanaTimezone,
  getWeekBoundariesUtc,
  getWeekDaysForDate,
  formatWeekRangeHeader,
  addDaysToDateString,
  getLocalDateString,
} from '../time';

export interface ReviewWeekBounds {
  weekStart: string; // YYYY-MM-DD (ISO Monday)
  weekEnd: string; // YYYY-MM-DD (ISO Sunday)
  mondayStr: string;
  sundayStr: string;
  weekLabel: string;
  startUtc: string;
  endUtc: string;
}

/**
 * Resolves deterministic ISO week boundaries (Monday to Sunday) for any given date in a timezone.
 */
export function getReviewWeekBounds(
  dateStr: string,
  timeZone: string
): ReviewWeekBounds {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const { startUtc, endUtc, mondayStr, sundayStr } = getWeekBoundariesUtc(
    dateStr,
    safeTz
  );
  const weekLabel = formatWeekRangeHeader(dateStr, safeTz);

  return {
    weekStart: mondayStr,
    weekEnd: sundayStr,
    mondayStr,
    sundayStr,
    weekLabel,
    startUtc,
    endUtc,
  };
}

/**
 * Returns the week bounds for the week immediately preceding the provided week_start.
 */
export function getPreviousWeekBounds(
  weekStartStr: string,
  timeZone: string
): ReviewWeekBounds {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const prevDateStr = addDaysToDateString(weekStartStr, -7);
  return getReviewWeekBounds(prevDateStr, safeTz);
}

/**
 * Returns the week bounds for the week immediately following the provided week_start.
 */
export function getNextWeekBounds(
  weekStartStr: string,
  timeZone: string
): ReviewWeekBounds {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const nextDateStr = addDaysToDateString(weekStartStr, 7);
  return getReviewWeekBounds(nextDateStr, safeTz);
}

/**
 * Determines if a given date is Sunday in the user's timezone (the canonical weekly review ritual day).
 */
export function isSundayRitualDay(
  dateStr: string,
  timeZone: string
): boolean {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    weekday: 'long',
  }).format(dateObj);

  return dayOfWeek.toLowerCase() === 'sunday';
}

/**
 * Determines whether weekly review is available or recommended.
 * Weekly review is always accessible on demand, but particularly surfaced on Sunday or past week end.
 */
export function isReviewAvailable(
  currentDateStr: string,
  targetWeekEndStr: string,
  timeZone: string
): boolean {
  if (currentDateStr >= targetWeekEndStr) return true;
  return isSundayRitualDay(currentDateStr, timeZone);
}

/**
 * Formats a clean review period display string, e.g. "Sep 07 – Sep 13, 2026".
 */
export function formatReviewPeriod(
  weekStart: string,
  weekEnd: string,
  timeZone: string
): string {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  return formatWeekRangeHeader(weekStart, safeTz);
}

/**
 * Verifies that a given date string corresponds to an ISO Monday in the given timezone.
 */
export function isValidWeekStart(
  dateStr: string,
  timeZone: string
): boolean {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const { mondayStr } = getWeekDaysForDate(dateStr, safeTz);
  return mondayStr === dateStr;
}

/**
 * Gets the current ISO week bounds for right now in the user's timezone.
 */
export function getCurrentWeekBounds(timeZone: string): ReviewWeekBounds {
  const safeTz = isValidIanaTimezone(timeZone) ? timeZone : 'UTC';
  const todayStr = getLocalDateString(new Date(), safeTz);
  return getReviewWeekBounds(todayStr, safeTz);
}

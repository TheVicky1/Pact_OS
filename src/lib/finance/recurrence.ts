/**
 * PACT Phase 5E: Pure Deterministic Recurrence Engine
 * Calculates next occurrence dates, manages month-end clamping (e.g. 31st Jan -> 28th Feb -> 31st Mar),
 * handles leap years, and generates upcoming projected payment schedules.
 */

import { FinanceColorTag, TransactionType } from '../money';

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type RecurrenceStatus = 'active' | 'paused' | 'archived';

export interface FinanceRecurringTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount_cents: number;
  description: string;
  frequency: RecurrenceFrequency;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  next_occurrence: string; // YYYY-MM-DD
  last_generated_date: string | null; // YYYY-MM-DD
  status: RecurrenceStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; color_tag: FinanceColorTag } | null;
}

/**
 * Returns number of days in a given year and month (1-indexed month: 1=Jan, 12=Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Formats a Date object to YYYY-MM-DD string in UTC.
 */
export function formatDateToUtcIso(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string into UTC year, month (1-12), and day (1-31).
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  return {
    year: parts[0] || 2026,
    month: parts[1] || 1,
    day: parts[2] || 1,
  };
}

/**
 * Pure deterministic advancement of a recurrence date to its next occurrence.
 * 
 * Rules:
 * 1. Weekly: Exactly +7 days.
 * 2. Biweekly: Exactly +14 days.
 * 3. Monthly:
 *    - Advance month by +1.
 *    - Preserves original start day preference.
 *    - Clamps to max days in target month (e.g. Day 31 -> Feb 28 in non-leap year, Feb 29 in leap year).
 *    - Restores to original day (e.g. 31) in subsequent months with 31 days.
 * 4. Yearly:
 *    - Advance year by +1.
 *    - Feb 29 clamps to Feb 28 in non-leap year.
 */
export function calculateNextOccurrence(
  currentDateStr: string,
  frequency: RecurrenceFrequency,
  startDateStr: string
): string {
  const current = parseDateString(currentDateStr);
  const start = parseDateString(startDateStr);
  const originalDay = start.day;

  if (frequency === 'weekly') {
    const d = new Date(Date.UTC(current.year, current.month - 1, current.day + 7));
    return formatDateToUtcIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  if (frequency === 'biweekly') {
    const d = new Date(Date.UTC(current.year, current.month - 1, current.day + 14));
    return formatDateToUtcIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  if (frequency === 'monthly') {
    let nextYear = current.year;
    let nextMonth = current.month + 1;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const daysInTargetMonth = getDaysInMonth(nextYear, nextMonth);
    const targetDay = Math.min(originalDay, daysInTargetMonth);

    return formatDateToUtcIso(nextYear, nextMonth, targetDay);
  }

  if (frequency === 'yearly') {
    const nextYear = current.year + 1;
    const targetMonth = start.month;
    const daysInTargetMonth = getDaysInMonth(nextYear, targetMonth);
    const targetDay = Math.min(originalDay, daysInTargetMonth);

    return formatDateToUtcIso(nextYear, targetMonth, targetDay);
  }

  // Fallback monthly
  return calculateNextOccurrence(currentDateStr, 'monthly', startDateStr);
}

/**
 * Checks whether a recurring transaction is due for generation as of a given date (YYYY-MM-DD).
 */
export function isRecurrenceDue(nextOccurrence: string, asOfDate: string): boolean {
  return nextOccurrence <= asOfDate;
}

/**
 * Generates an array of future projected occurrence dates for UI display.
 */
export function generateUpcomingOccurrences(
  recurrence: Pick<FinanceRecurringTransaction, 'next_occurrence' | 'frequency' | 'start_date' | 'end_date' | 'status'>,
  count: number = 3
): string[] {
  if (recurrence.status !== 'active') {
    return [];
  }

  const occurrences: string[] = [];
  let curr = recurrence.next_occurrence;

  for (let i = 0; i < count; i++) {
    if (recurrence.end_date && curr > recurrence.end_date) {
      break;
    }
    occurrences.push(curr);
    curr = calculateNextOccurrence(curr, recurrence.frequency, recurrence.start_date);
  }

  return occurrences;
}

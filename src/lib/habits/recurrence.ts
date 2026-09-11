/**
 * PACT Phase 6C: Pure Deterministic Habit Recurrence Engine
 * Evaluates scheduling eligibility, frequency rules, range occurrences,
 * and boundary conditions across timezones without clock drift.
 */

import { HabitTemplate } from './types';
import { addDaysToDateString } from '../time';

/**
 * Parses YYYY-MM-DD string into UTC date components.
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number; dayOfWeek: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return {
    year,
    month,
    day,
    dayOfWeek: d.getUTCDay(), // 0=Sun, 1=Mon, ..., 6=Sat
  };
}

/**
 * Calculates the difference in calendar days between two YYYY-MM-DD dates (d2 - d1).
 */
export function diffCalendarDays(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates whether a habit template is scheduled to occur on a given local calendar date (YYYY-MM-DD).
 * 
 * Rules:
 * 1. Must be active (paused or archived habits are not scheduled).
 * 2. Date must be on or after template.start_date.
 * 3. Date must be on or before template.end_date (if end_date is specified).
 * 4. Frequency evaluations:
 *    - 'daily': Every day.
 *    - 'weekdays': Monday through Friday (dayOfWeek in 1..5).
 *    - 'selected_days': dayOfWeek is present in template.selected_days.
 *    - 'weekly': Same day of week as template.start_date.
 *    - 'custom_interval': Days since start_date modulo interval_days === 0.
 */
export function isHabitScheduledOnDate(
  template: Pick<
    HabitTemplate,
    'status' | 'start_date' | 'end_date' | 'frequency_type' | 'selected_days' | 'interval_days'
  >,
  dateStr: string
): boolean {
  if (template.status !== 'active') {
    return false;
  }

  if (dateStr < template.start_date) {
    return false;
  }

  if (template.end_date && dateStr > template.end_date) {
    return false;
  }

  const { dayOfWeek } = parseDateParts(dateStr);

  switch (template.frequency_type) {
    case 'daily':
      return true;

    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'selected_days':
      return Array.isArray(template.selected_days) && template.selected_days.includes(dayOfWeek);

    case 'weekly': {
      const startParts = parseDateParts(template.start_date);
      return dayOfWeek === startParts.dayOfWeek;
    }

    case 'custom_interval': {
      const interval = Math.max(1, template.interval_days || 1);
      const daysDiff = diffCalendarDays(template.start_date, dateStr);
      return daysDiff >= 0 && daysDiff % interval === 0;
    }

    default:
      return false;
  }
}

/**
 * Computes all scheduled occurrence dates (YYYY-MM-DD) for a habit within a date range [startDateStr, endDateStr].
 */
export function getScheduledDatesForRange(
  template: Pick<
    HabitTemplate,
    'status' | 'start_date' | 'end_date' | 'frequency_type' | 'selected_days' | 'interval_days'
  >,
  startDateStr: string,
  endDateStr: string
): string[] {
  if (startDateStr > endDateStr) {
    return [];
  }

  const scheduledDates: string[] = [];
  let current = startDateStr;
  const days = diffCalendarDays(startDateStr, endDateStr);

  for (let i = 0; i <= days; i++) {
    if (isHabitScheduledOnDate(template, current)) {
      scheduledDates.push(current);
    }
    current = addDaysToDateString(current, 1);
  }

  return scheduledDates;
}

/**
 * Determines the next scheduled occurrence date for a habit starting from a given date.
 */
export function getNextScheduledDate(
  template: Pick<
    HabitTemplate,
    'status' | 'start_date' | 'end_date' | 'frequency_type' | 'selected_days' | 'interval_days'
  >,
  fromDateStr: string,
  maxLookaheadDays: number = 365
): string | null {
  if (template.status !== 'active') {
    return null;
  }

  let current = fromDateStr < template.start_date ? template.start_date : fromDateStr;

  for (let i = 0; i <= maxLookaheadDays; i++) {
    if (isHabitScheduledOnDate(template, current)) {
      return current;
    }
    if (template.end_date && current > template.end_date) {
      return null;
    }
    current = addDaysToDateString(current, 1);
  }

  return null;
}

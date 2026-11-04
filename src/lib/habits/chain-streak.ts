/**
 * Seinfeld "Don't Break the Chain" Streak Evaluator.
 * Pure calculation of current and longest daily completion streaks, plus progress
 * toward the next milestone. All date math operates on calendar-day "YYYY-MM-DD"
 * strings, so results are unaffected by the host timezone or daylight saving.
 */

import { addDaysToDateString, defaultClock, getLocalDateString } from '../time';

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365] as const;
const FINAL_MILESTONE = MILESTONES[MILESTONES.length - 1];

export interface DayCheckin {
  dateString: string; // ISO format 'YYYY-MM-DD'
  completed: boolean;
}

export interface ChainStreakReport {
  currentStreakDays: number;
  longestStreakDays: number;
  totalCompletedDays: number;
  /** Smallest milestone above the current streak; stays at 365 once that is reached. */
  nextMilestoneDays: number;
  /** Days left to `nextMilestoneDays`; 0 once the final milestone is reached. */
  daysUntilNextMilestone: number;
  /** True only when the reference date itself has a completed check-in. */
  isChainActiveToday: boolean;
}

/**
 * Accepts only zero-padded calendar dates that really exist, rejecting values
 * such as '2026-02-30' that Date arithmetic would roll into the next month.
 */
function isValidDateString(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && addDaysToDateString(dateString, 0) === dateString;
}

/**
 * Evaluates a habit's chain as of the reference date.
 *
 * - A missing day breaks the chain, exactly as an explicit `completed: false` does.
 * - An incomplete reference date does not break the chain: the day is still in
 *   progress, so the streak ending the day before is preserved.
 * - A date with duplicate records counts once, as completed if any record is.
 * - Records with invalid dates or dates after the reference date are ignored.
 *
 * @param checkins Check-in records in any order. The array is not mutated.
 * @param referenceDateString 'YYYY-MM-DD' date to evaluate as of. Defaults to the
 *   current date in `timeZone`.
 * @param timeZone IANA timezone used to resolve the default reference date, normally
 *   the user's profile timezone. Unused when `referenceDateString` is provided.
 * @throws {RangeError} If `referenceDateString` is not a valid calendar date.
 */
export function evaluateChainStreak(
  checkins: DayCheckin[],
  referenceDateString?: string,
  timeZone: string = 'UTC'
): ChainStreakReport {
  const referenceDate = referenceDateString ?? getLocalDateString(defaultClock.now(), timeZone);
  if (!isValidDateString(referenceDate)) {
    throw new RangeError(`Invalid reference date: "${referenceDate}". Expected YYYY-MM-DD.`);
  }

  const completedDates = new Set<string>();
  for (const { dateString, completed } of checkins) {
    // Zero-padded ISO dates sort chronologically when compared as strings.
    if (completed && isValidDateString(dateString) && dateString <= referenceDate) {
      completedDates.add(dateString);
    }
  }

  const isChainActiveToday = completedDates.has(referenceDate);

  let currentStreakDays = 0;
  let cursor = isChainActiveToday ? referenceDate : addDaysToDateString(referenceDate, -1);
  while (completedDates.has(cursor)) {
    currentStreakDays++;
    cursor = addDaysToDateString(cursor, -1);
  }

  let longestStreakDays = 0;
  let runningStreakDays = 0;
  let previousDate: string | null = null;
  for (const date of [...completedDates].sort()) {
    const continuesChain =
      previousDate !== null && addDaysToDateString(previousDate, 1) === date;
    runningStreakDays = continuesChain ? runningStreakDays + 1 : 1;
    longestStreakDays = Math.max(longestStreakDays, runningStreakDays);
    previousDate = date;
  }

  const nextMilestoneDays =
    MILESTONES.find((milestone) => milestone > currentStreakDays) ?? FINAL_MILESTONE;

  return {
    currentStreakDays,
    longestStreakDays,
    totalCompletedDays: completedDates.size,
    nextMilestoneDays,
    daysUntilNextMilestone: Math.max(nextMilestoneDays - currentStreakDays, 0),
    isChainActiveToday,
  };
}

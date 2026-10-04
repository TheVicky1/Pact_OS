/**
 * Habit Completion Heatmap Aggregator
 * Builds a GitHub-style yearly contribution grid from habit occurrence logs.
 */

import { HabitOccurrence } from '../habits/types';

export type HeatmapDensity = 0 | 1 | 2 | 3;

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number; // completed occurrences on this date
  level: HeatmapDensity; // 0 = none, 3 = three or more completions
}

/**
 * Builds a 365/366-day habit completion heatmap for a calendar year.
 *
 * The grid is column-major like GitHub: each inner array is one week with 7 slots
 * (index 0 = Sunday). Slots before Jan 1 and after Dec 31 are `null`.
 *
 * @param logs - Habit occurrences; only `completed` entries inside `year` are counted.
 * @param year - Calendar year to build (e.g. 2026).
 * @returns Weeks of day cells with completion count and density level 0–3.
 *
 * @example
 * const weeks = buildHabitHeatmapMatrix(occurrences, 2026);
 * weeks[0][4]; // { date: '2026-01-01', count: 2, level: 2 } (Jan 1 2026 is a Thursday)
 */
export function buildHabitHeatmapMatrix(
  logs: Pick<HabitOccurrence, 'scheduled_date' | 'status'>[],
  year: number
): (HeatmapCell | null)[][] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    if (log.status === 'completed') {
      counts.set(log.scheduled_date, (counts.get(log.scheduled_date) ?? 0) + 1);
    }
  }

  const weeks: (HeatmapCell | null)[][] = [];
  const day = new Date(Date.UTC(year, 0, 1));
  let week: (HeatmapCell | null)[] = Array(day.getUTCDay()).fill(null);

  while (day.getUTCFullYear() === year) {
    const date = day.toISOString().slice(0, 10);
    const count = counts.get(date) ?? 0;
    week.push({ date, count, level: Math.min(count, 3) as HeatmapDensity });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }

  if (week.length > 0) {
    weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  }
  return weeks;
}

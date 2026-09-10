/**
 * PACT Phase 6C: Pure Deterministic Habit Streak & Analytics Engine
 * Calculates active streaks, longest historical streaks, completion percentages,
 * and scheduled-day adherence without penalizing unscheduled days.
 */

import { HabitTemplate, HabitOccurrence, HabitStreakSummary, OccurrenceStatus } from './types';
import { isHabitScheduledOnDate, getScheduledDatesForRange } from './recurrence';

/**
 * Pure deterministic calculation of habit streaks and consistency metrics.
 */
export function calculateHabitStreak(
  template: Pick<
    HabitTemplate,
    'id' | 'status' | 'start_date' | 'end_date' | 'frequency_type' | 'selected_days' | 'interval_days'
  >,
  occurrences: Pick<HabitOccurrence, 'scheduled_date' | 'status'>[],
  asOfDateStr: string
): HabitStreakSummary {
  // Map occurrences by date for O(1) lookup
  const historyMap: Record<string, OccurrenceStatus> = {};
  for (const occ of occurrences) {
    historyMap[occ.scheduled_date] = occ.status;
  }

  const effectiveEnd = template.end_date && template.end_date < asOfDateStr
    ? template.end_date
    : asOfDateStr;

  const scheduledDates = getScheduledDatesForRange(template, template.start_date, effectiveEnd);

  const isScheduledToday = isHabitScheduledOnDate(template, asOfDateStr);
  const isCompletedToday = historyMap[asOfDateStr] === 'completed';

  let totalCompletions = 0;
  for (const d of scheduledDates) {
    if (historyMap[d] === 'completed') {
      totalCompletions++;
    }
  }

  const totalScheduled = scheduledDates.length;
  const completionRate = totalScheduled > 0
    ? Math.round((totalCompletions / totalScheduled) * 100)
    : 0;

  // 1. Calculate Longest Streak
  let longestStreak = 0;
  let runningStreak = 0;

  for (const d of scheduledDates) {
    const status = historyMap[d] || 'pending';
    if (status === 'completed') {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (status === 'skipped') {
      // Skipped days do not break continuity, but do not increment score
      continue;
    } else {
      // Pending on a past day or missed resets running streak
      runningStreak = 0;
    }
  }

  // 2. Calculate Current Streak
  let currentStreak = 0;
  // Iterate in reverse from most recent scheduled date
  const reversedDates = [...scheduledDates].reverse();

  for (let i = 0; i < reversedDates.length; i++) {
    const d = reversedDates[i];
    const status = historyMap[d] || 'pending';

    if (d === asOfDateStr) {
      if (status === 'completed') {
        currentStreak++;
      }
      // If pending or skipped today, do not break streak yet (still in progress)
      continue;
    }

    // For days strictly before asOfDateStr
    if (status === 'completed') {
      currentStreak++;
    } else if (status === 'skipped') {
      // Skipped preserves streak continuity
      continue;
    } else {
      // Missed or uncompleted past scheduled day breaks current streak
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    totalScheduled,
    completionRate,
    isCompletedToday,
    isScheduledToday,
    historyMap,
  };
}

/**
 * Aggregates overall consistency and habit metrics across all active habits for a user.
 */
export function calculateOverallHabitMetrics(
  habitsWithStreaks: { streak: HabitStreakSummary; template: HabitTemplate }[]
): {
  totalActiveHabits: number;
  completedTodayCount: number;
  scheduledTodayCount: number;
  todayCompletionPercentage: number;
  averageCompletionRate: number;
  highestStreak: number;
} {
  const activeHabits = habitsWithStreaks.filter((h) => h.template.status === 'active');
  const totalActiveHabits = activeHabits.length;

  let completedTodayCount = 0;
  let scheduledTodayCount = 0;
  let sumCompletionRate = 0;
  let highestStreak = 0;

  for (const item of activeHabits) {
    if (item.streak.isScheduledToday) {
      scheduledTodayCount++;
      if (item.streak.isCompletedToday) {
        completedTodayCount++;
      }
    }
    sumCompletionRate += item.streak.completionRate;
    if (item.streak.currentStreak > highestStreak) {
      highestStreak = item.streak.currentStreak;
    }
  }

  const todayCompletionPercentage = scheduledTodayCount > 0
    ? Math.round((completedTodayCount / scheduledTodayCount) * 100)
    : 0;

  const averageCompletionRate = totalActiveHabits > 0
    ? Math.round(sumCompletionRate / totalActiveHabits)
    : 0;

  return {
    totalActiveHabits,
    completedTodayCount,
    scheduledTodayCount,
    todayCompletionPercentage,
    averageCompletionRate,
    highestStreak,
  };
}

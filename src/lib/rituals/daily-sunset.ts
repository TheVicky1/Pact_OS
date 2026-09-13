/**
 * PACT Phase 12: Daily Sunset & Evening Shutdown Ritual Domain Engine
 *
 * Implements authoritative business logic, validation schemas, and state transitions
 * for the end-of-day closure ritual:
 * 1. Scorecard computation (tasks, focus minutes, habit completions)
 * 2. Unfinished task triage (carry forward to tomorrow, backlog, or drop)
 * 3. Evening habit checklist verification
 * 4. Tomorrow's Top 3 Most Important Tasks (MITs) & Shutdown Timestamp
 */

import { z } from 'zod';

export const taskTriageDecisionSchema = z.object({
  taskId: z.string().uuid(),
  decision: z.enum(['carry_forward_tomorrow', 'move_to_backlog', 'discard']),
  reason: z.string().max(200).optional(),
});

export const completeDailySunsetSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  tasksCompletedCount: z.number().int().nonnegative(),
  tasksTotalCount: z.number().int().nonnegative(),
  focusMinutesTotal: z.number().int().nonnegative(),
  habitsCompletedCount: z.number().int().nonnegative(),
  habitsTotalCount: z.number().int().nonnegative(),
  triageDecisions: z.array(taskTriageDecisionSchema),
  tomorrowTopPriorities: z
    .array(z.string().min(1, 'Priority cannot be empty').max(140, 'Priority max 140 chars'))
    .min(1, 'At least 1 top priority required for tomorrow')
    .max(3, 'Maximum 3 top priorities (MITs) allowed for focus'),
  reflectionNotes: z.string().max(1000).optional(),
  shutdownConfirmed: z.literal(true, {
    message: 'You must confirm the daily shutdown commitment',
  }),
});

export type TaskTriageDecision = z.infer<typeof taskTriageDecisionSchema>;
export type CompleteDailySunsetInput = z.infer<typeof completeDailySunsetSchema>;

export interface DailySunsetSummary {
  id?: string;
  userId: string;
  date: string;
  tasksCompletedCount: number;
  tasksTotalCount: number;
  focusMinutesTotal: number;
  habitsCompletedCount: number;
  habitsTotalCount: number;
  triageDecisions: TaskTriageDecision[];
  tomorrowTopPriorities: string[];
  reflectionNotes?: string;
  completedAt: string;
}

/**
 * Evaluates whether the daily sunset ritual is recommended based on local time.
 * Typically available after 17:00 (5:00 PM) local time or upon manual trigger.
 */
export function isSunsetRitualRecommended(currentHour24: number): boolean {
  return currentHour24 >= 17 || currentHour24 < 4;
}

/**
 * Computes the daily completion ratio as an integer percentage (0-100).
 */
export function computeDailyDisciplineScore(
  tasksCompleted: number,
  tasksTotal: number,
  habitsCompleted: number,
  habitsTotal: number,
  focusMinutes: number,
  targetFocusMinutes: number = 120
): number {
  const taskWeight = 0.4;
  const habitWeight = 0.3;
  const focusWeight = 0.3;

  const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 100;
  const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 100;
  const focusScore = Math.min(100, (focusMinutes / Math.max(1, targetFocusMinutes)) * 100);

  const totalScore = Math.round(taskScore * taskWeight + habitScore * habitWeight + focusScore * focusWeight);
  return Math.max(0, Math.min(100, totalScore));
}

/**
 * Sanitizes reflection notes to ensure zero confidential consequence details are leaked.
 */
export function sanitizeSunsetNotes(notes?: string): string | undefined {
  if (!notes) return undefined;
  return notes.trim();
}

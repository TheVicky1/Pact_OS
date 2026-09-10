/**
 * PACT Phase 6D: Weekly Review & Planning Zod Validation Schemas
 * Rigorous server and client-side validation for reflections, cleanup decisions,
 * next-week commitments, and carry-forward actions.
 */

import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const startWeeklyReviewSchema = z.object({
  weekStart: z.string().regex(dateRegex, 'Invalid week start date format (expected YYYY-MM-DD)').optional(),
});

export const weeklyReflectionSchema = z.object({
  biggestWin: z.string().max(2000, 'Biggest win cannot exceed 2000 characters').default(''),
  biggestChallenge: z.string().max(2000, 'Biggest challenge cannot exceed 2000 characters').default(''),
  whatWorked: z.string().max(2000, 'What worked cannot exceed 2000 characters').default(''),
  whatDidNotWork: z.string().max(2000, 'What did not work cannot exceed 2000 characters').default(''),
  lessonLearned: z.string().max(2000, 'Lesson learned cannot exceed 2000 characters').default(''),
  whatToStop: z.string().max(2000, 'What to stop cannot exceed 2000 characters').default(''),
  whatToContinue: z.string().max(2000, 'What to continue cannot exceed 2000 characters').default(''),
  whatToStart: z.string().max(2000, 'What to start cannot exceed 2000 characters').default(''),
});

export const rescheduledTaskItemSchema = z.object({
  taskId: z.string().regex(uuidRegex, 'Invalid task ID format'),
  title: z.string().min(1).max(255),
  previousDeadline: z.string(),
  newDeadline: z.string(),
  reason: z.string().max(500).optional(),
});

export const carriedForwardTaskItemSchema = z.object({
  taskId: z.string().regex(uuidRegex, 'Invalid task ID format'),
  title: z.string().min(1).max(255),
  newDeadline: z.string(),
});

export const archivedTaskItemSchema = z.object({
  taskId: z.string().regex(uuidRegex, 'Invalid task ID format'),
  title: z.string().min(1).max(255),
});

export const pausedHabitItemSchema = z.object({
  habitId: z.string().regex(uuidRegex, 'Invalid habit ID format'),
  name: z.string().min(1).max(255),
});

export const cleanupDecisionsSchema = z.object({
  rescheduledTasks: z.array(rescheduledTaskItemSchema).default([]),
  carriedForwardTasks: z.array(carriedForwardTaskItemSchema).default([]),
  archivedTasks: z.array(archivedTaskItemSchema).default([]),
  pausedHabits: z.array(pausedHabitItemSchema).default([]),
});

export const topPriorityItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Priority text cannot be empty').max(255, 'Priority text cannot exceed 255 characters'),
});

export const nextWeekPlanSchema = z.object({
  topPriorities: z.array(topPriorityItemSchema).max(5, 'Maximum of 5 top priorities allowed').default([]),
  committedTaskIds: z.array(z.string().regex(uuidRegex)).default([]),
  focusGoalIds: z.array(z.string().regex(uuidRegex)).default([]),
  focusProjectIds: z.array(z.string().regex(uuidRegex)).default([]),
  targetHabitIds: z.array(z.string().regex(uuidRegex)).default([]),
  focusTargetMinutes: z.number().int().min(0).max(10080).optional(),
});

export const saveReviewDraftSchema = z.object({
  reviewId: z.string().regex(uuidRegex, 'Invalid review ID format'),
  currentStep: z.number().int().min(1).max(5).default(1),
  reflection: weeklyReflectionSchema.optional(),
  cleanupDecisions: cleanupDecisionsSchema.optional(),
  nextWeekPlan: nextWeekPlanSchema.optional(),
});

export const commitWeeklyReviewSchema = z.object({
  reviewId: z.string().regex(uuidRegex, 'Invalid review ID format'),
  reflection: weeklyReflectionSchema,
  cleanupDecisions: cleanupDecisionsSchema,
  nextWeekPlan: nextWeekPlanSchema,
  metricsSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export const carryForwardTasksSchema = z.object({
  tasks: z.array(
    z.object({
      taskId: z.string().regex(uuidRegex, 'Invalid task ID format'),
      newDeadline: z.string().min(1, 'New deadline is required'),
      reason: z.string().max(500).optional(),
    })
  ).min(1, 'At least one task must be selected for carry-forward'),
});

export const reopenWeeklyReviewSchema = z.object({
  reviewId: z.string().regex(uuidRegex, 'Invalid review ID format'),
  reason: z.string().min(5, 'Reopen reason must be at least 5 characters').max(500),
});

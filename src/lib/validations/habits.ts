import { z } from 'zod';

export const habitCategorySchema = z.enum([
  'general',
  'health',
  'learning',
  'productivity',
  'mindset',
  'fitness',
  'finance',
]);

export const habitFrequencySchema = z.enum([
  'daily',
  'weekdays',
  'selected_days',
  'weekly',
  'custom_interval',
]);

export const habitStatusSchema = z.enum(['active', 'paused', 'archived']);

export const createHabitSchema = z
  .object({
    name: z.string().trim().min(1, 'Habit name is required').max(255, 'Habit name must not exceed 255 characters'),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').nullable().optional(),
    category: habitCategorySchema.default('general'),
    frequencyType: habitFrequencySchema.default('daily'),
    frequency_type: habitFrequencySchema.optional(),
    selectedDays: z.array(z.number().int().min(0).max(6)).default([]),
    selected_days: z.array(z.number().int().min(0).max(6)).optional(),
    intervalDays: z.number().int().min(1).max(365).default(1),
    interval_days: z.number().int().min(1).max(365).optional(),
    targetTimeLocal: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM format').nullable().optional(),
    target_time_local: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM format').nullable().optional(),
    targetDurationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
    target_duration_minutes: z.number().int().min(1).max(1440).nullable().optional(),
    linkedTaskId: z.string().uuid().nullable().optional(),
    linked_task_id: z.string().uuid().nullable().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').nullable().optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').nullable().optional(),
  })
  .refine(
    (data) => {
      const s = data.startDate || data.start_date;
      const e = data.endDate || data.end_date;
      if (s && e) {
        return e >= s;
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  );

export const updateHabitSchema = z.object({
  id: z.string().uuid('Invalid habit ID'),
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: habitCategorySchema.optional(),
  frequencyType: habitFrequencySchema.optional(),
  frequency_type: habitFrequencySchema.optional(),
  selectedDays: z.array(z.number().int().min(0).max(6)).optional(),
  selected_days: z.array(z.number().int().min(0).max(6)).optional(),
  intervalDays: z.number().int().min(1).max(365).optional(),
  interval_days: z.number().int().min(1).max(365).optional(),
  targetTimeLocal: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  target_time_local: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  targetDurationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  target_duration_minutes: z.number().int().min(1).max(1440).nullable().optional(),
  linkedTaskId: z.string().uuid().nullable().optional(),
  linked_task_id: z.string().uuid().nullable().optional(),
  status: habitStatusSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const completeOccurrenceSchema = z.object({
  occurrenceId: z.string().uuid().optional(),
  occurrence_id: z.string().uuid().optional(),
  notes: z.string().max(1000).nullable().optional(),
}).refine((data) => Boolean(data.occurrenceId || data.occurrence_id), {
  message: 'Occurrence ID is required',
  path: ['occurrenceId'],
});

export const occurrenceActionSchema = z.object({
  occurrenceId: z.string().uuid().optional(),
  occurrence_id: z.string().uuid().optional(),
}).refine((data) => Boolean(data.occurrenceId || data.occurrence_id), {
  message: 'Occurrence ID is required',
  path: ['occurrenceId'],
});

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, 'Routine name is required').max(255),
  description: z.string().max(2000).nullable().optional(),
  targetTimeLocal: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  target_time_local: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  habitTemplateIds: z.array(z.string().uuid()).default([]),
  habit_template_ids: z.array(z.string().uuid()).optional(),
});

export const updateRoutineSchema = z.object({
  id: z.string().uuid('Invalid routine ID'),
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  targetTimeLocal: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  target_time_local: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
  habitTemplateIds: z.array(z.string().uuid()).optional(),
  habit_template_ids: z.array(z.string().uuid()).optional(),
});

export const reorderRoutineItemsSchema = z.object({
  routineId: z.string().uuid(),
  routine_id: z.string().uuid().optional(),
  habitTemplateIds: z.array(z.string().uuid()),
  habit_template_ids: z.array(z.string().uuid()).optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;

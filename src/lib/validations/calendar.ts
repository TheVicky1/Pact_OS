import { z } from 'zod';

export const calendarColorTagSchema = z.enum([
  'gold',
  'blue',
  'purple',
  'emerald',
  'amber',
  'rose',
]);

export const createCalendarEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(255, 'Title must not exceed 255 characters.'),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters.')
      .nullable()
      .optional(),
    start_time: z
      .string()
      .datetime({ message: 'Start time must be a valid ISO 8601 timestamp.' }),
    end_time: z
      .string()
      .datetime({ message: 'End time must be a valid ISO 8601 timestamp.' }),
    color_tag: calendarColorTagSchema.default('gold'),
    goal_id: z.string().uuid('Invalid Goal UUID format.').nullable().optional(),
    project_id: z.string().uuid('Invalid Project UUID format.').nullable().optional(),
    task_id: z.string().uuid('Invalid Task UUID format.').nullable().optional(),
  })
  .refine(
    (data) => new Date(data.end_time).getTime() > new Date(data.start_time).getTime(),
    {
      message: 'End time must be after start time.',
      path: ['end_time'],
    }
  );

export const updateCalendarEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty.')
      .max(255, 'Title must not exceed 255 characters.')
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters.')
      .nullable()
      .optional(),
    start_time: z
      .string()
      .datetime({ message: 'Start time must be a valid ISO 8601 timestamp.' })
      .optional(),
    end_time: z
      .string()
      .datetime({ message: 'End time must be a valid ISO 8601 timestamp.' })
      .optional(),
    color_tag: calendarColorTagSchema.optional(),
    goal_id: z.string().uuid('Invalid Goal UUID format.').nullable().optional(),
    project_id: z.string().uuid('Invalid Project UUID format.').nullable().optional(),
    task_id: z.string().uuid('Invalid Task UUID format.').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return new Date(data.end_time).getTime() > new Date(data.start_time).getTime();
      }
      return true;
    },
    {
      message: 'End time must be after start time.',
      path: ['end_time'],
    }
  );

export type CreateCalendarEventSchema = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventSchema = z.infer<typeof updateCalendarEventSchema>;

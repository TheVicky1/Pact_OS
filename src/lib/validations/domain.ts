import { z } from 'zod';

export const goalStatusSchema = z.enum(['active', 'completed', 'archived']);
export const projectStatusSchema = z.enum(['active', 'completed', 'paused', 'archived']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'missed', 'archived']);

// Goal Validation Schemas
export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Goal title is required.')
    .max(255, 'Goal title must not exceed 255 characters.'),
  description: z.string().trim().max(2000, 'Description must not exceed 2000 characters.').nullable().optional(),
  target_date: z
    .string()
    .datetime({ message: 'Target date must be a valid ISO 8601 timestamp string.' })
    .nullable()
    .optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: goalStatusSchema.optional(),
});

// Project Validation Schemas
export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Project title is required.')
    .max(255, 'Project title must not exceed 255 characters.'),
  goal_id: z.string().uuid('Invalid Goal UUID format.').nullable().optional(),
  description: z.string().trim().max(2000, 'Description must not exceed 2000 characters.').nullable().optional(),
  color_accent: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color accent must be a valid hex color code.')
    .nullable()
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: projectStatusSchema.optional(),
});

// Task / Commitment Validation Schemas
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required.')
    .max(255, 'Task title must not exceed 255 characters.'),
  deadline_at: z.string().datetime({ message: 'Deadline must be a valid ISO 8601 timestamp string.' }),
  project_id: z.string().uuid('Invalid Project UUID format.').nullable().optional(),
  goal_id: z.string().uuid('Invalid Goal UUID format.').nullable().optional(),
  description: z.string().trim().max(2000, 'Description must not exceed 2000 characters.').nullable().optional(),
  priority: taskPrioritySchema.default('medium'),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: taskStatusSchema.optional(),
});

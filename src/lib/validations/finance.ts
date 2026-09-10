import { z } from 'zod';

export const financeColorTagSchema = z.enum([
  'gold',
  'blue',
  'purple',
  'emerald',
  'amber',
  'rose',
  'cyan',
  'slate',
]);

export const transactionTypeSchema = z.enum(['expense', 'income']);

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(64, 'Category name must not exceed 64 characters'),
  color_tag: financeColorTagSchema.default('gold'),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(64, 'Category name must not exceed 64 characters')
    .optional(),
  color_tag: financeColorTagSchema.optional(),
  is_archived: z.boolean().optional(),
});

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount_cents: z
    .number()
    .int('Amount must be an integer in cents')
    .positive('Amount must be greater than zero'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must not exceed 255 characters'),
  category_id: z.string().uuid('Invalid category ID').nullable().optional(),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
});

export const updateTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount_cents: z
    .number()
    .int('Amount must be an integer in cents')
    .positive('Amount must be greater than zero')
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  category_id: z.string().uuid('Invalid category ID').nullable().optional(),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
});

export const recurrenceFrequencySchema = z.enum(['weekly', 'biweekly', 'monthly', 'yearly']);
export const recurrenceStatusSchema = z.enum(['active', 'paused', 'archived']);

export const createRecurringTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount_cents: z
    .number()
    .int('Amount must be an integer in cents')
    .positive('Amount must be greater than zero'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must not exceed 255 characters'),
  category_id: z.string().uuid('Invalid category ID').nullable().optional(),
  frequency: recurrenceFrequencySchema.default('monthly'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be formatted as YYYY-MM-DD'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be formatted as YYYY-MM-DD')
    .nullable()
    .optional(),
  status: recurrenceStatusSchema.default('active'),
});

export const updateRecurringTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount_cents: z
    .number()
    .int('Amount must be an integer in cents')
    .positive('Amount must be greater than zero')
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  category_id: z.string().uuid('Invalid category ID').nullable().optional(),
  frequency: recurrenceFrequencySchema.optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be formatted as YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be formatted as YYYY-MM-DD')
    .nullable()
    .optional(),
  status: recurrenceStatusSchema.optional(),
});

export const createBudgetSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Period must be formatted as YYYY-MM (e.g. 2026-09)'),
  limit_cents: z
    .number()
    .int('Limit must be an integer in cents')
    .positive('Budget limit must be greater than zero'),
});

export const updateBudgetSchema = z.object({
  limit_cents: z
    .number()
    .int('Limit must be an integer in cents')
    .positive('Budget limit must be greater than zero')
    .optional(),
  is_active: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateRecurringTransactionInput = z.infer<typeof createRecurringTransactionSchema>;
export type UpdateRecurringTransactionInput = z.infer<typeof updateRecurringTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;


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

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

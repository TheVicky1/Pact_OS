/**
 * PACT OS — Phase 6E: Bulk Operations Validation Schemas
 * Strict Zod validation schemas and result structures for server-authoritative batch operations.
 */

import { z } from 'zod';

// ============================================================================
// Result Structure
// ============================================================================
export interface BulkOperationResult<T = string> {
  success: boolean;
  total: number;
  succeeded: T[];
  failed: Array<{ id: string; reason: string }>;
  skipped: string[];
  error?: string;
}

// Helper to deduplicate array of strings
const dedupeUuids = (val: string[]) => Array.from(new Set(val));

// ============================================================================
// Tasks Bulk Schemas
// ============================================================================
export const bulkCompleteTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid('Invalid task UUID format'))
    .min(1, 'At least one task must be selected')
    .max(50, 'Cannot operate on more than 50 tasks in a single batch')
    .transform(dedupeUuids),
});

export type BulkCompleteTasksInput = z.infer<typeof bulkCompleteTasksSchema>;

export const bulkUpdateTaskStatusSchema = z.object({
  taskIds: z
    .array(z.string().uuid('Invalid task UUID format'))
    .min(1, 'At least one task must be selected')
    .max(50, 'Cannot operate on more than 50 tasks in a single batch')
    .transform(dedupeUuids),
  status: z.enum(['pending', 'in_progress', 'archived'], {
    message: "Bulk status can only be set to 'pending', 'in_progress', or 'archived'. Direct completion or miss requires authoritative lifecycle actions.",
  }),
});

export type BulkUpdateTaskStatusInput = z.infer<typeof bulkUpdateTaskStatusSchema>;

export const bulkRescheduleTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid('Invalid task UUID format'))
    .min(1, 'At least one task must be selected')
    .max(50, 'Cannot operate on more than 50 tasks in a single batch')
    .transform(dedupeUuids),
  deadline_at: z.string().datetime({ message: 'Deadline must be a valid ISO 8601 UTC timestamp' }),
});

export type BulkRescheduleTasksInput = z.infer<typeof bulkRescheduleTasksSchema>;

export const bulkDeleteTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid('Invalid task UUID format'))
    .min(1, 'At least one task must be selected')
    .max(50, 'Cannot operate on more than 50 tasks in a single batch')
    .transform(dedupeUuids),
});

export type BulkDeleteTasksInput = z.infer<typeof bulkDeleteTasksSchema>;

// ============================================================================
// Finance Bulk Schemas
// ============================================================================
export const bulkCategorizeTransactionsSchema = z.object({
  transactionIds: z
    .array(z.string().uuid('Invalid transaction UUID format'))
    .min(1, 'At least one transaction must be selected')
    .max(100, 'Cannot operate on more than 100 transactions in a single batch')
    .transform(dedupeUuids),
  categoryId: z.union([z.string().uuid('Invalid category UUID format'), z.null()]).optional(),
});

export type BulkCategorizeTransactionsInput = z.infer<typeof bulkCategorizeTransactionsSchema>;

export const bulkDeleteTransactionsSchema = z.object({
  transactionIds: z
    .array(z.string().uuid('Invalid transaction UUID format'))
    .min(1, 'At least one transaction must be selected')
    .max(100, 'Cannot operate on more than 100 transactions in a single batch')
    .transform(dedupeUuids),
});

export type BulkDeleteTransactionsInput = z.infer<typeof bulkDeleteTransactionsSchema>;

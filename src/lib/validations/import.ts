/**
 * PACT Phase 7: Account Data Portability Import & Backup Validation Schemas
 * Defines strict Zod schemas for backup JSON archives, schema versions,
 * entity graph structures, and collision resolution options.
 */

import { z } from 'zod';

export const importConflictStrategySchema = z.enum(['skip_existing', 'overwrite', 'merge']);

export const importOptionsSchema = z.object({
  conflictStrategy: importConflictStrategySchema.default('skip_existing'),
  remapUserId: z.boolean().default(true),
  targetUserId: z.string().uuid().optional(),
  validateForeignKeys: z.boolean().default(true),
});

export const importEntityRecordSchema = z.record(z.string(), z.unknown());

export const userAccountBackupSchema = z.object({
  schema_version: z.string().min(1, 'schema_version is required.'),
  exported_at: z.string().datetime({ message: 'exported_at must be an ISO 8601 date string.' }).or(z.string().min(1)),
  user_id: z.string().min(1, 'user_id is required.'),
  profile: z.record(z.string(), z.unknown()).optional(),
  onboarding: z.record(z.string(), z.unknown()).optional(),
  goals: z.array(importEntityRecordSchema).default([]),
  projects: z.array(importEntityRecordSchema).default([]),
  tasks: z.array(importEntityRecordSchema).default([]),
  commitments: z.array(importEntityRecordSchema).default([]),
  verification_sessions: z.array(importEntityRecordSchema).default([]),
  waivers: z.array(importEntityRecordSchema).default([]),
  accountability_events: z.array(importEntityRecordSchema).default([]),
  consequence_definitions: z.array(importEntityRecordSchema).default([]),
  calendar_events: z.array(importEntityRecordSchema).default([]),
  finance: z
    .object({
      categories: z.array(importEntityRecordSchema).default([]),
      transactions: z.array(importEntityRecordSchema).default([]),
      recurring_transactions: z.array(importEntityRecordSchema).default([]),
      budgets: z.array(importEntityRecordSchema).default([]),
    })
    .default({ categories: [], transactions: [], recurring_transactions: [], budgets: [] }),
  notifications: z.array(importEntityRecordSchema).default([]),
  notification_channels: z.array(importEntityRecordSchema).default([]),
  integrations: z
    .object({
      external_providers: z.array(importEntityRecordSchema).default([]),
    })
    .default({ external_providers: [] }),
  external_proof_evidence: z.array(importEntityRecordSchema).default([]),
  focus_sessions: z.array(importEntityRecordSchema).default([]),
  habits: z
    .object({
      habits: z.array(importEntityRecordSchema).default([]),
      occurrences: z.array(importEntityRecordSchema).default([]),
      routine_templates: z.array(importEntityRecordSchema).default([]),
      routine_items: z.array(importEntityRecordSchema).default([]),
    })
    .default({ habits: [], occurrences: [], routine_templates: [], routine_items: [] }),
  weekly_reviews: z.array(importEntityRecordSchema).default([]),
});

export type ImportConflictStrategy = z.infer<typeof importConflictStrategySchema>;
export type ImportOptions = z.infer<typeof importOptionsSchema>;
export type UserAccountBackup = z.infer<typeof userAccountBackupSchema>;

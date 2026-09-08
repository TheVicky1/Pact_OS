import { z } from 'zod';

export const consequenceTypeSchema = z.enum([
  'personal_restriction',
  'extra_responsibility',
  'self_improvement',
  'reflection',
  'financial_declaration',
  'custom',
]);

export const verificationTypeSchema = z.enum([
  'timed_session',
  'task_completion',
  'written_reflection',
  'declaration',
  'custom',
]);

export const verificationConfigSchema = z
  .object({
    required_duration_seconds: z.number().int().min(0).max(86400).optional(),
    activity_prompt: z.string().trim().max(500).optional(),
  })
  .passthrough();

export const accountabilityModeSchema = z.enum(['default', 'explicit', 'none']);

export const consequenceSnapshotSchema = z.object({
  title: z.string().trim().min(1).max(255),
  consequence_type: consequenceTypeSchema,
  action_statement: z.string().trim().min(1).max(1000),
  description: z.string().trim().max(2000).nullable().optional(),
  verification_type: verificationTypeSchema.optional(),
  verification_config: verificationConfigSchema.optional(),
});

export const createConsequenceDefinitionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Consequence title is required.')
    .max(255, 'Consequence title must not exceed 255 characters.'),
  consequence_type: consequenceTypeSchema,
  action_statement: z
    .string()
    .trim()
    .min(1, 'Action statement is required.')
    .max(1000, 'Action statement must not exceed 1000 characters.'),
  description: z.string().trim().max(2000, 'Description must not exceed 2000 characters.').nullable().optional(),
  is_enabled: z.boolean().default(true),
  is_default: z.boolean().default(false),
  priority: z.number().int().min(0).max(10000).default(0),
  verification_type: verificationTypeSchema.default('declaration'),
  verification_config: verificationConfigSchema.default({}),
});

export const updateConsequenceDefinitionSchema = createConsequenceDefinitionSchema.partial();

export const updateUserAccountabilityPreferencesSchema = z.object({
  default_consequence_id: z.string().uuid('Invalid Consequence UUID format.').nullable().optional(),
  auto_apply_default: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
});

export const createTaskAccountabilitySchema = z.object({
  accountability_mode: accountabilityModeSchema.optional().default('default'),
  consequence_id: z.string().uuid('Invalid Consequence UUID format.').nullable().optional(),
});

export const commitmentStatusSchema = z.enum(['committed', 'activated', 'fulfilled', 'waived']);

export const accountabilityEventTypeSchema = z.enum(['activated', 'fulfilled', 'waived', 'resolved']);

export const accountabilitySessionStatusSchema = z.enum(['started', 'completed', 'cancelled', 'expired']);

export const startSessionSchema = z.object({
  commitment_id: z.string().uuid('Invalid commitment UUID format.'),
});

export const fulfillSessionSchema = z.object({
  session_id: z.string().uuid('Invalid session UUID format.'),
  evidence_note: z.string().trim().max(5000, 'Evidence note must not exceed 5000 characters.').optional(),
});

export const cancelSessionSchema = z.object({
  session_id: z.string().uuid('Invalid session UUID format.'),
});

export const waiveCommitmentSchema = z.object({
  commitment_id: z.string().uuid('Invalid commitment UUID format.'),
  confirmation_token: z.string().trim().min(1, 'Confirmation token is required.'),
});




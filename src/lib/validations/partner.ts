/**
 * PACT Phase 7: Cryptographic Accountability Partner Verification Validation Schemas
 * Defines strict Zod contracts for partner verification link creation,
 * token generation, public review lookups, and partner attestation submissions.
 */

import { z } from 'zod';

export const partnerDecisionSchema = z.enum(['approve', 'reject', 'request_clarification']);

export const generatePartnerTokenSchema = z.object({
  commitment_id: z.string().uuid('Invalid commitment UUID format.'),
  expires_in_days: z.number().int().min(1).max(30).default(7),
  partner_name: z.string().trim().min(1, 'Partner name is required.').max(100, 'Partner name must not exceed 100 characters.').optional(),
  partner_email: z.string().trim().email('Invalid partner email format.').optional(),
  custom_instructions: z.string().trim().max(1000, 'Custom instructions must not exceed 1000 characters.').optional(),
});

export const submitPartnerReviewSchema = z.object({
  token: z.string().trim().min(32, 'Invalid partner token format.').max(128, 'Invalid partner token format.'),
  decision: partnerDecisionSchema,
  partner_name: z.string().trim().min(1, 'Partner name is required.').max(100, 'Partner name must not exceed 100 characters.'),
  attestation_note: z
    .string()
    .trim()
    .min(5, 'Attestation note must be at least 5 characters.')
    .max(3000, 'Attestation note must not exceed 3000 characters.'),
});

export const verifyPartnerTokenLookupSchema = z.object({
  token: z.string().trim().min(32, 'Invalid partner token format.').max(128, 'Invalid partner token format.'),
});

export type PartnerDecision = z.infer<typeof partnerDecisionSchema>;
export type GeneratePartnerTokenInput = z.infer<typeof generatePartnerTokenSchema>;
export type SubmitPartnerReviewInput = z.infer<typeof submitPartnerReviewSchema>;
export type VerifyPartnerTokenLookupInput = z.infer<typeof verifyPartnerTokenLookupSchema>;

/**
 * PACT Phase 10: Charity Pledge / Forfeit Automation Validation Schemas
 * Strict Zod contracts for opt-in charity pledges, explicit user consent,
 * integer-cent monetary values, and state transition requests.
 */

import { z } from 'zod';

export const MIN_PLEDGE_CENTS = 100; // $1.00 USD
export const MAX_PLEDGE_CENTS = 1000000; // $10,000.00 USD

export const pledgeStatusSchema = z.enum([
  'draft',
  'authorized',
  'armed',
  'triggered',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
]);

/**
 * Supported certified charities list / registry contract
 */
export const VERIFIED_CHARITIES = [
  { id: 'charity_eff', name: 'Electronic Frontier Foundation', ein: '94-3121564' },
  { id: 'charity_givewell', name: 'GiveWell Top Charities Fund', ein: '20-8028795' },
  { id: 'charity_wikipedia', name: 'Wikimedia Foundation', ein: '20-0049703' },
  { id: 'charity_redcross', name: 'American Red Cross', ein: '53-0196605' },
  { id: 'charity_khan', name: 'Khan Academy', ein: '26-1544963' },
] as const;

/**
 * Create charity pledge schema
 */
export const createCharityPledgeSchema = z.object({
  commitment_id: z.string().uuid('Invalid commitment ID format.').optional(),
  circle_id: z.string().uuid('Invalid circle ID format.').optional(),
  charity_id: z.string().trim().min(2, 'Charity ID is required.').max(100),
  charity_name: z
    .string()
    .trim()
    .min(2, 'Charity name is required.')
    .max(100, 'Charity name must not exceed 100 characters.'),
  charity_ein: z.string().trim().max(50).optional(),
  amount_cents: z
    .number()
    .int('Amount must be an exact integer in cents.')
    .min(MIN_PLEDGE_CENTS, 'Minimum pledge amount is $1.00 (100 cents).')
    .max(MAX_PLEDGE_CENTS, 'Maximum pledge amount is $10,000.00 (1,000,000 cents).'),
  currency: z.string().default('USD').optional(),
  explicit_consent: z.literal(true),
  consequence_description: z.string().max(500).optional(),
});

/**
 * Authorize charity pledge schema (requires explicit consent confirmation)
 */
export const authorizeCharityPledgeSchema = z.object({
  pledge_id: z.string().uuid('Invalid pledge ID format.'),
});

export const authorizePledgeSchema = authorizeCharityPledgeSchema;

/**
 * Cancel charity pledge schema
 */
export const cancelCharityPledgeSchema = z.object({
  pledge_id: z.string().uuid('Invalid pledge ID format.'),
  reason: z
    .string()
    .trim()
    .min(3, 'Cancellation reason must be at least 3 characters.')
    .max(500, 'Cancellation reason must not exceed 500 characters.')
    .optional(),
});

export const cancelPledgeSchema = cancelCharityPledgeSchema;

/**
 * Webhook event payload schema
 */
export const pledgeWebhookPayloadSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.enum(['pledge.charged', 'pledge.failed', 'pledge.refunded']),
  pledge_id: z.string().uuid(),
  idempotency_key: z.string().min(1),
  amount_cents: z.number().int().positive(),
  signature: z.string().min(16),
  timestamp: z.number().int(),
});

export type PledgeStatus = z.infer<typeof pledgeStatusSchema>;
export type CreateCharityPledgeInput = z.infer<typeof createCharityPledgeSchema>;
export type AuthorizeCharityPledgeInput = z.infer<typeof authorizeCharityPledgeSchema>;
export type CancelCharityPledgeInput = z.infer<typeof cancelCharityPledgeSchema>;
export type PledgeWebhookPayload = z.infer<typeof pledgeWebhookPayloadSchema>;

export interface CharityPledge {
  id: string;
  user_id: string;
  commitment_id?: string | null;
  circle_id?: string | null;
  charity_id: string;
  charity_name: string;
  charity_ein?: string | null;
  amount_cents: number;
  currency: string;
  status: PledgeStatus;
  explicit_consent: boolean;
  consent_timestamp?: string | null;
  idempotency_key: string;
  consequence_description?: string | null;
  payment_gateway_ref?: string | null;
  settlement_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

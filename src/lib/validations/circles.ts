/**
 * PACT Phase 10: Multi-Party Accountability Circles Validation Schemas
 * Strict Zod contracts for circle creation, membership roles, invitations,
 * shared commitments, and peer social attestations.
 */

import { z } from 'zod';

export const circleRoleSchema = z.enum(['owner', 'member', 'accountability_partner', 'observer']);
export const circleMemberStatusSchema = z.enum(['active', 'inactive', 'removed']);
export const circleInvitationStatusSchema = z.enum(['pending', 'accepted', 'declined', 'expired', 'revoked']);
export const circleAttestationDecisionSchema = z.enum(['verified', 'failed', 'disputed']);

/**
 * Circle creation schema
 */
export const createCircleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Circle name must be at least 2 characters.')
    .max(80, 'Circle name must not exceed 80 characters.'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters.')
    .optional(),
  require_unanimous_verdict: z.boolean().default(false).optional(),
});

/**
 * Circle update schema
 */
export const updateCircleSchema = z.object({
  circle_id: z.string().uuid('Invalid circle ID format.'),
  name: z
    .string()
    .trim()
    .min(2, 'Circle name must be at least 2 characters.')
    .max(80, 'Circle name must not exceed 80 characters.')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters.')
    .optional(),
  require_unanimous_verdict: z.boolean().optional(),
});

/**
 * Circle invitation request schema
 */
export const createCircleInvitationSchema = z.object({
  circle_id: z.string().uuid('Invalid circle ID format.'),
  invitee_email: z.string().trim().email('Invalid invitee email address.').optional(),
  role: circleRoleSchema.exclude(['owner']).default('accountability_partner'),
  expires_in_days: z.number().int().min(1).max(30).default(7).optional(),
});

export const inviteCircleMemberSchema = createCircleInvitationSchema;

/**
 * Respond to circle invitation schema
 */
export const acceptCircleInvitationSchema = z.object({
  token: z.string().trim().min(32, 'Invalid invitation token format.').max(128),
});

export const respondCircleInvitationSchema = z.object({
  token: z.string().trim().min(32, 'Invalid invitation token format.').max(128),
  decision: z.enum(['accept', 'decline']),
});

/**
 * Remove circle member schema
 */
export const removeCircleMemberSchema = z.object({
  circle_id: z.string().uuid('Invalid circle ID format.'),
  member_user_id: z.string().uuid('Invalid member user ID format.'),
});

/**
 * Share commitment with circle schema
 */
export const shareCommitmentToCircleSchema = z.object({
  circle_id: z.string().uuid('Invalid circle ID format.'),
  commitment_id: z.string().uuid('Invalid commitment ID format.'),
  masked_consequence: z.string().max(200).optional(),
});

export const shareCommitmentWithCircleSchema = shareCommitmentToCircleSchema;

/**
 * Submit peer attestation schema
 */
export const peerAttestationSchema = z.object({
  shared_commitment_id: z.string().uuid('Invalid shared commitment ID format.'),
  verdict: circleAttestationDecisionSchema,
  attestation_notes: z
    .string()
    .trim()
    .max(2000, 'Attestation notes must not exceed 2000 characters.')
    .optional(),
});

export const submitCircleAttestationSchema = peerAttestationSchema;

export type CircleRole = z.infer<typeof circleRoleSchema>;
export type CircleMemberStatus = z.infer<typeof circleMemberStatusSchema>;
export type CircleInvitationStatus = z.infer<typeof circleInvitationStatusSchema>;
export type CircleAttestationDecision = z.infer<typeof circleAttestationDecisionSchema>;

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type CreateCircleInvitationInput = z.infer<typeof createCircleInvitationSchema>;
export type InviteCircleMemberInput = CreateCircleInvitationInput;
export type AcceptCircleInvitationInput = z.infer<typeof acceptCircleInvitationSchema>;
export type RespondCircleInvitationInput = z.infer<typeof respondCircleInvitationSchema>;
export type RemoveCircleMemberInput = z.infer<typeof removeCircleMemberSchema>;
export type ShareCommitmentToCircleInput = z.infer<typeof shareCommitmentToCircleSchema>;
export type ShareCommitmentWithCircleInput = ShareCommitmentToCircleInput;
export type PeerAttestationInput = z.infer<typeof peerAttestationSchema>;
export type SubmitCircleAttestationInput = PeerAttestationInput;

export interface AccountabilityCircle {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  require_unanimous_verdict: boolean;
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: CircleRole;
  created_at: string;
}

export interface CircleSharedCommitment {
  id: string;
  circle_id: string;
  commitment_id: string;
  user_id: string;
  masked_consequence: string;
  verification_status: 'pending' | 'verified' | 'failed' | 'disputed';
  created_at: string;
  updated_at: string;
}

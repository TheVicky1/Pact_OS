/**
 * PACT Phase 10: Multi-Party Accountability Circles Pure Domain Logic
 * Implements role-based permissions, cryptographic invitation token hashing,
 * peer attestation consensus evaluation, and strict consequence confidentiality.
 */

import { createHash, randomBytes } from 'node:crypto';
import {
  CircleRole,
  CircleInvitationStatus,
} from '../validations/circles';

export interface CirclePermissions {
  canInvite: boolean;
  canRemoveMembers: boolean;
  canShareCommitments: boolean;
  canAttest: boolean;
  canInspectProof: boolean;
  canDeleteCircle: boolean;
}

export interface CircleInvitationRecord {
  id: string;
  circleId: string;
  inviterId: string;
  inviteeEmail?: string | null;
  tokenHash: string;
  role: CircleRole;
  status: CircleInvitationStatus;
  expiresAt: string; // ISO UTC
  createdAt: string;
  acceptedAt?: string | null;
}

/**
 * Pure function: Determines if a role can manage circle settings and members.
 */
export function canRoleManageCircle(role: CircleRole): boolean {
  return role === 'owner';
}

/**
 * Pure function: Determines if a role can submit peer attestations.
 */
export function canRoleAttest(role: CircleRole): boolean {
  return role === 'owner' || role === 'accountability_partner';
}

/**
 * Pure function: Determines if a role can view masked commitments.
 */
export function canRoleViewMaskedCommitment(role: CircleRole): boolean {
  return role === 'owner' || role === 'accountability_partner' || role === 'member' || role === 'observer';
}

/**
 * Pure function: Computes comprehensive role-based permissions for circle members.
 */
export function evaluateCirclePermissions(role: CircleRole): CirclePermissions {
  switch (role) {
    case 'owner':
      return {
        canInvite: true,
        canRemoveMembers: true,
        canShareCommitments: true,
        canAttest: true,
        canInspectProof: true,
        canDeleteCircle: true,
      };
    case 'accountability_partner':
      return {
        canInvite: true,
        canRemoveMembers: false,
        canShareCommitments: true,
        canAttest: true,
        canInspectProof: true,
        canDeleteCircle: false,
      };
    case 'member':
      return {
        canInvite: false,
        canRemoveMembers: false,
        canShareCommitments: true,
        canAttest: false,
        canInspectProof: true,
        canDeleteCircle: false,
      };
    case 'observer':
      return {
        canInvite: false,
        canRemoveMembers: false,
        canShareCommitments: false,
        canAttest: false,
        canInspectProof: false,
        canDeleteCircle: false,
      };
    default:
      return {
        canInvite: false,
        canRemoveMembers: false,
        canShareCommitments: false,
        canAttest: false,
        canInspectProof: false,
        canDeleteCircle: false,
      };
  }
}

/**
 * Computes deterministic SHA-256 hash of raw invitation token.
 */
export function hashCircleInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}

export const hashInvitationToken = hashCircleInvitationToken;

/**
 * Generates cryptographic invitation token and hash with expiration.
 */
export function generateInvitationToken(days = 7): {
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
} {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashCircleInvitationToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

/**
 * Generates a full circle invitation object.
 */
export function generateCircleInvitation(params: {
  circleId: string;
  inviterId: string;
  inviteeEmail?: string;
  role?: CircleRole;
  expiresInDays?: number;
}): {
  rawToken: string;
  invitation: CircleInvitationRecord;
  invitationUrl: string;
} {
  const { rawToken, tokenHash, expiresAt } = generateInvitationToken(params.expiresInDays || 7);

  const invitation: CircleInvitationRecord = {
    id: `cinv_${randomBytes(8).toString('hex')}`,
    circleId: params.circleId,
    inviterId: params.inviterId,
    inviteeEmail: params.inviteeEmail?.toLowerCase() || null,
    tokenHash,
    role: params.role || 'accountability_partner',
    status: 'pending',
    expiresAt,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pact-os.app';
  const invitationUrl = `${baseUrl}/app/accountability?circle_invite=${rawToken}`;

  return {
    rawToken,
    invitation,
    invitationUrl,
  };
}

/**
 * Mask consequence description for zero consequence leakage.
 */
export function maskConsequenceForCircle(rawConsequence?: string): string {
  // Always return confidential mask regardless of input consequence content
  return typeof rawConsequence === 'string'
    ? '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]'
    : '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]';
}

/**
 * Pure function: Evaluates attestation consensus given a list of verdicts.
 */
export function evaluateAttestationConsensus(
  attestations: { verdict?: string; decision?: string }[],
  requireUnanimous = false
): 'pending' | 'verified' | 'failed' | 'disputed' {
  if (!attestations || attestations.length === 0) {
    return 'pending';
  }

  const verdicts = attestations.map((a) => a.verdict || a.decision || 'pending');

  if (requireUnanimous) {
    if (verdicts.some((v) => v === 'failed' || v === 'rejected')) {
      return 'failed';
    }
    if (verdicts.every((v) => v === 'verified' || v === 'approved')) {
      return 'verified';
    }
    return 'disputed';
  }

  // Majority rule
  const verifiedCount = verdicts.filter((v) => v === 'verified' || v === 'approved').length;
  const failedCount = verdicts.filter((v) => v === 'failed' || v === 'rejected').length;

  if (verifiedCount > failedCount) {
    return 'verified';
  }
  if (failedCount > verifiedCount) {
    return 'failed';
  }
  return 'disputed';
}

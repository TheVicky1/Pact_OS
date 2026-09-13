/**
 * PACT Phase 7: Cryptographic Accountability Partner Verification Engine
 * Provides secure tokenized review links, zero consequence leakage,
 * independent partner proof evaluation, and auditable attestation state machines.
 */

import { createHash, randomBytes } from 'node:crypto';
import {
  PartnerDecision,
  GeneratePartnerTokenInput,
  SubmitPartnerReviewInput,
} from '../validations/partner';
import { ExternalProofEvidenceItem } from '@/types/domain';

export interface PartnerTokenMetadata {
  tokenId: string;
  commitmentId: string;
  tokenHash: string;
  createdAt: string; // ISO UTC
  expiresAt: string; // ISO UTC
  partnerName?: string;
  partnerEmail?: string;
  customInstructions?: string;
  isUsed: boolean;
  reviewedAt?: string;
  decision?: PartnerDecision;
  attestationNote?: string;
}

export interface PartnerReviewPublicView {
  commitmentId: string;
  taskTitle: string;
  taskDescription: string | null;
  deadlineAt: string;
  commitmentStatus: string;
  partnerName?: string;
  customInstructions?: string;
  proofEvidences: ExternalProofEvidenceItem[];
  consequenceSummary: string; // Strictly masked summary: "[CONFIDENTIAL CONSEQUENCE: Masked for partner review]"
  expiresAt: string;
  isExpired: boolean;
  isReviewed: boolean;
  decision?: PartnerDecision;
  reviewedAt?: string;
}

export interface PartnerReviewResult {
  success: boolean;
  code:
    | 'APPROVED'
    | 'REJECTED'
    | 'CLARIFICATION_REQUESTED'
    | 'TOKEN_EXPIRED'
    | 'ALREADY_REVIEWED'
    | 'INVALID_TOKEN'
    | 'ERROR';
  summary: string;
  decision?: PartnerDecision;
  partnerName?: string;
  attestationNote?: string;
  reviewedAt?: string;
  error?: string;
}

/**
 * Computes deterministic SHA-256 hash of a raw partner verification token.
 */
export function hashPartnerToken(rawToken: string): string {
  const cleanToken = rawToken.trim();
  return createHash('sha256').update(cleanToken).digest('hex');
}

/**
 * Generates a cryptographically secure partner verification token and metadata record.
 */
export function generatePartnerVerificationToken(
  input: GeneratePartnerTokenInput
): { rawToken: string; metadata: PartnerTokenMetadata; shareableUrl: string } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashPartnerToken(rawToken);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.expires_in_days * 24 * 60 * 60 * 1000);

  const metadata: PartnerTokenMetadata = {
    tokenId: `ptk_${randomBytes(8).toString('hex')}`,
    commitmentId: input.commitment_id,
    tokenHash,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    partnerName: input.partner_name,
    partnerEmail: input.partner_email,
    customInstructions: input.custom_instructions,
    isUsed: false,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pact-os.app';
  const shareableUrl = `${baseUrl}/app/accountability/partner?token=${rawToken}`;

  return {
    rawToken,
    metadata,
    shareableUrl,
  };
}

/**
 * Checks whether a partner token has expired.
 */
export function isPartnerTokenExpired(expiresAtIso: string, referenceTime?: Date): boolean {
  const refTime = referenceTime ? referenceTime.getTime() : Date.now();
  const expireTime = new Date(expiresAtIso).getTime();

  if (Number.isNaN(expireTime)) {
    return true;
  }

  return refTime > expireTime;
}

/**
 * Builds sanitized public review payload for external partner inspection.
 * Strictly masks internal consequence penalty statements and user credentials.
 */
export function buildPartnerPublicView(params: {
  commitmentId: string;
  taskTitle: string;
  taskDescription?: string | null;
  deadlineAt: string;
  commitmentStatus: string;
  proofEvidences?: ExternalProofEvidenceItem[];
  tokenMetadata: PartnerTokenMetadata;
  now?: Date;
}): PartnerReviewPublicView {
  const {
    commitmentId,
    taskTitle,
    taskDescription,
    deadlineAt,
    commitmentStatus,
    proofEvidences = [],
    tokenMetadata,
    now = new Date(),
  } = params;

  const expired = isPartnerTokenExpired(tokenMetadata.expiresAt, now);

  return {
    commitmentId,
    taskTitle,
    taskDescription: taskDescription || null,
    deadlineAt,
    commitmentStatus,
    partnerName: tokenMetadata.partnerName,
    customInstructions: tokenMetadata.customInstructions,
    proofEvidences,
    consequenceSummary: '[CONFIDENTIAL CONSEQUENCE: Masked for partner review]',
    expiresAt: tokenMetadata.expiresAt,
    isExpired: expired,
    isReviewed: tokenMetadata.isUsed,
    decision: tokenMetadata.decision,
    reviewedAt: tokenMetadata.reviewedAt,
  };
}

/**
 * Evaluates a partner's attestation submission deterministically.
 */
export function evaluatePartnerReview(
  input: SubmitPartnerReviewInput,
  storedToken: PartnerTokenMetadata,
  now = new Date()
): PartnerReviewResult {
  const providedHash = hashPartnerToken(input.token);

  if (providedHash !== storedToken.tokenHash) {
    return {
      success: false,
      code: 'INVALID_TOKEN',
      summary: 'Partner token hash does not match stored authorization record.',
      error: 'Invalid or revoked verification token.',
    };
  }

  if (storedToken.isUsed) {
    return {
      success: false,
      code: 'ALREADY_REVIEWED',
      summary: `This commitment was already reviewed on ${storedToken.reviewedAt} with decision "${storedToken.decision}".`,
      decision: storedToken.decision,
      partnerName: storedToken.partnerName,
      reviewedAt: storedToken.reviewedAt,
      attestationNote: storedToken.attestationNote,
    };
  }

  if (isPartnerTokenExpired(storedToken.expiresAt, now)) {
    return {
      success: false,
      code: 'TOKEN_EXPIRED',
      summary: `Verification token expired on ${storedToken.expiresAt}.`,
      error: 'This partner review link has expired.',
    };
  }

  const reviewedAt = now.toISOString();

  let code: 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUESTED';
  let summary: string;

  switch (input.decision) {
    case 'approve':
      code = 'APPROVED';
      summary = `Partner "${input.partner_name}" verified and approved commitment completion.`;
      break;
    case 'reject':
      code = 'REJECTED';
      summary = `Partner "${input.partner_name}" reviewed evidence and rejected commitment completion.`;
      break;
    case 'request_clarification':
      code = 'CLARIFICATION_REQUESTED';
      summary = `Partner "${input.partner_name}" requested further evidence or clarification.`;
      break;
    default:
      code = 'REJECTED';
      summary = 'Unknown partner decision received.';
  }

  return {
    success: true,
    code,
    summary,
    decision: input.decision,
    partnerName: input.partner_name,
    attestationNote: input.attestation_note,
    reviewedAt,
  };
}

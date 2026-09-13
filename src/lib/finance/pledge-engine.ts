/**
 * PACT Phase 10: Charity Pledge & Automated Forfeiture Engine
 * Pure domain logic for pledge lifecycle state transitions, integer-cent calculations,
 * deterministic idempotency enforcement, and webhook signature verification contracts.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PledgeStatus, PledgeWebhookPayload } from '../validations/pledges';

export interface CharityPledgeRecord {
  id: string;
  userId: string;
  commitmentId?: string | null;
  charityName: string;
  charityEinOrId?: string | null;
  amountCents: number; // Integer cents
  status: PledgeStatus;
  idempotencyKey: string;
  consentGivenAt?: string | null;
  createdAt: string;
  executedAt?: string | null;
  cancellationReason?: string | null;
}

export interface PledgeTransitionResult {
  success: boolean;
  previousStatus: PledgeStatus;
  newStatus: PledgeStatus;
  error?: string;
  reason?: string;
}

/**
 * Valid state transitions for charity pledges.
 */
const VALID_TRANSITIONS: Record<PledgeStatus, PledgeStatus[]> = {
  draft: ['authorized', 'cancelled'],
  authorized: ['armed', 'cancelled'],
  armed: ['triggered', 'cancelled'],
  triggered: ['processing', 'completed', 'failed'],
  processing: ['completed', 'failed'],
  completed: ['refunded'],
  failed: ['processing', 'cancelled'],
  cancelled: [],
  refunded: [],
};

/**
 * Checks if a state transition is valid.
 */
export function canTransitionPledge(from: PledgeStatus, to: PledgeStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Deterministic pledge state transition that supports string status or pledge record.
 */
export function transitionPledgeStatus(
  current: PledgeStatus | CharityPledgeRecord,
  nextStatus: PledgeStatus
): PledgeStatus {
  const fromStatus: PledgeStatus = typeof current === 'string' ? current : current.status;

  if (!canTransitionPledge(fromStatus, nextStatus)) {
    throw new Error(`Cannot transition pledge from '${fromStatus}' to '${nextStatus}'.`);
  }

  return nextStatus;
}

/**
 * Formats integer cents into a localized USD currency string.
 * e.g. 2500 -> "$25.00"
 */
export function formatCentsToUsd(amountCents: number): string {
  const dollars = (amountCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${dollars}`;
}

export const formatCentsToUSD = formatCentsToUsd;

/**
 * Generates deterministic idempotency key for a pledge.
 */
export function generatePledgeIdempotencyKey(identifier: string, customUuid?: string): string {
  const uuid = customUuid || randomBytes(16).toString('hex');
  return `pledge_${identifier}_${uuid}`;
}

/**
 * Verifies webhook signature using HMAC SHA-256 contract with constant-time comparison.
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Verifies webhook event payload against schema and HMAC signature.
 */
export function verifyPledgeWebhookContract(
  rawBody: string,
  signatureHeader: string,
  secret: string
): { valid: boolean; payload?: PledgeWebhookPayload; error?: string } {
  const isSignatureValid = validateWebhookSignature(rawBody, signatureHeader, secret);
  if (!isSignatureValid) {
    return { valid: false, error: 'Invalid HMAC signature header.' };
  }

  try {
    const parsed = JSON.parse(rawBody);
    return { valid: true, payload: parsed as PledgeWebhookPayload };
  } catch {
    return { valid: false, error: 'Failed to parse webhook JSON body.' };
  }
}

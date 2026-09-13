/**
 * PACT Phase 7: Cryptographic Accountability Partner Verification Test Suite
 * Validates token generation, SHA-256 hashing, expiration rules, consequence masking,
 * and attestation state evaluations.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePartnerVerificationToken,
  hashPartnerToken,
  isPartnerTokenExpired,
  buildPartnerPublicView,
  evaluatePartnerReview,
  PartnerTokenMetadata,
} from '../src/lib/accountability/partner';

import {
  generatePartnerTokenSchema,
  submitPartnerReviewSchema,
} from '../src/lib/validations/partner';

describe('PACT Phase 7: Cryptographic Accountability Partner Verification', () => {
  describe('Token Generation & Hashing', () => {
    it('generates secure random tokens with valid SHA-256 hash and metadata', () => {
      const result = generatePartnerVerificationToken({
        commitment_id: 'a0000000-0000-0000-0000-000000000001',
        expires_in_days: 7,
        partner_name: 'Alex Developer',
        partner_email: 'alex@example.com',
        custom_instructions: 'Please check the GitHub PR link and verify test coverage.',
      });

      assert.ok(result.rawToken);
      assert.strictEqual(result.rawToken.length, 64);
      assert.strictEqual(result.metadata.tokenHash, hashPartnerToken(result.rawToken));
      assert.strictEqual(result.metadata.partnerName, 'Alex Developer');
      assert.strictEqual(result.metadata.isUsed, false);
      assert.ok(result.shareableUrl.includes(result.rawToken));
    });

    it('computes deterministic SHA-256 hashes', () => {
      const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const hash1 = hashPartnerToken(token);
      const hash2 = hashPartnerToken(token);
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64);
    });
  });

  describe('Expiration Calculation', () => {
    it('correctly identifies expired vs active tokens', () => {
      const now = new Date('2026-09-13T12:00:00Z');
      const pastExpire = '2026-09-12T12:00:00Z';
      const futureExpire = '2026-09-15T12:00:00Z';

      assert.strictEqual(isPartnerTokenExpired(pastExpire, now), true);
      assert.strictEqual(isPartnerTokenExpired(futureExpire, now), false);
      assert.strictEqual(isPartnerTokenExpired('invalid-date', now), true);
    });
  });

  describe('Privacy & Consequence Masking', () => {
    it('masks internal consequence penalty statements from partner view', () => {
      const meta: PartnerTokenMetadata = {
        tokenId: 'ptk_123',
        commitmentId: 'a0000000-0000-0000-0000-000000000001',
        tokenHash: 'somehash',
        createdAt: '2026-09-13T00:00:00Z',
        expiresAt: '2026-09-20T00:00:00Z',
        partnerName: 'Jordan',
        isUsed: false,
      };

      const publicView = buildPartnerPublicView({
        commitmentId: meta.commitmentId,
        taskTitle: 'Ship Phase 7 Architecture',
        taskDescription: 'Consolidate proof connectors and data restoration engine.',
        deadlineAt: '2026-09-13T23:59:59Z',
        commitmentStatus: 'committed',
        proofEvidences: [
          {
            external_event_id: 'pr_123',
            event_timestamp: '2026-09-13T10:00:00Z',
            evidence_type: 'pr',
            summary: 'PR #123 merged',
          },
        ],
        tokenMetadata: meta,
      });

      assert.strictEqual(publicView.taskTitle, 'Ship Phase 7 Architecture');
      assert.strictEqual(publicView.proofEvidences.length, 1);
      assert.strictEqual(
        publicView.consequenceSummary,
        '[CONFIDENTIAL CONSEQUENCE: Masked for partner review]'
      );
      assert.strictEqual(publicView.isExpired, false);
      assert.strictEqual(publicView.isReviewed, false);
    });
  });

  describe('Attestation Decision Evaluation', () => {
    const rawToken = '1111222233334444555566667777888811112222333344445555666677778888';
    const tokenHash = hashPartnerToken(rawToken);

    const validMeta: PartnerTokenMetadata = {
      tokenId: 'ptk_test',
      commitmentId: 'a0000000-0000-0000-0000-000000000001',
      tokenHash,
      createdAt: '2026-09-13T00:00:00Z',
      expiresAt: '2026-09-20T00:00:00Z',
      partnerName: 'Morgan',
      isUsed: false,
    };

    it('successfully processes an approval decision', () => {
      const result = evaluatePartnerReview(
        {
          token: rawToken,
          decision: 'approve',
          partner_name: 'Morgan',
          attestation_note: 'Verified pull request and test results. Excellent execution.',
        },
        validMeta
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.code, 'APPROVED');
      assert.strictEqual(result.decision, 'approve');
      assert.strictEqual(result.partnerName, 'Morgan');
      assert.ok(result.summary.includes('verified and approved'));
    });

    it('successfully processes a rejection decision', () => {
      const result = evaluatePartnerReview(
        {
          token: rawToken,
          decision: 'reject',
          partner_name: 'Morgan',
          attestation_note: 'Proof was incomplete, tests were missing.',
        },
        validMeta
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.code, 'REJECTED');
      assert.strictEqual(result.decision, 'reject');
    });

    it('rejects invalid or mismatched token', () => {
      const result = evaluatePartnerReview(
        {
          token: 'different_token_with_valid_length_abcdef1234567890abcdef1234567890',
          decision: 'approve',
          partner_name: 'Morgan',
          attestation_note: 'Looks great to me.',
        },
        validMeta
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_TOKEN');
    });

    it('prevents multiple reviews on already used token', () => {
      const usedMeta: PartnerTokenMetadata = {
        ...validMeta,
        isUsed: true,
        reviewedAt: '2026-09-13T10:00:00Z',
        decision: 'approve',
      };

      const result = evaluatePartnerReview(
        {
          token: rawToken,
          decision: 'approve',
          partner_name: 'Morgan',
          attestation_note: 'Attempting duplicate review.',
        },
        usedMeta
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'ALREADY_REVIEWED');
    });

    it('rejects review on expired token', () => {
      const expiredMeta: PartnerTokenMetadata = {
        ...validMeta,
        expiresAt: '2026-09-10T00:00:00Z',
      };

      const result = evaluatePartnerReview(
        {
          token: rawToken,
          decision: 'approve',
          partner_name: 'Morgan',
          attestation_note: 'Reviewed after deadline.',
        },
        expiredMeta,
        new Date('2026-09-13T12:00:00Z')
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'TOKEN_EXPIRED');
    });
  });

  describe('Validation Schemas', () => {
    it('validates generatePartnerTokenSchema with defaults', () => {
      const parsed = generatePartnerTokenSchema.parse({
        commitment_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      assert.strictEqual(parsed.expires_in_days, 7);
    });

    it('rejects invalid email or empty attestation note in submitPartnerReviewSchema', () => {
      assert.throws(() => {
        submitPartnerReviewSchema.parse({
          token: '123', // too short
          decision: 'approve',
          partner_name: 'A',
          attestation_note: 'hi', // too short (<5 chars)
        });
      });
    });
  });
});

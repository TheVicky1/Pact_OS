import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  canRoleAttest,
  canRoleManageCircle,
  canRoleViewMaskedCommitment,
  generateInvitationToken,
  hashInvitationToken,
  maskConsequenceForCircle,
  evaluateAttestationConsensus,
} from '../src/lib/accountability/circles';
import {
  createCircleSchema,
  createCircleInvitationSchema,
  acceptCircleInvitationSchema,
  shareCommitmentToCircleSchema,
  peerAttestationSchema,
} from '../src/lib/validations/circles';

test('Phase 10 — Multi-Party Accountability Circles & Social Verification', async (t) => {
  await t.test('Role permission matrices are strictly enforced', () => {
    // Owners
    assert.equal(canRoleManageCircle('owner'), true);
    assert.equal(canRoleAttest('owner'), true);
    assert.equal(canRoleViewMaskedCommitment('owner'), true);

    // Accountability Partners
    assert.equal(canRoleManageCircle('accountability_partner'), false);
    assert.equal(canRoleAttest('accountability_partner'), true);
    assert.equal(canRoleViewMaskedCommitment('accountability_partner'), true);

    // Members
    assert.equal(canRoleManageCircle('member'), false);
    assert.equal(canRoleAttest('member'), false);
    assert.equal(canRoleViewMaskedCommitment('member'), true);

    // Observers
    assert.equal(canRoleManageCircle('observer'), false);
    assert.equal(canRoleAttest('observer'), false);
    assert.equal(canRoleViewMaskedCommitment('observer'), true);
  });

  await t.test('Zero Consequence Leakage — Private consequences are masked deterministically', () => {
    const rawConsequence = 'Lose $500 penalty and transfer funds to accountability escrow';
    const masked = maskConsequenceForCircle(rawConsequence);
    assert.equal(masked, '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]');

    // Empty/undefined consequence should handle gracefully
    assert.equal(maskConsequenceForCircle(''), '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]');
    assert.equal(maskConsequenceForCircle(undefined as unknown as string), '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]');
  });

  await t.test('Cryptographic invitation tokens generate and hash with SHA-256', () => {
    const { rawToken, tokenHash, expiresAt } = generateInvitationToken(7);
    assert.equal(rawToken.length, 64); // 32 bytes hex = 64 characters
    assert.equal(tokenHash.length, 64); // SHA-256 hex = 64 characters
    assert.notEqual(rawToken, tokenHash);

    // Verify hash reproduces deterministically
    const recomputedHash = hashInvitationToken(rawToken);
    assert.equal(recomputedHash, tokenHash);

    // Expiry is in the future
    const expDate = new Date(expiresAt);
    assert.ok(expDate.getTime() > Date.now());
  });

  await t.test('Zod schemas validate circle creation, invitation, and attestation inputs', () => {
    // Valid circle
    const validCircle = createCircleSchema.safeParse({
      name: 'Engineering Mastermind',
      description: 'Weekly accountability circle',
      require_unanimous_verdict: true,
    });
    assert.equal(validCircle.success, true);

    // Invalid circle name
    const invalidCircle = createCircleSchema.safeParse({
      name: '  ',
    });
    assert.equal(invalidCircle.success, false);

    // Invitation validation
    const validInvite = createCircleInvitationSchema.safeParse({
      circle_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      role: 'accountability_partner',
      invitee_email: 'peer@pact.org',
    });
    assert.equal(validInvite.success, true);

    // Invitation acceptance
    const validAccept = acceptCircleInvitationSchema.safeParse({
      token: crypto.randomBytes(32).toString('hex'),
    });
    assert.equal(validAccept.success, true);

    // Shared commitment
    const validShare = shareCommitmentToCircleSchema.safeParse({
      circle_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      commitment_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      masked_consequence: 'Masked commitment test',
    });
    assert.equal(validShare.success, true);

    // Attestation
    const validAttest = peerAttestationSchema.safeParse({
      shared_commitment_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      verdict: 'verified',
      attestation_notes: 'Reviewed git pull request and certified completed',
    });
    assert.equal(validAttest.success, true);
  });

  await t.test('Consensus evaluation computes unanimous and majority verdicts accurately', () => {
    // Majority consensus (default: requireUnanimous = false)
    const majorityVerified = evaluateAttestationConsensus([
      { verdict: 'verified' },
      { verdict: 'verified' },
      { verdict: 'failed' },
    ], false);
    assert.equal(majorityVerified, 'verified');

    const majorityFailed = evaluateAttestationConsensus([
      { verdict: 'failed' },
      { verdict: 'failed' },
      { verdict: 'verified' },
    ], false);
    assert.equal(majorityFailed, 'failed');

    // Unanimous consensus (requireUnanimous = true)
    const unanimousPass = evaluateAttestationConsensus([
      { verdict: 'verified' },
      { verdict: 'verified' },
      { verdict: 'verified' },
    ], true);
    assert.equal(unanimousPass, 'verified');

    const unanimousBlocked = evaluateAttestationConsensus([
      { verdict: 'verified' },
      { verdict: 'verified' },
      { verdict: 'failed' },
    ], true);
    assert.equal(unanimousBlocked, 'failed');

    // Empty attestations
    const emptyVerdict = evaluateAttestationConsensus([], false);
    assert.equal(emptyVerdict, 'pending');
  });
});

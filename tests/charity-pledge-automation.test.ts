import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePledgeIdempotencyKey,
  transitionPledgeStatus,
  formatCentsToUSD,
  validateWebhookSignature,
} from '../src/lib/finance/pledge-engine';
import {
  createCharityPledgeSchema,
  cancelPledgeSchema,
  authorizePledgeSchema,
  MIN_PLEDGE_CENTS,
  MAX_PLEDGE_CENTS,
} from '../src/lib/validations/pledges';

test('Phase 10 — Charity Pledge Automation & Webhook Integration Contracts', async (t) => {
  await t.test('Financial safety — Integer cents formatting and boundary constraints', () => {
    assert.equal(MIN_PLEDGE_CENTS, 100); // $1.00 USD
    assert.equal(MAX_PLEDGE_CENTS, 1000000); // $10,000.00 USD

    assert.equal(formatCentsToUSD(100), '$1.00');
    assert.equal(formatCentsToUSD(2550), '$25.50');
    assert.equal(formatCentsToUSD(1000000), '$10,000.00');

    // Schema rejects fractional numbers or sub-dollar amounts
    const tooLow = createCharityPledgeSchema.safeParse({
      charity_id: 'givewell-max-impact',
      charity_name: 'GiveWell Top Charities',
      amount_cents: 50, // 50 cents < 100 min
      explicit_consent: true,
    });
    assert.equal(tooLow.success, false);

    const tooHigh = createCharityPledgeSchema.safeParse({
      charity_id: 'givewell-max-impact',
      charity_name: 'GiveWell Top Charities',
      amount_cents: 1000001, // > 10,000 USD
      explicit_consent: true,
    });
    assert.equal(tooHigh.success, false);

    const validPledge = createCharityPledgeSchema.safeParse({
      charity_id: 'givewell-max-impact',
      charity_name: 'GiveWell Top Charities',
      amount_cents: 2500, // $25.00
      explicit_consent: true,
    });
    assert.equal(validPledge.success, true);
  });

  await t.test('Explicit Consent requirement is strictly enforced', () => {
    const missingConsent = createCharityPledgeSchema.safeParse({
      charity_id: 'khan-academy',
      charity_name: 'Khan Academy',
      amount_cents: 1500,
      explicit_consent: false,
    });
    assert.equal(missingConsent.success, false);
  });

  await t.test('Pledge state machine transitions follow rigorous lifecycle rules', () => {
    // Draft -> Authorized -> Armed -> Triggered -> Processing -> Completed
    let status = transitionPledgeStatus('draft', 'authorized');
    assert.equal(status, 'authorized');

    status = transitionPledgeStatus(status, 'armed');
    assert.equal(status, 'armed');

    status = transitionPledgeStatus(status, 'triggered');
    assert.equal(status, 'triggered');

    status = transitionPledgeStatus(status, 'processing');
    assert.equal(status, 'processing');

    status = transitionPledgeStatus(status, 'completed');
    assert.equal(status, 'completed');

    // Terminal states cannot transition to illegal states
    assert.throws(() => {
      transitionPledgeStatus('completed', 'cancelled');
    }, /Cannot transition pledge/);

    assert.throws(() => {
      transitionPledgeStatus('failed', 'armed');
    }, /Cannot transition pledge/);

    // Cancellation permitted from draft, authorized, or armed
    assert.equal(transitionPledgeStatus('draft', 'cancelled'), 'cancelled');
    assert.equal(transitionPledgeStatus('authorized', 'cancelled'), 'cancelled');
    assert.equal(transitionPledgeStatus('armed', 'cancelled'), 'cancelled');
  });

  await t.test('Idempotency keys are deterministically generated with user ID prefix', () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    const key1 = generatePledgeIdempotencyKey(userId);
    const key2 = generatePledgeIdempotencyKey(userId);

    assert.ok(key1.startsWith(`pledge_${userId}_`));
    assert.ok(key2.startsWith(`pledge_${userId}_`));
    assert.notEqual(key1, key2);
  });

  await t.test('Webhook HMAC SHA-256 signature verification validates authentic payloads', () => {
    const secret = 'webhook_test_secret_key_12345';
    const payload = JSON.stringify({
      event: 'payment_intent.succeeded',
      pledge_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      amount_cents: 2500,
      timestamp: '2026-09-14T00:00:00Z',
    });

    const validSignature = require('node:crypto')
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Authentic signature passes
    assert.equal(validateWebhookSignature(payload, validSignature, secret), true);

    // Tampered payload fails
    const tamperedPayload = JSON.stringify({
      event: 'payment_intent.succeeded',
      pledge_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      amount_cents: 9999, // tampered amount
      timestamp: '2026-09-14T00:00:00Z',
    });
    assert.equal(validateWebhookSignature(tamperedPayload, validSignature, secret), false);

    // Tampered signature fails
    assert.equal(validateWebhookSignature(payload, 'invalid_signature_hex_digest', secret), false);
  });
});

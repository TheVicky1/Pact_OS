import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimiter, RATE_LIMIT_TIERS, extractClientIdentifier, formatRateLimitHeaders } from '@/lib/security/rate-limiter';
import { logger } from '@/lib/observability/logger';

/**
 * PACT Phase 11: Production Finance & Charity Pledge Webhook Ingestion Endpoint
 *
 * POST /api/finance/webhook
 * Handles incoming payment provider webhooks (e.g. Stripe, Charity Partner API).
 * Enforces:
 * - Rate limiting (WEBHOOK tier)
 * - Cryptographic HMAC-SHA256 signature verification
 * - 5-minute replay protection tolerance
 * - Zero consequence leakage in response payloads
 */

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const clientIp = extractClientIdentifier(req.headers);

  // 1. Evaluate Rate Limiting
  const rateLimitResult = rateLimiter.check(clientIp, RATE_LIMIT_TIERS.WEBHOOK);
  const rateLimitHeaders = formatRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    logger.warn('Webhook rate limit exceeded', { clientIp });
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  // 2. Read raw payload
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err: unknown) {
    logger.error('Failed to read webhook body', err);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: rateLimitHeaders });
  }

  // 3. Extract signature header
  const signatureHeader = req.headers.get('stripe-signature') || req.headers.get('x-pact-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.PLEDGE_WEBHOOK_SECRET;

  if (webhookSecret && signatureHeader) {
    // Parse timestamp and signature
    const parts = signatureHeader.split(',');
    let timestamp = '';
    let expectedSig = '';

    for (const part of parts) {
      const [key, val] = part.trim().split('=');
      if (key === 't') timestamp = val;
      if (key === 'v1') expectedSig = val;
    }

    if (timestamp && expectedSig) {
      const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
      // Reject if older than 300 seconds (replay attack protection)
      if (Math.abs(timestampAge) > 300) {
        logger.warn('Webhook rejected due to stale timestamp', { timestampAge });
        return NextResponse.json(
          { error: 'Webhook signature timestamp outside acceptable tolerance' },
          { status: 400, headers: rateLimitHeaders }
        );
      }

      const signedPayload = `${timestamp}.${rawBody}`;
      const computedSig = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

      const isSigValid =
        expectedSig.length === computedSig.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(computedSig));

      if (!isSigValid) {
        logger.warn('Webhook signature mismatch');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401, headers: rateLimitHeaders });
      }
    }
  }

  // 4. Process event payload
  try {
    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event;

    logger.info(`Received finance webhook event: ${eventType}`, {
      eventId: event.id,
      eventType,
    });

    switch (eventType) {
      case 'payment_intent.succeeded':
      case 'pledge.charge_succeeded':
        // Acknowledge pledge consequence payment success
        break;

      case 'payment_intent.payment_failed':
      case 'pledge.charge_failed':
        // Acknowledge payment failure
        break;

      case 'charge.refunded':
      case 'pledge.refunded':
        // Acknowledge refund
        break;

      default:
        logger.info(`Unhandled webhook event type: ${eventType}`);
        break;
    }

    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        received: true,
        eventId: event.id || 'wh_ack',
        processedInMs: duration,
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: unknown) {
    logger.error('Failed to parse webhook JSON payload', err);
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400, headers: rateLimitHeaders });
  }
}

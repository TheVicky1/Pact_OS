import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimiter, RATE_LIMIT_TIERS, extractClientIdentifier, formatRateLimitHeaders } from '@/lib/security/rate-limiter';
import { notificationDispatcher } from '@/lib/notifications/notification-dispatcher';
import { logger } from '@/lib/observability/logger';

/**
 * PACT Phase 11: Notification Dispatch Background Worker Endpoint
 *
 * POST /api/notifications/dispatch
 * Invoked periodically or triggered on event to process pending asynchronous notifications.
 * Protected by CRON_SECRET timing-safe authorization.
 */

export async function POST(req: NextRequest) {
  const clientIp = extractClientIdentifier(req.headers);

  // 1. Evaluate Rate Limiting
  const rateLimitResult = rateLimiter.check(clientIp, RATE_LIMIT_TIERS.CRON);
  const rateLimitHeaders = formatRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  // 2. Authorize via CRON_SECRET if configured
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    const isValid =
      authHeader.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));

    if (!isValid) {
      logger.warn('Unauthorized notification dispatch attempt', { clientIp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimitHeaders });
    }
  }

  // 3. Process dispatch queue
  try {
    const statsBefore = notificationDispatcher.getQueueStats();

    const batchResult = await notificationDispatcher.processBatch(async () => {
      // Mock delivery adapter for background worker pass
      return [
        {
          channel: 'in_app',
          success: true,
          isConfigured: true,
        },
      ];
    });

    const statsAfter = notificationDispatcher.getQueueStats();

    return NextResponse.json(
      {
        success: true,
        batch: batchResult,
        queue: {
          before: statsBefore,
          after: statsAfter,
        },
        timestamp: new Date().toISOString(),
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
    logger.error('Error during notification batch processing', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}

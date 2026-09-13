import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMIT_TIERS, extractClientIdentifier, formatRateLimitHeaders } from '@/lib/security/rate-limiter';
import { replicateDeltasAction } from '@/features/sync/sync-actions';
import { DeltaSyncBatchRequest } from '@/lib/offline/delta-engine';
import { logger } from '@/lib/observability/logger';

/**
 * PACT Phase 13: Multi-Device Delta Replication API Endpoint
 *
 * POST /api/sync/delta
 * Receives batches of client-generated deltas and returns remote deltas since client cursor.
 * Protected by Rate Limiting (API tier) and server-authoritative Supabase user session.
 */
export async function POST(req: NextRequest) {
  const clientIp = extractClientIdentifier(req.headers);

  // 1. Evaluate Rate Limiting
  const rateLimitResult = rateLimiter.check(clientIp, RATE_LIMIT_TIERS.API);
  const rateLimitHeaders = formatRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body: DeltaSyncBatchRequest = await req.json();

    if (!body || !body.deviceId || !Array.isArray(body.deltas)) {
      return NextResponse.json(
        { error: 'Invalid delta batch payload. Missing deviceId or deltas array.' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const response = await replicateDeltasAction(body);

    if (!response.success && response.rejectedOpIds.some((r) => r.reason === 'UNAUTHORIZED')) {
      return NextResponse.json(
        { error: 'Unauthorized session' },
        { status: 401, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(response, { status: 200, headers: rateLimitHeaders });
  } catch (err) {
    logger.error('Failed to process delta replication batch', {
      clientIp,
      error: err instanceof Error ? err.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error during delta synchronization' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}

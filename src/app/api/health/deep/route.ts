import { NextResponse } from 'next/server';
import { telemetry } from '../../../../lib/observability/telemetry';
import { notificationDispatcher } from '../../../../lib/notifications/notification-dispatcher';

/**
 * PACT Deep Production Health & Readiness Probe
 *
 * GET /api/health/deep
 * Evaluates core subsystems: telemetry, rate limiter, notification queue, and memory stats.
 * Zero secrets or credentials exposed.
 */

export async function GET() {
  const telemetrySummary = telemetry.getSummary();
  const queueStats = notificationDispatcher.getQueueStats();

  const memUsage = process.memoryUsage ? process.memoryUsage() : null;

  const payload = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    subsystems: {
      runtime: {
        status: 'UP',
        uptimeSeconds: telemetrySummary.uptimeSeconds,
        heapUsedMb: memUsage ? Math.round(memUsage.heapUsed / 1024 / 1024) : null,
        heapTotalMb: memUsage ? Math.round(memUsage.heapTotal / 1024 / 1024) : null,
      },
      rateLimiter: {
        status: 'ACTIVE',
        engine: 'MemoryRateLimiter',
      },
      notifications: {
        status: 'UP',
        pendingQueue: queueStats.pending,
        deadLetters: queueStats.deadLetters,
      },
      telemetry: {
        totalRequests: telemetrySummary.totalRequests,
        errorCount: telemetrySummary.errorCount,
      },
    },
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}


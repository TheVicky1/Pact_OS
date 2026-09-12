import { NextResponse } from 'next/server';

/**
 * PACT Operational Health & Readiness Endpoint
 *
 * GET /api/health
 * Returns non-sensitive runtime diagnostics and process health status.
 * Zero secrets, keys, or credentials are exposed.
 */

// Track start timestamp for uptime calculation
const processStartTime = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);
  const now = new Date().toISOString();

  const payload = {
    status: 'healthy',
    timestamp: now,
    uptime: uptimeSeconds,
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      runtime: 'ok',
      timestamp_iso: now,
    },
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

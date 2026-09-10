import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { executeDeadlineSweep, executeRecurringTransactionsSweep } from '../../../../lib/accountability/sweeper';


export const dynamic = 'force-dynamic';


/**
 * Constant-time comparison between provided Authorization header and expected Bearer token.
 * Prevents timing side-channel attacks on CRON_SECRET.
 */
export function isTimingSafeBearerMatch(providedHeader: string | null, secret: string): boolean {
  if (!providedHeader || !secret) return false;
  const expectedAuth = `Bearer ${secret}`;

  const providedBuf = Buffer.from(providedHeader, 'utf8');
  const expectedBuf = Buffer.from(expectedAuth, 'utf8');

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Autonomous Cron / Webhook Endpoint for Background Deadline Sweeping & Recurring Transactions.
 * Invoked periodically (e.g. every minute) by Vercel Cron, Supabase pg_cron, or external scheduler.
 *
 * Security:
 * - Protected by Bearer token matching CRON_SECRET environment variable via timing-safe comparison.
 * - If CRON_SECRET is configured, unauthenticated requests are strictly rejected (HTTP 401).
 * - Output contains ONLY operational metrics (processed_count, activated_count, duration_ms)
 *   and NEVER reveals sensitive consequence definitions, penalty notes, or user IDs.
 */
export async function GET(request: NextRequest) {
  return handleSweep(request);
}

export async function POST(request: NextRequest) {
  return handleSweep(request);
}

async function handleSweep(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // Verify Bearer token with constant-time comparison if CRON_SECRET is configured
  if (cronSecret) {
    if (!isTimingSafeBearerMatch(authHeader, cronSecret)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cron invocation.' },
        { status: 401 }
      );
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabaseKey =
      serviceRoleKey ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      'placeholder-key';

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });


    const batchSize = Math.min(
      parseInt(request.nextUrl.searchParams.get('batch_size') || '100', 10),
      500
    );

    const [result, recurringResult] = await Promise.all([
      executeDeadlineSweep(supabase, batchSize),
      executeRecurringTransactionsSweep(supabase),
    ]);

    return NextResponse.json(
      {
        success: result.success,
        code: result.code,
        processed_count: result.processed_count,
        activated_count: result.activated_count,
        recurring_generated_count: recurringResult.generated_count,
        duration_ms: result.duration_ms,
        executed_at: result.executed_at,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: 'CRON_EXECUTION_FAILED',
        error: 'Failed to complete autonomous deadline sweep.',
      },
      { status: 500 }
    );
  }
}

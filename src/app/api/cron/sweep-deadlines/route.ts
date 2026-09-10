import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { executeDeadlineSweep } from '@/lib/accountability/sweeper';

export const dynamic = 'force-dynamic';

/**
 * Autonomous Cron / Webhook Endpoint for Background Deadline Sweeping.
 * Invoked periodically (e.g. every minute) by Vercel Cron, pg_net, or external scheduler.
 *
 * Security:
 * - Protected by Bearer token matching CRON_SECRET environment variable.
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

  // Verify Bearer token if CRON_SECRET is configured
  if (cronSecret) {
    const expectedAuth = `Bearer ${cronSecret}`;
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cron invocation.' },
        { status: 401 }
      );
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use service_role client if configured, otherwise fallback to server client
    const supabase = serviceRoleKey
      ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        })
      : await createClient();

    const batchSize = Math.min(
      parseInt(request.nextUrl.searchParams.get('batch_size') || '100', 10),
      500
    );

    const result = await executeDeadlineSweep(supabase, batchSize);

    return NextResponse.json(
      {
        success: result.success,
        code: result.code,
        processed_count: result.processed_count,
        activated_count: result.activated_count,
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

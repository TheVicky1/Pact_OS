import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  RawUserDataArchive,
  serializeUserAccountJson,
  buildDomainCsvFiles,
} from '@/lib/export/serializer';
import { createZipArchive } from '@/lib/export/zip';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/export
 * Exports authenticated user's complete account data in JSON or CSV/ZIP format.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to export account data.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('user_id');

    // Strict tenant isolation guard: reject any client-provided user_id mismatch
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Cross-tenant export requests are strictly rejected.' },
        { status: 403 }
      );
    }

    const format = (searchParams.get('format') || 'json').toLowerCase();
    const nowIso = new Date().toISOString();
    const timestampClean = nowIso.replace(/[:.]/g, '-');

    // Query all 19 user-owned database domains in parallel
    const [
      profileRes,
      goalsRes,
      projectsRes,
      tasksRes,
      commitmentsRes,
      sessionsRes,
      waiversRes,
      eventsRes,
      consequencesRes,
      calendarRes,
      gcalRes,
      financeCatRes,
      financeTxRes,
      financeRecurringRes,
      financeBudgetsRes,
      notificationsRes,
      notifChannelsRes,
      externalProvidersRes,
      evidenceRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('deadline_at', { ascending: true }),
      supabase.from('task_accountability_commitments').select('*').eq('user_id', user.id),
      supabase.from('accountability_verification_sessions').select('*').eq('user_id', user.id),
      supabase.from('accountability_waivers').select('*').eq('user_id', user.id),
      supabase.from('accountability_events').select('*').eq('user_id', user.id),
      supabase.from('consequence_definitions').select('*').eq('user_id', user.id),
      supabase.from('calendar_events').select('*').eq('user_id', user.id),
      supabase.from('google_calendar_sync_states').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('finance_categories').select('*').eq('user_id', user.id),
      supabase.from('finance_transactions').select('*').eq('user_id', user.id),
      supabase.from('finance_recurring_transactions').select('*').eq('user_id', user.id),
      supabase.from('finance_budgets').select('*').eq('user_id', user.id),
      supabase.from('notifications').select('*').eq('user_id', user.id),
      supabase.from('notification_channel_configs').select('*').eq('user_id', user.id),
      supabase.from('external_provider_integrations').select('*').eq('user_id', user.id),
      supabase.from('external_proof_evidence').select('*').eq('user_id', user.id),
    ]);

    const rawArchive: RawUserDataArchive = {
      userId: user.id,
      exportedAt: nowIso,
      profile: (profileRes.data as Record<string, unknown>) || null,
      goals: (goalsRes.data as Record<string, unknown>[]) || [],
      projects: (projectsRes.data as Record<string, unknown>[]) || [],
      tasks: (tasksRes.data as Record<string, unknown>[]) || [],
      commitments: (commitmentsRes.data as Record<string, unknown>[]) || [],
      verificationSessions: (sessionsRes.data as Record<string, unknown>[]) || [],
      waivers: (waiversRes.data as Record<string, unknown>[]) || [],
      accountabilityEvents: (eventsRes.data as Record<string, unknown>[]) || [],
      consequenceDefinitions: (consequencesRes.data as Record<string, unknown>[]) || [],
      calendarEvents: (calendarRes.data as Record<string, unknown>[]) || [],
      googleCalendarSyncState: (gcalRes.data as Record<string, unknown>) || null,
      financeCategories: (financeCatRes.data as Record<string, unknown>[]) || [],
      financeTransactions: (financeTxRes.data as Record<string, unknown>[]) || [],
      financeRecurringTransactions: (financeRecurringRes.data as Record<string, unknown>[]) || [],
      financeBudgets: (financeBudgetsRes.data as Record<string, unknown>[]) || [],
      notifications: (notificationsRes.data as Record<string, unknown>[]) || [],
      notificationChannels: (notifChannelsRes.data as Record<string, unknown>[]) || [],
      externalProviders: (externalProvidersRes.data as Record<string, unknown>[]) || [],
      externalProofEvidence: (evidenceRes.data as Record<string, unknown>[]) || [],
    };

    const securityHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    };

    // Format: CSV / ZIP
    if (format === 'csv' || format === 'zip') {
      const domainCsvs = buildDomainCsvFiles(rawArchive);
      const zipBytes = createZipArchive(domainCsvs);

      return new NextResponse(zipBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="pact-os-export-${user.id}-${timestampClean}.zip"`,
          ...securityHeaders,
        },
      });
    }

    // Default Format: JSON
    const jsonOutput = serializeUserAccountJson(rawArchive);

    return new NextResponse(jsonOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="pact-os-export-${user.id}-${timestampClean}.json"`,
        ...securityHeaders,
      },
    });
  } catch (error: unknown) {
    console.error('Account data export failed:', error);
    return NextResponse.json(
      { error: 'Internal error generating account data export.' },
      { status: 500 }
    );
  }
}

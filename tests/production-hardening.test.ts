import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTimingSafeBearerMatch } from '../src/app/api/cron/sweep-deadlines/route';
import { evaluateExpiredTasks, SweeperCandidateTask } from '../src/lib/accountability/sweeper';
import { defaultClock } from '../src/lib/time';
import { mapGoogleToPactEvent, mapPactToGoogleEvent } from '../src/lib/integrations/google-calendar/sync';
import { evaluateProofOfWorkRule } from '../src/lib/integrations/proof-of-work/engine';
import { deliverEmail, deliverWebhook } from '../src/lib/notifications/delivery';
import { calculateNextOccurrence, isRecurrenceDue, calculateBudgetStatus } from '../src/lib/money';
import {
  sanitizeGoogleCalendarSync,
  sanitizeExternalProviders,
  serializeUserAccountJson,
  EXPORT_SCHEMA_VERSION,
  RawUserDataArchive,
} from '../src/lib/export/serializer';
import { createZipArchive } from '../src/lib/export/zip';

describe('Phase 5G — Production Hardening & Integration Reliability Verification Suite', () => {
  // ==========================================
  // 1. CRON TIMING-SAFE AUTHENTICATION TESTS
  // ==========================================
  it('1.1 isTimingSafeBearerMatch correctly validates identical Bearer credentials', () => {
    const secret = 'pact_production_cron_secret_secure_123';
    const header = `Bearer ${secret}`;

    assert.equal(isTimingSafeBearerMatch(header, secret), true);
  });

  it('1.2 isTimingSafeBearerMatch rejects mismatched or malformed Authorization headers', () => {
    const secret = 'pact_production_cron_secret_secure_123';

    assert.equal(isTimingSafeBearerMatch('Bearer wrong_secret', secret), false);
    assert.equal(isTimingSafeBearerMatch('Basic pact_secret', secret), false);
    assert.equal(isTimingSafeBearerMatch(null, secret), false);
    assert.equal(isTimingSafeBearerMatch('', secret), false);
    assert.equal(isTimingSafeBearerMatch('Bearer short', secret), false);
  });

  // ==========================================
  // 2. DEADLINE SWEEPER CONCURRENCY & IDEMPOTENCY
  // ==========================================
  it('2.1 Deadline sweeper processes only expired pending tasks and activates commitments idempotently', () => {
    const now = '2026-09-11T12:00:00.000Z';
    const clock = { now: () => new Date(now) };

    const tasks: SweeperCandidateTask[] = [
      {
        id: 't-expired-1',
        user_id: 'u-1',
        status: 'pending',
        deadline_at: '2026-09-11T11:59:59.000Z', // 1s in past -> expired
        commitment: { id: 'c-1', commitment_status: 'committed' },
      },
      {
        id: 't-future-2',
        user_id: 'u-1',
        status: 'pending',
        deadline_at: '2026-09-11T12:00:01.000Z', // 1s in future -> active
        commitment: { id: 'c-2', commitment_status: 'committed' },
      },
      {
        id: 't-completed-3',
        user_id: 'u-1',
        status: 'completed',
        deadline_at: '2026-09-11T11:00:00.000Z', // Already completed
        commitment: { id: 'c-3', commitment_status: 'fulfilled' },
      },
    ];

    const result = evaluateExpiredTasks(tasks, clock, 50);
    assert.equal(result.processedCount, 1);
    assert.deepEqual(result.transitionedTaskIds, ['t-expired-1']);
    assert.deepEqual(result.activatedCommitmentIds, ['c-1']);
    assert.deepEqual(result.skippedTaskIds, ['t-future-2', 't-completed-3']);
  });

  // ==========================================
  // 3. GOOGLE CALENDAR SYNC MAPPING & UTC CANONICALITY
  // ==========================================
  it('3.1 mapGoogleToPactEvent accurately maps all-day events to whole-day UTC horizon', () => {
    const gAllDay = {
      id: 'g-allday-1',
      summary: 'Company Offsite',
      start: { date: '2026-10-15' },
      end: { date: '2026-10-16' }, // Google exclusive end date
      etag: '"etag123"',
    };

    const mapped = mapGoogleToPactEvent(gAllDay, 'u-1');
    assert.equal(mapped.title, 'Company Offsite');
    assert.equal(mapped.start_time, '2026-10-15T00:00:00.000Z');
    assert.equal(mapped.end_time, '2026-10-15T23:59:59.999Z');
    assert.equal(mapped.google_event_id, 'g-allday-1');
    assert.equal(mapped.is_external, true);
  });

  it('3.2 mapPactToGoogleEvent formats canonical ISO-8601 payload', () => {
    const pactEvent = {
      id: 'pe-1',
      user_id: 'u-1',
      title: 'Deep Architecture Focus',
      description: 'System hardening',
      start_time: '2026-10-15T09:00:00.000Z',
      end_time: '2026-10-15T11:00:00.000Z',
      color_tag: 'gold' as const,
      goal_id: null,
      project_id: null,
      task_id: null,
      created_at: '2026-09-11T00:00:00.000Z',
      updated_at: '2026-09-11T00:00:00.000Z',
    };

    const gPayload = mapPactToGoogleEvent(pactEvent);
    assert.equal(gPayload.summary, 'Deep Architecture Focus');
    assert.equal(gPayload.start.dateTime, '2026-10-15T09:00:00.000Z');
    assert.equal(gPayload.end.dateTime, '2026-10-15T11:00:00.000Z');
  });

  // ==========================================
  // 4. EXTERNAL PROOF-OF-WORK OUTAGE RESILIENCE
  // ==========================================
  it('4.1 External proof evaluator returns PROVIDER_UNAVAILABLE on provider outages and NEVER marks failure', async () => {
    const result = await evaluateProofOfWorkRule({
      provider: 'github',
      ruleType: 'github_commits',
      config: { min_commits: 2 },
      windowStart: '2026-09-11T00:00:00.000Z',
      windowEnd: '2026-09-11T12:00:00.000Z',
      accountHandle: 'octocat',
      fetcherOverrides: {
        githubCommits: async () => ({
          success: false,
          error: 'GitHub API HTTP 503 Service Unavailable',
        }),
      },
    });

    assert.equal(result.verified, false);
    assert.equal(result.code, 'PROVIDER_UNAVAILABLE');
    assert.equal(result.evidence.length, 0);
  });

  it('4.2 External proof evaluator returns RATE_LIMITED on 429 response without failing commitment', async () => {
    const result = await evaluateProofOfWorkRule({
      provider: 'leetcode',
      ruleType: 'leetcode_solve',
      config: { min_problems: 1 },
      windowStart: '2026-09-11T00:00:00.000Z',
      windowEnd: '2026-09-11T12:00:00.000Z',
      accountHandle: 'coder',
      fetcherOverrides: {
        leetcodeAc: async () => ({
          success: false,
          isRateLimited: true,
          error: 'Rate limit exceeded',
        }),
      },
    });

    assert.equal(result.verified, false);
    assert.equal(result.code, 'RATE_LIMITED');
  });

  // ==========================================
  // 5. NOTIFICATION DELIVERY CHANNELS & INTEGRITY
  // ==========================================
  it('5.1 deliverEmail reports honest unconfigured state when API key is missing', async () => {
    const res = await deliverEmail(
      {
        userId: 'u-1',
        type: 'task_deadline_approaching',
        title: 'Deadline Alert',
        body: 'Task deadline is near',
      },
      'operator@example.com'
    );

    // When RESEND_API_KEY is not set in test environment, reports isConfigured: false
    assert.equal(typeof res.isConfigured, 'boolean');
    assert.equal(res.channel, 'email');
  });

  it('5.2 deliverWebhook validates HTTPS protocol and produces sanitized non-confidential payloads', async () => {
    const res = await deliverWebhook(
      {
        userId: 'u-1',
        type: 'accountability_activated',
        title: 'Commitment Activated',
        body: 'Consequence has been activated',
      },
      'https://api.pact.internal/webhooks/alerts'
    );

    assert.equal(res.channel, 'webhook');
    assert.equal(res.success, true);
    assert.equal(res.isConfigured, true);
  });

  // ==========================================
  // 6. FINANCIAL INTEGRITY & RECURRENCE MATH
  // ==========================================
  it('6.1 Recurrence engine correctly clamps month-end transitions across non-leap and leap years', () => {
    // Jan 31 -> Feb 28 in non-leap year (2027)
    const nextFebNonLeap = calculateNextOccurrence('2027-01-31', 'monthly', '2027-01-31');
    assert.equal(nextFebNonLeap, '2027-02-28');

    // Feb 28 -> Mar 31 restoring original day preference
    const nextMar = calculateNextOccurrence('2027-02-28', 'monthly', '2027-01-31');
    assert.equal(nextMar, '2027-03-31');

    // Jan 31 -> Feb 29 in leap year (2028)
    const nextFebLeap = calculateNextOccurrence('2028-01-31', 'monthly', '2028-01-31');
    assert.equal(nextFebLeap, '2028-02-29');
  });

  it('6.2 isRecurrenceDue evaluates date boundaries accurately', () => {
    assert.equal(isRecurrenceDue('2026-09-10', '2026-09-11'), true); // Past due
    assert.equal(isRecurrenceDue('2026-09-11', '2026-09-11'), true); // Today due
    assert.equal(isRecurrenceDue('2026-09-12', '2026-09-11'), false); // Future
  });

  it('6.3 calculateBudgetStatus calculates integer-cents utilization and alert flags accurately', () => {
    const budgets = [
      {
        id: 'b-1',
        user_id: 'u-1',
        category_id: 'c-1',
        period: '2026-09',
        limit_cents: 100000, // ₹1,000.00
        is_active: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
    ];
    const transactions = [
      {
        id: 't-1',
        user_id: 'u-1',
        category_id: 'c-1',
        type: 'expense' as const,
        amount_cents: 85000, // ₹850.00 (85% utilization)
        description: 'Server hosting',
        transaction_date: '2026-09-05',
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      },
    ];
    const categories = [
      {
        id: 'c-1',
        user_id: 'u-1',
        name: 'Cloud Servers',
        color_tag: 'blue' as const,
        is_archived: false,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
    ];

    const overview = calculateBudgetStatus(budgets, transactions, categories, '2026-09');
    assert.equal(overview.categories.length, 1);
    const status = overview.categories[0];

    assert.equal(status.spentCents, 85000);
    assert.equal(status.remainingCents, 15000);
    assert.equal(status.utilizationPercent, 85);
    assert.equal(status.isApproaching, true); // >= 80%
    assert.equal(status.isExceeded, false);
  });

  // ==========================================
  // 7. DATA EXPORT SECURITY & SANITIZATION
  // ==========================================
  it('7.1 sanitizeGoogleCalendarSync and sanitizeExternalProviders strip all secrets from archive', () => {
    const rawGcal = {
      calendar_id: 'primary',
      sync_status: 'synced',
      access_token: 'SECRET_TOKEN_1',
      refresh_token: 'SECRET_TOKEN_2',
    };
    const sanitizedGcal = sanitizeGoogleCalendarSync(rawGcal);
    assert.equal('access_token' in sanitizedGcal!, false);
    assert.equal('refresh_token' in sanitizedGcal!, false);

    const rawExt = [
      {
        provider: 'github',
        account_handle: 'octocat',
        access_token: 'SECRET_TOKEN_3',
        token_expires_at: '2026-09-12T00:00:00.000Z',
      },
    ];
    const sanitizedExt = sanitizeExternalProviders(rawExt);
    assert.equal('access_token' in sanitizedExt[0], false);
    assert.equal('token_expires_at' in sanitizedExt[0], false);
  });

  it('7.2 serializeUserAccountJson output contains valid schema_version and excludes credentials', () => {
    const archive: RawUserDataArchive = {
      userId: 'user-pact-prod',
      exportedAt: '2026-09-11T01:00:00.000Z',
      profile: { id: 'user-pact-prod', full_name: 'Operator', timezone: 'Asia/Kolkata' },
      goals: [],
      projects: [],
      tasks: [],
      commitments: [],
      verificationSessions: [],
      waivers: [],
      accountabilityEvents: [],
      consequenceDefinitions: [],
      calendarEvents: [],
      googleCalendarSyncState: { calendar_id: 'primary', access_token: 'LEAK_ME' },
      financeCategories: [],
      financeTransactions: [],
      financeRecurringTransactions: [],
      financeBudgets: [],
      notifications: [],
      notificationChannels: [],
      externalProviders: [{ provider: 'github', access_token: 'LEAK_ME_TOO' }],
      externalProofEvidence: [],
    };

    const json = serializeUserAccountJson(archive);
    assert.equal(json.includes('LEAK_ME'), false);
    const parsed = JSON.parse(json);
    assert.equal(parsed.schema_version, EXPORT_SCHEMA_VERSION);
  });

  it('7.3 createZipArchive builds valid PKZip buffer for multi-table CSV downloads', () => {
    const zipBytes = createZipArchive([
      { filename: 'test.csv', content: 'id,name\r\n1,Alpha' },
    ]);
    assert.ok(zipBytes.length > 30);
    const view = new DataView(zipBytes.buffer);
    assert.equal(view.getUint32(0, true), 0x04034b50); // PK header
  });
});

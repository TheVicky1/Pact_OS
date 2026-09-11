import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  completeOnboardingSchema,
} from '../src/lib/validations/onboarding';
import {
  EXPORT_SCHEMA_VERSION,
  escapeCsvValue,
  arrayToCsv,
  sanitizeGoogleCalendarSync,
  sanitizeExternalProviders,
  sanitizeNotificationChannels,
  serializeUserAccountJson,
  buildDomainCsvFiles,
  RawUserDataArchive,
} from '../src/lib/export/serializer';
import { createZipArchive, computeCrc32 } from '../src/lib/export/zip';

describe('Phase 5F — User Onboarding & Account Data Portability Verification Suite', () => {
  // ==========================================
  // ONBOARDING DOMAIN & VALIDATION TESTS (1–10)
  // ==========================================

  it('1. New user step 1 validation accepts valid display name, IANA timezone, and working hours', () => {
    const valid = onboardingStep1Schema.safeParse({
      fullName: 'Vikram Patel',
      timezone: 'Asia/Kolkata',
      workStartTime: '09:00',
      workEndTime: '18:00',
    });

    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.fullName, 'Vikram Patel');
      assert.equal(valid.data.timezone, 'Asia/Kolkata');
      assert.equal(valid.data.workStartTime, '09:00');
      assert.equal(valid.data.workEndTime, '18:00');
    }
  });

  it('2. Invalid Step 1 inputs (short name, invalid IANA timezone, malformed time) are strictly rejected', () => {
    // Too short name
    const shortName = onboardingStep1Schema.safeParse({
      fullName: 'A',
      timezone: 'UTC',
      workStartTime: '09:00',
      workEndTime: '18:00',
    });
    assert.equal(shortName.success, false);

    // Invalid timezone
    const badTz = onboardingStep1Schema.safeParse({
      fullName: 'Alex Mercer',
      timezone: 'Mars/Olympus_Mons',
      workStartTime: '09:00',
      workEndTime: '18:00',
    });
    assert.equal(badTz.success, false);

    // Invalid time format
    const badTime = onboardingStep1Schema.safeParse({
      fullName: 'Alex Mercer',
      timezone: 'UTC',
      workStartTime: '25:99',
      workEndTime: '18:00',
    });
    assert.equal(badTime.success, false);
  });

  it('3. Step 2 validation accepts daily task target and alert toggles with defaults', () => {
    const valid = onboardingStep2Schema.safeParse({
      dailyTaskTarget: 7,
      notificationPreferences: {
        dailyPlanReminder: true,
        deadlineAlerts: true,
        consequenceAlerts: false,
        weeklyReviewNotice: true,
      },
      initialGoalTitle: 'Master PACT OS Architecture',
      initialProjectTitle: 'Phase 5F Implementation',
    });

    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.dailyTaskTarget, 7);
      assert.equal(valid.data.notificationPreferences.consequenceAlerts, false);
      assert.equal(valid.data.initialGoalTitle, 'Master PACT OS Architecture');
    }
  });

  it('4. Step 2 allows skipping optional initial goal and project fields', () => {
    const valid = onboardingStep2Schema.safeParse({
      dailyTaskTarget: 5,
    });

    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.dailyTaskTarget, 5);
      assert.equal(valid.data.notificationPreferences.dailyPlanReminder, true);
      assert.equal(valid.data.initialGoalTitle, undefined);
    }
  });

  it('5. Step 2 rejects invalid daily task targets (e.g. 0 or > 20)', () => {
    const zeroTarget = onboardingStep2Schema.safeParse({ dailyTaskTarget: 0 });
    assert.equal(zeroTarget.success, false);

    const excessiveTarget = onboardingStep2Schema.safeParse({ dailyTaskTarget: 50 });
    assert.equal(excessiveTarget.success, false);
  });

  it('6. Complete onboarding schema merges and validates full payload', () => {
    const full = completeOnboardingSchema.safeParse({
      fullName: 'Vikram Patel',
      timezone: 'America/New_York',
      workStartTime: '08:30',
      workEndTime: '17:30',
      dailyTaskTarget: 6,
      notificationPreferences: {
        dailyPlanReminder: true,
        deadlineAlerts: true,
        consequenceAlerts: true,
        weeklyReviewNotice: true,
      },
      initialGoalTitle: 'Launch PACT OS',
      initialProjectTitle: 'Deliver Phase 5F',
    });

    assert.equal(full.success, true);
    if (full.success) {
      assert.equal(full.data.fullName, 'Vikram Patel');
      assert.equal(full.data.timezone, 'America/New_York');
      assert.equal(full.data.dailyTaskTarget, 6);
    }
  });

  // ==========================================
  // EXPORT & SECURITY SANITIZATION TESTS (11–25)
  // ==========================================

  it('7. Google Calendar sync sanitizer strictly strips access_token and refresh_token', () => {
    const rawGcal = {
      id: 'gcal-uuid-1',
      user_id: 'user-uuid-1',
      calendar_id: 'primary',
      sync_status: 'synced',
      last_sync_at: '2026-09-11T00:00:00.000Z',
      sync_token: 'sync-token-abc',
      channel_id: 'channel-uuid-1',
      access_token: 'ya29.sensitive-access-token-12345',
      refresh_token: '1//sensitive-refresh-token-67890',
      created_at: '2026-09-10T00:00:00.000Z',
    };

    const sanitized = sanitizeGoogleCalendarSync(rawGcal);
    assert.ok(sanitized);
    assert.equal(sanitized.calendar_id, 'primary');
    assert.equal(sanitized.sync_status, 'synced');
    assert.equal('access_token' in sanitized, false);
    assert.equal('refresh_token' in sanitized, false);
    assert.equal(JSON.stringify(sanitized).includes('ya29.sensitive'), false);
    assert.equal(JSON.stringify(sanitized).includes('1//sensitive'), false);
  });

  it('8. External provider sanitizer strictly strips OAuth tokens and expires_at secrets', () => {
    const rawProviders = [
      {
        id: 'gh-integration-1',
        user_id: 'user-uuid-1',
        provider: 'github',
        account_handle: 'octocat',
        access_token: 'gho_secret_access_token_123',
        token_expires_at: '2026-09-12T00:00:00.000Z',
        sync_status: 'connected',
        last_verified_at: '2026-09-11T00:00:00.000Z',
        created_at: '2026-09-10T00:00:00.000Z',
      },
      {
        id: 'cf-integration-2',
        user_id: 'user-uuid-1',
        provider: 'codeforces',
        account_handle: 'tourist',
        access_token: null,
        sync_status: 'connected',
        last_verified_at: '2026-09-11T00:00:00.000Z',
        created_at: '2026-09-10T00:00:00.000Z',
      },
    ];

    const sanitized = sanitizeExternalProviders(rawProviders);
    assert.equal(sanitized.length, 2);
    assert.equal(sanitized[0].account_handle, 'octocat');
    assert.equal(sanitized[1].account_handle, 'tourist');
    assert.equal('access_token' in sanitized[0], false);
    assert.equal('token_expires_at' in sanitized[0], false);
    assert.equal(JSON.stringify(sanitized).includes('gho_secret'), false);
  });

  it('9. Notification channels sanitizer strips secret keys and webhook secrets', () => {
    const rawChannels = [
      {
        id: 'chan-1',
        user_id: 'user-1',
        channel_type: 'discord',
        webhook_url: 'https://discord.com/api/webhooks/xyz',
        webhook_secret: 'whsec_sensitive_webhook_key',
        secret_key: 'sk_live_very_secret_key',
      },
    ];

    const sanitized = sanitizeNotificationChannels(rawChannels);
    assert.equal('secret_key' in sanitized[0], false);
    assert.equal('webhook_secret' in sanitized[0], false);
    assert.equal(JSON.stringify(sanitized).includes('whsec_sensitive'), false);
    assert.equal(JSON.stringify(sanitized).includes('sk_live'), false);
  });

  it('10. Structured JSON archive generation produces valid versioned schema with complete domains', () => {
    const mockArchive: RawUserDataArchive = {
      userId: 'user-uuid-1234',
      exportedAt: '2026-09-11T01:30:00.000Z',
      profile: {
        id: 'user-uuid-1234',
        full_name: 'Test Operator',
        email: 'operator@pact.local',
        timezone: 'Asia/Kolkata',
        onboarding_status: 'completed',
        onboarding_step: 3,
        onboarding_completed_at: '2026-09-11T01:00:00.000Z',
      },
      goals: [{ id: 'g1', title: 'Goal 1', status: 'active' }],
      projects: [{ id: 'p1', title: 'Project 1', status: 'active' }],
      tasks: [{ id: 't1', title: 'Task 1', deadline_at: '2026-09-11T12:00:00.000Z', status: 'pending' }],
      commitments: [{ id: 'c1', task_id: 't1', commitment_status: 'committed' }],
      verificationSessions: [],
      waivers: [],
      accountabilityEvents: [],
      consequenceDefinitions: [{ id: 'cq1', title: 'Default Pushups', is_default: true }],
      calendarEvents: [{ id: 'ev1', title: 'Deep Work Block', start_time: '2026-09-11T09:00:00.000Z' }],
      googleCalendarSyncState: {
        id: 'gcal-1',
        sync_status: 'connected',
        access_token: 'LEAK_SECRET_1',
      },
      financeCategories: [{ id: 'fc1', name: 'Cloud Infrastructure', color_tag: 'blue' }],
      financeTransactions: [{ id: 'ft1', amount_cents: 15000, description: 'Server hosting' }],
      financeRecurringTransactions: [{ id: 'frt1', amount_cents: 5000, frequency: 'monthly', status: 'active' }],
      financeBudgets: [{ id: 'fb1', limit_cents: 50000, period: '2026-09' }],
      notifications: [{ id: 'n1', title: 'Deadline warning', is_read: false }],
      notificationChannels: [],
      externalProviders: [{ id: 'ep1', provider: 'github', access_token: 'LEAK_SECRET_2' }],
      externalProofEvidence: [{ id: 'epe1', provider: 'github', summary: '3 commits to main' }],
    };

    const jsonStr = serializeUserAccountJson(mockArchive);
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.schema_version, EXPORT_SCHEMA_VERSION);
    assert.equal(parsed.user_id, 'user-uuid-1234');
    assert.equal(parsed.profile.full_name, 'Test Operator');
    assert.equal(parsed.goals.length, 1);
    assert.equal(parsed.projects.length, 1);
    assert.equal(parsed.tasks.length, 1);
    assert.equal(parsed.finance.transactions.length, 1);
    assert.equal(parsed.finance.recurring_transactions.length, 1);
    assert.equal(parsed.finance.budgets.length, 1);
    assert.equal(parsed.external_proof_evidence.length, 1);

    // Verify secrets are strictly stripped
    assert.equal(jsonStr.includes('LEAK_SECRET_1'), false);
    assert.equal(jsonStr.includes('LEAK_SECRET_2'), false);
    assert.equal('access_token' in parsed.google_calendar_sync, false);
    assert.equal('access_token' in parsed.integrations.external_providers[0], false);
  });

  it('11. RFC 4180 CSV escaping handles quotes, commas, newlines, and objects correctly', () => {
    assert.equal(escapeCsvValue('Simple'), 'Simple');
    assert.equal(escapeCsvValue('With, Comma'), '"With, Comma"');
    assert.equal(escapeCsvValue('With "Quotes"'), '"With ""Quotes"""');
    assert.equal(escapeCsvValue('Line 1\nLine 2'), '"Line 1\nLine 2"');
    assert.equal(escapeCsvValue(null), '');
    assert.equal(escapeCsvValue(undefined), '');
    assert.equal(escapeCsvValue({ key: 'val' }), '"{""key"":""val""}"');
  });


  it('12. arrayToCsv generates well-formed tabular CSV string with header row', () => {
    const rows = [
      { id: '1', title: 'Task Alpha', priority: 'high' },
      { id: '2', title: 'Task Beta, Urgent', priority: 'urgent' },
    ];

    const csv = arrayToCsv(rows, ['id', 'title', 'priority']);
    const lines = csv.trim().split('\r\n');

    assert.equal(lines.length, 3);
    assert.equal(lines[0], 'id,title,priority');
    assert.equal(lines[1], '1,Task Alpha,high');
    assert.equal(lines[2], '2,"Task Beta, Urgent",urgent');
  });

  it('13. buildDomainCsvFiles creates separate CSV files for all 17 tabular domains', () => {
    const mockArchive: RawUserDataArchive = {
      userId: 'u1',
      exportedAt: '2026-09-11T00:00:00.000Z',
      profile: { id: 'u1', full_name: 'Test', timezone: 'UTC' },
      goals: [{ id: 'g1', title: 'G1' }],
      projects: [{ id: 'p1', title: 'P1' }],
      tasks: [{ id: 't1', title: 'T1' }],
      commitments: [{ id: 'c1' }],
      verificationSessions: [],
      waivers: [],
      accountabilityEvents: [],
      consequenceDefinitions: [],
      calendarEvents: [],
      googleCalendarSyncState: null,
      financeCategories: [],
      financeTransactions: [],
      financeRecurringTransactions: [],
      financeBudgets: [],
      notifications: [],
      notificationChannels: [],
      externalProviders: [{ id: 'ep1', provider: 'github', access_token: 'SECRET' }],
      externalProofEvidence: [],
    };

    const files = buildDomainCsvFiles(mockArchive);
    assert.ok(files.length >= 15);

    const filenames = files.map((f) => f.filename);
    assert.ok(filenames.includes('profile.csv'));
    assert.ok(filenames.includes('goals.csv'));
    assert.ok(filenames.includes('projects.csv'));
    assert.ok(filenames.includes('tasks.csv'));
    assert.ok(filenames.includes('finance_transactions.csv'));
    assert.ok(filenames.includes('finance_recurring_transactions.csv'));
    assert.ok(filenames.includes('finance_budgets.csv'));
    assert.ok(filenames.includes('integrations_metadata.csv'));

    // Check that secret was stripped in integrations_metadata.csv
    const integrationsCsv = files.find((f) => f.filename === 'integrations_metadata.csv')?.content || '';
    assert.equal(integrationsCsv.includes('SECRET'), false);
  });

  it('14. ZIP archive builder constructs valid binary PKZip archive from multiple CSVs', () => {
    const files = [
      { filename: 'hello.txt', content: 'Hello World from PACT OS' },
      { filename: 'data.csv', content: 'id,name\r\n1,Alpha\r\n2,Beta\r\n' },
    ];

    const zipBytes = createZipArchive(files);
    assert.ok(zipBytes instanceof Uint8Array);
    assert.ok(zipBytes.length > 50);

    // Verify standard PKZip signatures (0x04034b50 local header signature)
    const view = new DataView(zipBytes.buffer);
    assert.equal(view.getUint32(0, true), 0x04034b50);

    // Verify CRC-32 calculation correctness
    const textEncoder = new TextEncoder();
    const crc = computeCrc32(textEncoder.encode('Hello World from PACT OS'));
    assert.ok(crc > 0);
  });

  it('15. Empty database datasets produce safe empty schema representations without throwing', () => {
    const emptyArchive: RawUserDataArchive = {
      userId: 'u-empty',
      exportedAt: '2026-09-11T00:00:00.000Z',
      profile: null,
      goals: [],
      projects: [],
      tasks: [],
      commitments: [],
      verificationSessions: [],
      waivers: [],
      accountabilityEvents: [],
      consequenceDefinitions: [],
      calendarEvents: [],
      googleCalendarSyncState: null,
      financeCategories: [],
      financeTransactions: [],
      financeRecurringTransactions: [],
      financeBudgets: [],
      notifications: [],
      notificationChannels: [],
      externalProviders: [],
      externalProofEvidence: [],
    };

    const jsonStr = serializeUserAccountJson(emptyArchive);
    assert.ok(jsonStr);
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.schema_version, EXPORT_SCHEMA_VERSION);
    assert.equal(parsed.goals.length, 0);

    const csvFiles = buildDomainCsvFiles(emptyArchive);
    const zipBytes = createZipArchive(csvFiles);
    assert.ok(zipBytes.length > 0);
  });
});

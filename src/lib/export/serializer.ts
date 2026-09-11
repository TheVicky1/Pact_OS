/**
 * Account Data Portability Exporter & Serializer
 * Provides RFC 4180 CSV serialization, deterministic JSON archive formatting,
 * and strict secret/token stripping.
 */

export const EXPORT_SCHEMA_VERSION = '2026-09-11.pact.v1';

/**
 * Escapes a single value according to RFC 4180 CSV standard.
 */
export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  let str: string;
  if (typeof val === 'object') {
    str = JSON.stringify(val);
  } else {
    str = String(val);
  }

  // If the string contains comma, quote, or newline, enclose in quotes and double internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of objects into an RFC 4180 CSV string with header row.
 */
export function arrayToCsv(rows: Record<string, unknown>[], customHeaders?: string[]): string {
  if (!rows || rows.length === 0) {
    return customHeaders && customHeaders.length > 0
      ? customHeaders.map(escapeCsvValue).join(',') + '\r\n'
      : '';
  }

  const headers = customHeaders || Array.from(
    new Set(rows.flatMap((r) => Object.keys(r)))
  );

  const headerLine = headers.map(escapeCsvValue).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCsvValue(row[h])).join(',')
  );

  return [headerLine, ...rowLines].join('\r\n') + '\r\n';
}

/**
 * Sanitizes Google Calendar sync record by stripping sensitive tokens.
 */
export function sanitizeGoogleCalendarSync(
  syncState: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!syncState) return null;

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    access_token,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    refresh_token,
    ...safeState
  } = syncState;

  return safeState;
}

/**
 * Sanitizes external provider integration records by stripping OAuth credentials and tokens.
 */
export function sanitizeExternalProviders(
  providers: Record<string, unknown>[]
): Record<string, unknown>[] {
  return (providers || []).map((provider) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      access_token,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      token_expires_at,
      ...safeProvider
    } = provider;

    return safeProvider;
  });
}

/**
 * Sanitizes notification channel configurations by stripping webhook secret URLs and keys.
 */
export function sanitizeNotificationChannels(
  channels: Record<string, unknown>[]
): Record<string, unknown>[] {
  return (channels || []).map((chan) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      secret_key,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      webhook_secret,
      ...safeChan
    } = chan;

    return safeChan;
  });
}

export interface RawUserDataArchive {
  userId: string;
  exportedAt: string;
  profile: Record<string, unknown> | null;
  goals: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  commitments: Record<string, unknown>[];
  verificationSessions: Record<string, unknown>[];
  waivers: Record<string, unknown>[];
  accountabilityEvents: Record<string, unknown>[];
  consequenceDefinitions: Record<string, unknown>[];
  calendarEvents: Record<string, unknown>[];
  googleCalendarSyncState: Record<string, unknown> | null;
  financeCategories: Record<string, unknown>[];
  financeTransactions: Record<string, unknown>[];
  financeRecurringTransactions: Record<string, unknown>[];
  financeBudgets: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  notificationChannels: Record<string, unknown>[];
  externalProviders: Record<string, unknown>[];
  externalProofEvidence: Record<string, unknown>[];
  focusSessions?: Record<string, unknown>[];
  habits?: Record<string, unknown>[];
  habitOccurrences?: Record<string, unknown>[];
  routineTemplates?: Record<string, unknown>[];
  routineItems?: Record<string, unknown>[];
  weeklyReviews?: Record<string, unknown>[];
}

/**
 * Formats full structured JSON export with versioning and security sanitization.
 */
export function serializeUserAccountJson(data: RawUserDataArchive): string {
  const safeProfile = data.profile || {};
  const safeGcal = sanitizeGoogleCalendarSync(data.googleCalendarSyncState);
  const safeExternalProviders = sanitizeExternalProviders(data.externalProviders);
  const safeNotificationChannels = sanitizeNotificationChannels(data.notificationChannels);

  const archive = {
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: data.exportedAt,
    user_id: data.userId,
    profile: {
      id: safeProfile.id || data.userId,
      full_name: safeProfile.full_name || '',
      email: safeProfile.email || '',
      timezone: safeProfile.timezone || 'UTC',
      created_at: safeProfile.created_at || null,
      updated_at: safeProfile.updated_at || null,
    },
    onboarding: {
      status: safeProfile.onboarding_status || 'completed',
      step: safeProfile.onboarding_step || 3,
      data: safeProfile.onboarding_data || {},
      completed_at: safeProfile.onboarding_completed_at || null,
    },
    goals: data.goals || [],
    projects: data.projects || [],
    tasks: data.tasks || [],
    commitments: data.commitments || [],
    verification_sessions: data.verificationSessions || [],
    waivers: data.waivers || [],
    accountability_events: data.accountabilityEvents || [],
    consequence_definitions: data.consequenceDefinitions || [],
    calendar_events: data.calendarEvents || [],
    google_calendar_sync: safeGcal,
    finance: {
      categories: data.financeCategories || [],
      transactions: data.financeTransactions || [],
      recurring_transactions: data.financeRecurringTransactions || [],
      budgets: data.financeBudgets || [],
    },
    notifications: data.notifications || [],
    notification_channels: safeNotificationChannels,
    integrations: {
      external_providers: safeExternalProviders,
    },
    external_proof_evidence: data.externalProofEvidence || [],
    focus_sessions: data.focusSessions || [],
    habits: {
      habits: data.habits || [],
      occurrences: data.habitOccurrences || [],
      routine_templates: data.routineTemplates || [],
      routine_items: data.routineItems || [],
    },
    weekly_reviews: data.weeklyReviews || [],
  };

  return JSON.stringify(archive, null, 2);
}

/**
 * Builds modular CSV files per user domain.
 */
export function buildDomainCsvFiles(data: RawUserDataArchive): { filename: string; content: string }[] {
  const safeProfile = data.profile || {};
  const safeExternalProviders = sanitizeExternalProviders(data.externalProviders);

  return [
    {
      filename: 'profile.csv',
      content: arrayToCsv([
        {
          id: safeProfile.id || data.userId,
          full_name: safeProfile.full_name || '',
          email: safeProfile.email || '',
          timezone: safeProfile.timezone || 'UTC',
          onboarding_status: safeProfile.onboarding_status || 'completed',
          onboarding_completed_at: safeProfile.onboarding_completed_at || '',
          created_at: safeProfile.created_at || '',
        },
      ]),
    },
    {
      filename: 'goals.csv',
      content: arrayToCsv(data.goals, [
        'id',
        'title',
        'description',
        'target_date',
        'status',
        'created_at',
        'updated_at',
      ]),
    },
    {
      filename: 'projects.csv',
      content: arrayToCsv(data.projects, [
        'id',
        'goal_id',
        'title',
        'description',
        'color_accent',
        'status',
        'created_at',
        'updated_at',
      ]),
    },
    {
      filename: 'tasks.csv',
      content: arrayToCsv(data.tasks, [
        'id',
        'project_id',
        'goal_id',
        'title',
        'description',
        'priority',
        'status',
        'deadline_at',
        'completed_at',
        'missed_at',
        'created_at',
      ]),
    },
    {
      filename: 'commitments.csv',
      content: arrayToCsv(data.commitments, [
        'id',
        'task_id',
        'commitment_status',
        'activated_at',
        'consequence_snapshot',
        'created_at',
      ]),
    },
    {
      filename: 'accountability_events.csv',
      content: arrayToCsv(data.accountabilityEvents, [
        'id',
        'task_id',
        'commitment_id',
        'event_type',
        'metadata',
        'created_at',
      ]),
    },
    {
      filename: 'verification_sessions.csv',
      content: arrayToCsv(data.verificationSessions, [
        'id',
        'commitment_id',
        'started_at',
        'ended_at',
        'required_duration_seconds',
        'actual_duration_seconds',
        'status',
        'evidence_note',
        'created_at',
      ]),
    },
    {
      filename: 'waivers.csv',
      content: arrayToCsv(data.waivers, [
        'id',
        'commitment_id',
        'task_id',
        'waived_at',
        'waiver_week_year',
        'waiver_week_number',
        'waiver_count_in_week',
        'created_at',
      ]),
    },
    {
      filename: 'consequence_definitions.csv',
      content: arrayToCsv(data.consequenceDefinitions, [
        'id',
        'title',
        'consequence_type',
        'action_statement',
        'is_enabled',
        'is_default',
        'priority',
        'verification_type',
        'created_at',
      ]),
    },
    {
      filename: 'calendar_events.csv',
      content: arrayToCsv(data.calendarEvents, [
        'id',
        'title',
        'start_time',
        'end_time',
        'color_tag',
        'goal_id',
        'project_id',
        'task_id',
        'is_external',
        'created_at',
      ]),
    },
    {
      filename: 'finance_categories.csv',
      content: arrayToCsv(data.financeCategories, [
        'id',
        'name',
        'color_tag',
        'is_archived',
        'created_at',
      ]),
    },
    {
      filename: 'finance_transactions.csv',
      content: arrayToCsv(data.financeTransactions, [
        'id',
        'category_id',
        'type',
        'amount_cents',
        'description',
        'transaction_date',
        'recurring_transaction_id',
        'created_at',
      ]),
    },
    {
      filename: 'finance_recurring_transactions.csv',
      content: arrayToCsv(data.financeRecurringTransactions, [
        'id',
        'category_id',
        'type',
        'amount_cents',
        'description',
        'frequency',
        'start_date',
        'end_date',
        'next_occurrence',
        'status',
        'created_at',
      ]),
    },
    {
      filename: 'finance_budgets.csv',
      content: arrayToCsv(data.financeBudgets, [
        'id',
        'category_id',
        'period',
        'limit_cents',
        'is_active',
        'created_at',
      ]),
    },
    {
      filename: 'notifications.csv',
      content: arrayToCsv(data.notifications, [
        'id',
        'type',
        'title',
        'message',
        'is_read',
        'read_at',
        'idempotency_key',
        'created_at',
      ]),
    },
    {
      filename: 'external_proof_evidence.csv',
      content: arrayToCsv(data.externalProofEvidence, [
        'id',
        'commitment_id',
        'provider',
        'external_event_id',
        'event_timestamp',
        'evidence_type',
        'summary',
        'created_at',
      ]),
    },
    {
      filename: 'integrations_metadata.csv',
      content: arrayToCsv(safeExternalProviders, [
        'id',
        'provider',
        'account_handle',
        'sync_status',
        'last_verified_at',
        'last_error',
        'created_at',
      ]),
    },
    {
      filename: 'focus_sessions.csv',
      content: arrayToCsv(data.focusSessions || [], [
        'id',
        'task_id',
        'session_type',
        'duration_minutes',
        'actual_duration_seconds',
        'status',
        'started_at',
        'ended_at',
        'created_at',
      ]),
    },
    {
      filename: 'habits.csv',
      content: arrayToCsv(data.habits || [], [
        'id',
        'title',
        'description',
        'category',
        'target_frequency',
        'target_count',
        'is_archived',
        'created_at',
      ]),
    },
    {
      filename: 'habit_occurrences.csv',
      content: arrayToCsv(data.habitOccurrences || [], [
        'id',
        'habit_id',
        'occurrence_date',
        'status',
        'completed_at',
        'created_at',
      ]),
    },
    {
      filename: 'routine_templates.csv',
      content: arrayToCsv(data.routineTemplates || [], [
        'id',
        'name',
        'description',
        'time_of_day',
        'is_active',
        'created_at',
      ]),
    },
    {
      filename: 'routine_items.csv',
      content: arrayToCsv(data.routineItems || [], [
        'id',
        'template_id',
        'habit_id',
        'title',
        'order_index',
        'estimated_minutes',
        'created_at',
      ]),
    },
    {
      filename: 'weekly_reviews.csv',
      content: arrayToCsv(data.weeklyReviews || [], [
        'id',
        'week_start_date',
        'week_end_date',
        'status',
        'reflections',
        'metrics_snapshot',
        'next_week_plan',
        'committed_at',
        'created_at',
      ]),
    },
  ];
}

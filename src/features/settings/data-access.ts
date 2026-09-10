import { createClient } from '@/lib/supabase/server';
import {
  SettingsOverviewData,
  UserProfileSettings,
  UserAccountInfo,
  IntegrationStatus,
  NotificationPreferences,
  UserAccountabilityPreferences,
  ConsequenceDefinition,
} from '@/types/domain';

/**
 * Server-side data access layer for PACT Settings & Preferences.
 * Authoritatively retrieves user profile, auth account info,
 * accountability rules, and optional integration states.
 */
export async function getSettingsData(): Promise<SettingsOverviewData | null> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 2. Fetch user profile from public.profiles
  const { data: profileRecord } = await supabase
    .from('profiles')
    .select('id, full_name, timezone, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  const profile: UserProfileSettings = {
    id: user.id,
    fullName:
      profileRecord?.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === 'string' &&
        user.user_metadata.full_name.trim()) ||
      (typeof user.user_metadata?.name === 'string' &&
        user.user_metadata.name.trim()) ||
      'User',
    timezone:
      profileRecord?.timezone?.trim() ||
      (typeof user.user_metadata?.timezone === 'string' &&
        user.user_metadata.timezone.trim()) ||
      'UTC',
    createdAt: profileRecord?.created_at || user.created_at || new Date().toISOString(),
    updatedAt: profileRecord?.updated_at || new Date().toISOString(),
  };

  // 3. Determine Auth Provider and Account Info
  const appMetadata = user.app_metadata || {};
  const providerRaw =
    appMetadata.provider ||
    (Array.isArray(appMetadata.providers) && appMetadata.providers[0]) ||
    'email';

  const provider: 'email' | 'google' | 'other' =
    providerRaw === 'google'
      ? 'google'
      : providerRaw === 'email'
        ? 'email'
        : 'other';

  const account: UserAccountInfo = {
    email: user.email || null,
    provider,
    createdAt: user.created_at || null,
    lastSignInAt: user.last_sign_in_at || null,
  };

  // 4. Fetch User Accountability Preferences
  const { data: accPrefsRecord } = await supabase
    .from('user_accountability_preferences')
    .select('user_id, default_consequence_id, auto_apply_default, is_enabled, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const accountabilityPreferences: UserAccountabilityPreferences | null = accPrefsRecord
    ? {
        user_id: accPrefsRecord.user_id,
        default_consequence_id: accPrefsRecord.default_consequence_id,
        auto_apply_default: accPrefsRecord.auto_apply_default ?? false,
        is_enabled: accPrefsRecord.is_enabled ?? true,
        created_at: accPrefsRecord.created_at,
        updated_at: accPrefsRecord.updated_at,
      }
    : null;

  // 5. Fetch Consequence Definitions (for default rule selector)
  const { data: consequencesRecords } = await supabase
    .from('consequence_definitions')
    .select('id, user_id, title, description, consequence_type, action_statement, is_enabled, is_default, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const consequenceDefinitions: ConsequenceDefinition[] = (consequencesRecords || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    consequence_type: row.consequence_type,
    action_statement: row.action_statement,
    is_enabled: row.is_enabled,
    is_default: row.is_default,
    priority: 0,
    verification_type: 'custom',
    verification_config: {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  // 6. Integrations Status (Real Data Only: honest connection states)
  const integrationsMeta = (user.user_metadata?.integrations || {}) as Record<
    string,
    { connected?: boolean; handle?: string; lastSynced?: string }
  >;

  const integrations: IntegrationStatus[] = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Activity sync, commit count, PR submissions, and repository progress.',
      category: 'code',
      isConnected: Boolean(integrationsMeta.github?.connected),
      accountHandle: integrationsMeta.github?.handle || null,
      lastSyncedAt: integrationsMeta.github?.lastSynced || null,
    },
    {
      id: 'codeforces',
      name: 'Codeforces',
      description: 'Problem submissions, contest rating updates, and solved difficulty breakdown.',
      category: 'competitive_programming',
      isConnected: Boolean(integrationsMeta.codeforces?.connected),
      accountHandle: integrationsMeta.codeforces?.handle || null,
      lastSyncedAt: integrationsMeta.codeforces?.lastSynced || null,
    },
    {
      id: 'leetcode',
      name: 'LeetCode',
      description: 'Daily challenge streak, problem solves, and contest metrics.',
      category: 'competitive_programming',
      isConnected: Boolean(integrationsMeta.leetcode?.connected),
      accountHandle: integrationsMeta.leetcode?.handle || null,
      lastSyncedAt: integrationsMeta.leetcode?.lastSynced || null,
    },
  ];

  // 7. Notification Preferences (stored in user metadata or defaults)
  const notifMeta = (user.user_metadata?.notifications || {}) as Partial<NotificationPreferences>;
  const notifications: NotificationPreferences = {
    dailyPlanReminder: notifMeta.dailyPlanReminder ?? true,
    deadlineAlerts: notifMeta.deadlineAlerts ?? true,
    consequenceAlerts: notifMeta.consequenceAlerts ?? true,
    weeklyReviewNotice: notifMeta.weeklyReviewNotice ?? true,
  };

  return {
    profile,
    account,
    accountabilityPreferences,
    consequenceDefinitions,
    integrations,
    notifications,
  };
}

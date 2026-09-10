// PACT Core Domain TypeScript Type Definitions

export type GoalStatus = 'active' | 'completed' | 'archived';
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'missed' | 'archived';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  color_accent: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  goal_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline_at: string;
  completed_at: string | null;
  missed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string | null;
  target_date?: string | null;
}

export interface CreateProjectInput {
  title: string;
  goal_id?: string | null;
  description?: string | null;
  color_accent?: string | null;
}

export interface CreateTaskInput {
  title: string;
  deadline_at: string;
  project_id?: string | null;
  goal_id?: string | null;
  description?: string | null;
  priority?: TaskPriority;
  accountability_mode?: AccountabilityMode;
  consequence_id?: string | null;
}

// Phase 3 Accountability Domain Types
export type ConsequenceType =
  | 'personal_restriction'
  | 'extra_responsibility'
  | 'self_improvement'
  | 'reflection'
  | 'financial_declaration'
  | 'custom';

export type VerificationType =
  | 'timed_session'
  | 'task_completion'
  | 'written_reflection'
  | 'declaration'
  | 'github_commits'
  | 'github_pr'
  | 'leetcode_solve'
  | 'codeforces_solve'
  | 'external_proof'
  | 'custom';

export interface VerificationConfig {
  required_duration_seconds?: number;
  activity_prompt?: string;
  min_commits?: number;
  min_prs?: number;
  min_problems?: number;
  repository?: string;
  specific_slug?: string;
  min_rating?: number;
  [key: string]: unknown;
}

export type AccountabilityMode = 'default' | 'explicit' | 'none';
export type CommitmentStatus = 'committed' | 'activated' | 'fulfilled' | 'waived';
export type AccountabilitySessionStatus = 'started' | 'completed' | 'cancelled' | 'expired';

export interface ConsequenceSnapshot {
  title: string;
  consequence_type: ConsequenceType;
  action_statement: string;
  description: string | null;
  verification_type?: VerificationType;
  verification_config?: VerificationConfig;
}

export interface ConsequenceDefinition {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  consequence_type: ConsequenceType;
  action_statement: string;
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  verification_type: VerificationType;
  verification_config: VerificationConfig;
  created_at: string;
  updated_at: string;
}

export interface UserAccountabilityPreferences {
  user_id: string;
  default_consequence_id: string | null;
  auto_apply_default: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type AccountabilityEventType = 'activated' | 'fulfilled' | 'waived' | 'resolved';

export interface TaskAccountabilityCommitment {
  id: string;
  task_id: string;
  user_id: string;
  source_consequence_id: string | null;
  consequence_snapshot: ConsequenceSnapshot;
  commitment_status: CommitmentStatus;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountabilityEvent {
  id: string;
  user_id: string;
  task_id: string;
  commitment_id: string;
  event_type: AccountabilityEventType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AccountabilityVerificationSession {
  id: string;
  commitment_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  required_duration_seconds: number;
  actual_duration_seconds: number | null;
  status: AccountabilitySessionStatus;
  evidence_note: string | null;
  verification_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AccountabilityWaiver {
  id: string;
  commitment_id: string;
  user_id: string;
  task_id: string;
  waived_at: string;
  confirmation_token: string;
  waiver_week_year: number;
  waiver_week_number: number;
  waiver_count_in_week: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateConsequenceDefinitionInput {
  title: string;
  consequence_type: ConsequenceType;
  action_statement: string;
  description?: string | null;
  is_enabled?: boolean;
  is_default?: boolean;
  priority?: number;
  verification_type?: VerificationType;
  verification_config?: VerificationConfig;
}

export interface UpdateConsequenceDefinitionInput {
  title?: string;
  consequence_type?: ConsequenceType;
  action_statement?: string;
  description?: string | null;
  is_enabled?: boolean;
  is_default?: boolean;
  priority?: number;
  verification_type?: VerificationType;
  verification_config?: VerificationConfig;
}

export interface UpdateUserAccountabilityPreferencesInput {
  default_consequence_id?: string | null;
  auto_apply_default?: boolean;
  is_enabled?: boolean;
}

export interface FulfillWrittenReflectionInput {
  commitment_id: string;
  reflection_text: string;
}

export interface DeclareFulfillmentInput {
  commitment_id: string;
  declaration_statement: string;
}

export interface FulfillTaskCompletionInput {
  commitment_id: string;
  target_task_id: string;
}

export interface AccountabilityResolutionResult {
  success: boolean;
  code: string;
  verification_type?: VerificationType;
  is_self_declaration?: boolean;
  target_task_id?: string;
  data?: AccountabilityVerificationSession;
  error?: string;
}

// Phase 4E Calendar Event Domain Types
export type CalendarColorTag = 'gold' | 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  color_tag: CalendarColorTag;
  goal_id: string | null;
  project_id: string | null;
  task_id: string | null;
  google_event_id?: string | null;
  google_etag?: string | null;
  google_calendar_id?: string | null;
  is_external?: boolean;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventWithRelations extends CalendarEvent {
  projects?: { id: string; title: string } | null;
  goals?: { id: string; title: string } | null;
  tasks?: { id: string; title: string } | null;
}

export interface CreateCalendarEventInput {
  title: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  color_tag?: CalendarColorTag;
  goal_id?: string | null;
  project_id?: string | null;
  task_id?: string | null;
  google_event_id?: string | null;
  google_etag?: string | null;
  google_calendar_id?: string | null;
  is_external?: boolean;
}

export interface UpdateCalendarEventInput {
  title?: string;
  start_time?: string;
  end_time?: string;
  description?: string | null;
  color_tag?: CalendarColorTag;
  goal_id?: string | null;
  project_id?: string | null;
  task_id?: string | null;
  google_event_id?: string | null;
  google_etag?: string | null;
  google_calendar_id?: string | null;
  is_external?: boolean;
}

// Phase 5C Google Calendar Sync Domain Types
export type GoogleCalendarSyncStatus =
  | 'connected'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'revoked'
  | 'disconnected';

export interface GoogleCalendarIntegrationStatus {
  connected: boolean;
  sync_status: GoogleCalendarSyncStatus;
  calendar_id: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  has_refresh_token: boolean;
  is_token_valid: boolean;
}

export interface GoogleCalendarSyncSummary {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  deletedCount: number;
  exportedCount: number;
  pushedCount: number;
  errors: string[];
  syncToken?: string | null;
  timestamp: string;
}

// Phase 4I-2 Finance Domain Types
export type {
  TransactionType,
  FinanceColorTag,
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
} from '@/lib/money';
export type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@/lib/validations/finance';

// Phase 4I-3 Analytics Domain Types
export type {
  AnalyticsTimeRange,
  CompletionMetrics,
  ActivityTrendPoint,
  GoalProgressItem,
  ProjectProgressItem,
  RecordedSessionMetrics,
  AccountabilityAggregates,
  AnalyticsOverviewData,
} from '@/lib/analytics';

// Phase 4I-4 Settings Domain Types
export interface UserProfileSettings {
  id: string;
  fullName: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccountInfo {
  email: string | null;
  provider: 'email' | 'google' | 'other';
  createdAt: string | null;
  lastSignInAt: string | null;
}

export type IntegrationProviderId = 'github' | 'codeforces' | 'leetcode';

export interface IntegrationStatus {
  id: IntegrationProviderId;
  name: string;
  description: string;
  category: 'code' | 'competitive_programming';
  isConnected: boolean;
  accountHandle: string | null;
  lastSyncedAt: string | null;
}

export interface NotificationPreferences {
  dailyPlanReminder: boolean;
  deadlineAlerts: boolean;
  consequenceAlerts: boolean;
  weeklyReviewNotice: boolean;
}

export interface SettingsOverviewData {
  profile: UserProfileSettings;
  account: UserAccountInfo;
  accountabilityPreferences: UserAccountabilityPreferences | null;
  consequenceDefinitions: ConsequenceDefinition[];
  integrations: IntegrationStatus[];
  notifications: NotificationPreferences;
}

// Phase 5B Notification Domain Types
export * from './notifications';

// Phase 5D External Proof-of-Work Domain Types
export type ExternalProofProvider = 'github' | 'leetcode' | 'codeforces';

export interface ExternalProviderIntegration {
  id: string;
  user_id: string;
  provider: ExternalProofProvider;
  account_handle: string;
  provider_user_id: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  sync_status: 'connected' | 'syncing' | 'synced' | 'error' | 'revoked' | 'disconnected';
  last_verified_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExternalProofEvidence {
  id: string;
  commitment_id: string;
  user_id: string;
  provider: ExternalProofProvider;
  external_event_id: string;
  event_timestamp: string;
  evidence_type: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ExternalProofEvidenceItem {
  external_event_id: string;
  event_timestamp: string;
  evidence_type: 'commit' | 'pr' | 'accepted_submission' | 'contest_participation';
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface ExternalProofRuleResult {
  verified: boolean;
  code: 'VERIFIED' | 'RULE_NOT_SATISFIED' | 'NO_LINKED_ACCOUNT' | 'PROVIDER_UNAVAILABLE' | 'RATE_LIMITED' | 'WINDOW_EXPIRED';
  summary: string;
  provider: ExternalProofProvider;
  evidence: ExternalProofEvidenceItem[];
  checked_count: number;
  required_count: number;
  window_start: string;
  window_end: string;
  error?: string;
}



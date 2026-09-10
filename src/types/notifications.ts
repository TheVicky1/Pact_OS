/**
 * PACT Phase 5B: Notification Domain TypeScript Type Definitions
 */

export type NotificationType =
  | 'task_deadline_approaching'
  | 'task_missed'
  | 'accountability_activated'
  | 'verification_required'
  | 'verification_completed'
  | 'waiver_reset'
  | 'weekly_review'
  | 'system';

export interface PersistentNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  is_dismissed: boolean;
  dismissed_at: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url?: string | null;
  idempotency_key?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationActionResult<T = unknown> {
  success: boolean;
  code?: string;
  data?: T;
  error?: string;
}

export interface NotificationOverviewData {
  notifications: PersistentNotification[];
  unreadCount: number;
}

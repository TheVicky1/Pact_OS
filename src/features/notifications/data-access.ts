import { createClient } from '@/lib/supabase/server';
import { PersistentNotification, NotificationOverviewData } from '@/types/notifications';

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves recent non-dismissed notifications for the authenticated user,
 * along with the authoritative unread count.
 */
export async function getNotifications(
  limit: number = 20
): Promise<DataAccessResult<NotificationOverviewData>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    // 1. Fetch recent non-dismissed notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (notifError) {
      return { data: null, error: notifError.message };
    }

    // 2. Fetch unread count efficiently
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_dismissed', false);

    if (countError) {
      return { data: null, error: countError.message };
    }

    return {
      data: {
        notifications: (notifications || []) as PersistentNotification[],
        unreadCount: count || 0,
      },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: 'An unexpected error occurred while fetching notifications.',
    };
  }
}

/**
 * Retrieves the count of unread notifications for header badges.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return 0;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_dismissed', false);

    return count || 0;
  } catch {
    return 0;
  }
}

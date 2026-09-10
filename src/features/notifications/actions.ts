'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  NotificationActionResult,
  PersistentNotification,
  NotificationOverviewData,
} from '@/types/notifications';
import { getNotifications } from './data-access';

/**
 * Server Action: Mark a single notification as read.
 * Ownership is enforced server-side (user_id = user.id).
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult<PersistentNotification>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(notificationId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid notification identifier.' };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to update notification or access denied.' };
    }

    revalidatePath('/app');
    return { success: true, data: data as PersistentNotification };
  } catch {
    return { success: false, error: 'Unexpected error marking notification as read.' };
  }
}

/**
 * Server Action: Mark all non-dismissed notifications as read for the authenticated user.
 */
export async function markAllNotificationsReadAction(): Promise<NotificationActionResult<{ updatedCount: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const now = new Date().toISOString();

    const { error, count } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_dismissed', false);

    if (error) {
      return { success: false, error: 'Failed to mark notifications as read.' };
    }

    revalidatePath('/app');
    return { success: true, data: { updatedCount: count || 0 } };
  } catch {
    return { success: false, error: 'Unexpected error marking all notifications as read.' };
  }
}

/**
 * Server Action: Dismiss a notification.
 */
export async function dismissNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(notificationId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid notification identifier.' };
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('notifications')
      .update({
        is_dismissed: true,
        dismissed_at: now,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: 'Failed to dismiss notification or access denied.' };
    }

    revalidatePath('/app');
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error dismissing notification.' };
  }
}

/**
 * Server Action: Fetch current notifications list for dynamic client updates.
 */
export async function fetchNotificationsAction(
  limit: number = 20
): Promise<NotificationActionResult<NotificationOverviewData>> {
  try {
    const res = await getNotifications(limit);
    if (res.error || !res.data) {
      return { success: false, error: res.error || 'Failed to retrieve notifications.' };
    }
    return { success: true, data: res.data };
  } catch {
    return { success: false, error: 'Unexpected error fetching notifications.' };
  }
}

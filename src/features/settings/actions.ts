'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateAccountabilityPreferencesSchema,
  updateNotificationPreferencesSchema,
  UpdateProfileInput,
  UpdatePasswordInput,
  UpdateAccountabilityPreferencesInput,
  UpdateNotificationPreferencesInput,
} from '@/lib/validations/settings';

export interface SettingsActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

/**
 * Server Action: Update user profile name and IANA timezone
 */
export async function updateProfileAction(
  payload: UpdateProfileInput | FormData
): Promise<SettingsActionResult<{ fullName: string; timezone: string }>> {
  const rawData =
    payload instanceof FormData
      ? {
          fullName: payload.get('fullName'),
          timezone: payload.get('timezone'),
        }
      : payload;

  const validation = updateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Invalid profile information.',
    };
  }

  const { fullName, timezone } = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in again.' };
  }

  // 1. Update public.profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      timezone: timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: 'Failed to update profile record. Please try again.' };
  }

  // 2. Sync to auth user_metadata for consistent session retrieval
  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      timezone: timezone,
    },
  });

  // 3. Revalidate all temporal and profile-aware surfaces
  revalidatePath('/app/settings');
  revalidatePath('/app');
  revalidatePath('/app/planner');
  revalidatePath('/app/calendar');
  revalidatePath('/app/tasks');
  revalidatePath('/app/finance');
  revalidatePath('/app/analytics');

  return {
    success: true,
    data: { fullName, timezone },
  };
}

/**
 * Server Action: Update user password
 */
export async function updatePasswordAction(
  payload: UpdatePasswordInput | FormData
): Promise<SettingsActionResult> {
  const rawData =
    payload instanceof FormData
      ? {
          currentPassword: payload.get('currentPassword') || undefined,
          newPassword: payload.get('newPassword'),
          confirmPassword: payload.get('confirmPassword'),
        }
      : payload;

  const validation = updatePasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Invalid password details.',
    };
  }

  const { newPassword } = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in again.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      error: error.message || 'Failed to update password. Please try again.',
    };
  }

  revalidatePath('/app/settings');
  return { success: true };
}

/**
 * Server Action: Update accountability preferences
 */
export async function updateAccountabilityPreferencesAction(
  payload: UpdateAccountabilityPreferencesInput | FormData
): Promise<SettingsActionResult> {
  const rawData =
    payload instanceof FormData
      ? {
          defaultConsequenceId: payload.get('defaultConsequenceId') || null,
          autoApplyDefault: payload.get('autoApplyDefault') === 'true',
          isEnabled: payload.get('isEnabled') === 'true',
        }
      : payload;

  const validation = updateAccountabilityPreferencesSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message ||
        'Invalid accountability preferences.',
    };
  }

  const { defaultConsequenceId, autoApplyDefault, isEnabled } = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in again.' };
  }

  // Upsert into user_accountability_preferences
  const { error: upsertError } = await supabase
    .from('user_accountability_preferences')
    .upsert(
      {
        user_id: user.id,
        default_consequence_id: defaultConsequenceId || null,
        auto_apply_default: autoApplyDefault,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    return {
      error:
        'Failed to save accountability preferences. Please check your selected rule.',
    };
  }

  revalidatePath('/app/settings');
  revalidatePath('/app/accountability');
  revalidatePath('/app/tasks');
  return { success: true };
}

/**
 * Server Action: Update notification preferences
 */
export async function updateNotificationPreferencesAction(
  payload: UpdateNotificationPreferencesInput | FormData
): Promise<SettingsActionResult> {
  const rawData =
    payload instanceof FormData
      ? {
          dailyPlanReminder: payload.get('dailyPlanReminder') === 'true',
          deadlineAlerts: payload.get('deadlineAlerts') === 'true',
          consequenceAlerts: payload.get('consequenceAlerts') === 'true',
          weeklyReviewNotice: payload.get('weeklyReviewNotice') === 'true',
        }
      : payload;

  const validation = updateNotificationPreferencesSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message ||
        'Invalid notification preferences.',
    };
  }

  const notifications = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in again.' };
  }

  const { error } = await supabase.auth.updateUser({
    data: { notifications },
  });

  if (error) {
    return { error: 'Failed to update notification preferences.' };
  }

  revalidatePath('/app/settings');
  return { success: true };
}

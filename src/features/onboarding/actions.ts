'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  completeOnboardingSchema,
  CompleteOnboardingInput,
} from '@/lib/validations/onboarding';

import { OnboardingStep } from '@/types/domain';

export interface OnboardingActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

/**
 * Saves draft progress for a specific step (1 or 2) and advances/updates in-flight onboarding state.
 */
export async function saveOnboardingStepAction(
  step: OnboardingStep,
  payload: Record<string, unknown>
): Promise<OnboardingActionResult<{ nextStep: OnboardingStep }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in.' };
  }

  let validatedData: Record<string, unknown> = {};

  if (step === 1) {
    const parsed = onboardingStep1Schema.safeParse(payload);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid step 1 parameters' };
    }
    validatedData = parsed.data;

    // Immediately sync name & timezone to profile
    await supabase
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        timezone: parsed.data.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  } else if (step === 2) {
    const parsed = onboardingStep2Schema.safeParse(payload);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid step 2 parameters' };
    }
    validatedData = parsed.data;
  }

  // Fetch current onboarding_data to merge safely
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('onboarding_data')
    .eq('id', user.id)
    .maybeSingle();

  const currentData = (currentProfile?.onboarding_data as Record<string, unknown>) || {};
  const mergedData = { ...currentData, ...validatedData };
  const nextStep = (Math.min(3, step + 1) as OnboardingStep);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      onboarding_status: 'in_progress',
      onboarding_step: nextStep,
      onboarding_data: mergedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { error: 'Failed to persist onboarding state.' };
  }

  revalidatePath('/app/onboarding');
  return { success: true, data: { nextStep } };
}

/**
 * Skips a step or advances to the next step with default values.
 */
export async function skipOnboardingStepAction(
  step: OnboardingStep
): Promise<OnboardingActionResult<{ nextStep: OnboardingStep }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in.' };
  }

  const nextStep = (Math.min(3, step + 1) as OnboardingStep);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      onboarding_status: 'in_progress',
      onboarding_step: nextStep,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { error: 'Failed to update step.' };
  }

  revalidatePath('/app/onboarding');
  return { success: true, data: { nextStep } };
}

/**
 * Finalizes and completes the onboarding experience.
 * Applies final settings, creates optional starter goals/projects, and marks onboarding complete.
 */
export async function completeOnboardingAction(
  payload?: CompleteOnboardingInput
): Promise<OnboardingActionResult<{ redirectUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please sign in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_data, full_name, timezone')
    .eq('id', user.id)
    .maybeSingle();

  const draftData = (profile?.onboarding_data as Record<string, unknown>) || {};
  const mergedPayload = { ...draftData, ...(payload || {}) };

  const parsed = completeOnboardingSchema.safeParse(mergedPayload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid final configuration.' };
  }

  const finalName = parsed.data.fullName || profile?.full_name || 'PACT User';
  const finalTimezone = parsed.data.timezone || profile?.timezone || 'UTC';
  const nowIso = new Date().toISOString();

  // 1. Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: finalName,
      timezone: finalTimezone,
      onboarding_status: 'completed',
      onboarding_step: 3,
      onboarding_completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: 'Failed to complete onboarding. Please try again.' };
  }

  // 2. Sync to auth user_metadata
  await supabase.auth.updateUser({
    data: {
      full_name: finalName,
      timezone: finalTimezone,
      notifications: parsed.data.notificationPreferences || {
        dailyPlanReminder: true,
        deadlineAlerts: true,
        consequenceAlerts: true,
        weeklyReviewNotice: true,
      },
    },
  });

  // 3. Create starter goal if provided
  if (parsed.data.initialGoalTitle && parsed.data.initialGoalTitle.trim().length > 0) {
    const { data: newGoal } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: parsed.data.initialGoalTitle.trim(),
        status: 'active',
      })
      .select('id')
      .maybeSingle();

    // 4. Create starter project linked to goal if provided
    if (parsed.data.initialProjectTitle && parsed.data.initialProjectTitle.trim().length > 0) {
      await supabase.from('projects').insert({
        user_id: user.id,
        goal_id: newGoal?.id || null,
        title: parsed.data.initialProjectTitle.trim(),
        status: 'active',
      });
    }
  } else if (parsed.data.initialProjectTitle && parsed.data.initialProjectTitle.trim().length > 0) {
    await supabase.from('projects').insert({
      user_id: user.id,
      title: parsed.data.initialProjectTitle.trim(),
      status: 'active',
    });
  }

  // Revalidate entire application
  revalidatePath('/app');
  revalidatePath('/app/onboarding');
  revalidatePath('/app/settings');
  revalidatePath('/app/planner');
  revalidatePath('/app/tasks');

  return {
    success: true,
    data: { redirectUrl: '/app' },
  };
}

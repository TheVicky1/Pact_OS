import { createClient } from '@/lib/supabase/server';
import { OnboardingStatus, OnboardingStep } from '@/types/domain';


export interface UserOnboardingInfo {
  status: OnboardingStatus;
  step: OnboardingStep;
  data: Record<string, unknown>;
  completedAt: string | null;
  fullName: string;
  timezone: string;
}

/**
 * Retrieves the authoritative onboarding state for the currently authenticated user.
 */
export async function getOnboardingState(): Promise<UserOnboardingInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_status, onboarding_step, onboarding_data, onboarding_completed_at, full_name, timezone')
    .eq('id', user.id)
    .maybeSingle();

  const status: OnboardingStatus =
    (profile?.onboarding_status as OnboardingStatus) || 'not_started';
  const step: OnboardingStep =
    (Math.max(1, Math.min(3, profile?.onboarding_step || 1)) as OnboardingStep);
  const data = (profile?.onboarding_data as Record<string, unknown>) || {};
  const completedAt = profile?.onboarding_completed_at || null;
  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    '';
  const timezone =
    profile?.timezone ||
    (typeof user.user_metadata?.timezone === 'string' && user.user_metadata.timezone) ||
    'UTC';

  return {
    status,
    step,
    data,
    completedAt,
    fullName,
    timezone,
  };
}

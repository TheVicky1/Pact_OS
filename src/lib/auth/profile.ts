import { SupabaseClient } from '@supabase/supabase-js';
import { OnboardingStatus } from '@/types/domain';

export interface UserProfileInfo {
  fullName: string;
  timezone: string;
  onboardingStatus?: OnboardingStatus;
}

/**
 * Authoritatively retrieves user profile information (full_name, timezone, onboarding_status),
 * checking the public.profiles database table first, then falling back to
 * auth user_metadata, and finally defaulting to safe canonical fallbacks.
 */
export async function getUserProfileInfo(
  supabase: SupabaseClient,
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<UserProfileInfo> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, timezone, onboarding_status')
    .eq('id', userId)
    .maybeSingle();

  const fullName =
    (profile?.full_name && profile.full_name.trim()) ||
    (typeof userMetadata?.full_name === 'string' && userMetadata.full_name.trim()) ||
    (typeof userMetadata?.name === 'string' && userMetadata.name.trim()) ||
    'User';

  const timezone =
    (profile?.timezone && profile.timezone.trim()) ||
    (typeof userMetadata?.timezone === 'string' && userMetadata.timezone.trim()) ||
    'UTC';

  const onboardingStatus = (profile?.onboarding_status as OnboardingStatus) || 'completed';

  return { fullName, timezone, onboardingStatus };
}


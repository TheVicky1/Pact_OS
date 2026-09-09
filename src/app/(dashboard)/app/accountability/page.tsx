import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserProfileInfo } from '@/lib/auth/profile';
import {
  getActivatedCommitments,
  getWeeklyWaiverUsage,
  getAccountabilityHistory,
} from '@/features/accountability/data-access';
import { AccountabilityView } from '@/features/accountability/components/accountability-view';

export const metadata = {
  title: 'Accountability & Verification | PACT OS',
  description: 'Manage active accountability interventions and review verified history.',
};

export default async function AccountabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { timezone } = await getUserProfileInfo(supabase, user.id, user.user_metadata);

  const [activatedCommitments, waiverUsage, historyEvents] = await Promise.all([
    getActivatedCommitments(),
    getWeeklyWaiverUsage(timezone),
    getAccountabilityHistory(),
  ]);

  return (
    <AccountabilityView
      activatedCommitments={activatedCommitments}
      waiverUsage={waiverUsage}
      historyEvents={historyEvents}
      timezone={timezone}
    />
  );
}

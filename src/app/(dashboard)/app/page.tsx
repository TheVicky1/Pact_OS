import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGoals } from '@/features/goals/data-access';
import { getProjects } from '@/features/projects/data-access';
import { getTasks } from '@/features/tasks/data-access';
import { OverviewView } from '@/features/dashboard/components/overview-view';
import { getUserProfileInfo } from '@/lib/auth/profile';

import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Overview | PACT OS',
  description: 'Personal productivity, commitments, and progress operating system.',
};

export default async function ProtectedAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ fullName, timezone, onboardingStatus }, { data: goals }, { data: projects }, { data: tasks }] = await Promise.all([
    getUserProfileInfo(supabase, user.id, user.user_metadata),
    getGoals(),
    getProjects(),
    getTasks(),
  ]);

  if (onboardingStatus && onboardingStatus !== 'completed') {
    redirect('/app/onboarding');
  }

  const { getActivatedCommitments, getWeeklyWaiverUsage } = await import('@/features/accountability/data-access');
  const [activatedCommitments, waiverUsage] = await Promise.all([
    getActivatedCommitments(),
    getWeeklyWaiverUsage(timezone),
  ]);

  return (
    <PageContainer as="main">
      <OverviewView
        goals={goals || []}
        projects={projects || []}
        tasks={tasks || []}
        userName={fullName}
        timezone={timezone}
        activatedCommitments={activatedCommitments}
        waiverUsage={waiverUsage}
      />
    </PageContainer>
  );
}


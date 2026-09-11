import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserProfileInfo } from '@/lib/auth/profile';
import { getLocalDateString } from '@/lib/time';
import { getAnalyticsOverview } from '@/features/analytics/data-access';
import { AnalyticsWorkspace } from '@/features/analytics';
import {
  getGitHubActivitySummaryAction,
  getLeetCodeActivitySummaryAction,
  getCodeforcesActivitySummaryAction,
} from '@/features/integrations';
import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Analytics | PACT OS',
  description: 'Factual progress analytics, commitment completion rates, goal and project tracking, and external proof-of-work synchronization.',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { timezone } = await getUserProfileInfo(supabase, user.id, user.user_metadata);
  const todayStr = getLocalDateString(new Date(), timezone);

  const [overviewRes, gitHubRes, leetCodeRes, codeforcesRes] = await Promise.all([
    getAnalyticsOverview('week', todayStr, timezone),
    getGitHubActivitySummaryAction(false),
    getLeetCodeActivitySummaryAction(false),
    getCodeforcesActivitySummaryAction(false),
  ]);

  const initialOverview = overviewRes.data;

  const fallbackData = {
    timeRange: 'week' as const,
    anchorDateStr: todayStr,
    periodLabel: 'This Week',
    startDateStr: todayStr,
    endDateStr: todayStr,
    completionMetrics: {
      completedCount: 0,
      missedCount: 0,
      pendingCount: 0,
      totalResolved: 0,
      completionRate: null,
    },
    activityTrends: [],
    goalsProgress: [],
    projectsProgress: [],
    sessionMetrics: {
      totalSeconds: 0,
      formattedDuration: '0m',
      sessionCount: 0,
    },
    accountabilityAggregates: {
      totalActivated: 0,
      totalFulfilled: 0,
      totalWaived: 0,
      totalPendingResolution: 0,
    },
    factualObservations: ['No activity recorded yet for this period.'],
  };

  return (
    <PageContainer as="main">
      <AnalyticsWorkspace
        initialData={initialOverview || fallbackData}
        userTimeZone={timezone}
        initialGitHubActivity={gitHubRes}
        initialLeetCodeActivity={leetCodeRes}
        initialCodeforcesActivity={codeforcesRes}
      />
    </PageContainer>
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserProfileInfo } from '@/lib/auth/profile';
import { getLocalDateString } from '@/lib/time';
import { getAnalyticsOverview } from '@/features/analytics/data-access';
import { AnalyticsWorkspace, ProofOfWorkPlatform } from '@/features/analytics';
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

interface AnalyticsPageProps {
  searchParams?: Promise<{ platform?: string }>;
}

export default async function AnalyticsPage(props: AnalyticsPageProps) {
  const searchParams = await props.searchParams;
  const rawPlatform = searchParams?.platform?.toLowerCase();
  const initialPlatform: ProofOfWorkPlatform | undefined =
    rawPlatform === 'github' || rawPlatform === 'leetcode' || rawPlatform === 'codeforces'
      ? rawPlatform
      : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const {

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWeeklyReviewBootstrapData } from '@/features/weekly-review/data-access';
import { WeeklyReviewWorkspace } from '@/features/weekly-review/components/weekly-review-workspace';
import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Weekly Review & Sunday Ritual | PACT OS',
  description: 'Deterministic weekly review, accountability audit, cleanup, and next-week planning ritual.',
};

interface ReviewPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function WeeklyReviewPage({ searchParams }: ReviewPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const data = await getWeeklyReviewBootstrapData({
    weekStart: resolvedParams.week,
  });

  if (!data) {
    redirect('/login');
  }

  return (
    <PageContainer as="main">
      <WeeklyReviewWorkspace initialData={data} />
    </PageContainer>
  );
}

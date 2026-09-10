import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getHabitsBootstrapData } from '@/features/habits/data-access';
import { HabitsWorkspace } from '@/features/habits/components/habits-workspace';
import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Habits & Routines | PACT OS',
  description: 'Deterministic habit tracking, daily routines, and streak continuity.',
};

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await getHabitsBootstrapData();

  if (!data) {
    redirect('/login');
  }

  return (
    <PageContainer as="main">
      <HabitsWorkspace initialData={data} />
    </PageContainer>
  );
}

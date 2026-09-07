import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGoals } from '@/features/goals/data-access';
import { getProjects } from '@/features/projects/data-access';
import { getTasks } from '@/features/tasks/data-access';
import { OverviewView } from '@/features/dashboard/components/overview-view';

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

  const fullName = user.user_metadata?.full_name || 'User';
  const timezone = user.user_metadata?.timezone || 'UTC';

  const [{ data: goals }, { data: projects }, { data: tasks }] = await Promise.all([
    getGoals(),
    getProjects(),
    getTasks(),
  ]);

  return (
    <main className="max-w-6xl w-full mx-auto p-4 sm:p-8">
      <OverviewView
        goals={goals || []}
        projects={projects || []}
        tasks={tasks || []}
        userName={fullName}
        timezone={timezone}
      />
    </main>
  );
}


import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTasks } from '@/features/tasks/data-access';
import { getGoals } from '@/features/goals/data-access';
import { getProjects } from '@/features/projects/data-access';
import { TasksView } from '@/features/tasks/components/tasks-view';
import { getUserProfileInfo } from '@/lib/auth/profile';

import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Tasks & Commitments | PACT OS',
  description: 'Manage your tasks and commitments tied to your goals and projects.',
};

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ timezone }, tasksRes, goalsRes, projectsRes] = await Promise.all([
    getUserProfileInfo(supabase, user.id, user.user_metadata),
    getTasks(),
    getGoals(),
    getProjects(),
  ]);

  const tasks = tasksRes.data || [];
  const goals = (goalsRes.data || []).map((g) => ({ id: g.id, title: g.title }));
  const projects = (projectsRes.data || []).map((p) => ({ id: p.id, title: p.title }));

  return (
    <PageContainer as="main">
      <TasksView
        initialTasks={tasks}
        availableGoals={goals}
        availableProjects={projects}
        timezone={timezone}
      />
    </PageContainer>
  );
}


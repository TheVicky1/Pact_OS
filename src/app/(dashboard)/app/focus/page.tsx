import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveFocusSession, getFocusHistory } from '@/features/focus/data-access';
import { getTasks } from '@/features/tasks/data-access';
import { FocusWorkspace } from '@/features/focus/components/focus-workspace';
import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Focus & Deep Work | PACT OS',
  description: 'Deterministic focus timer and deep work session tracking.',
};

export default async function FocusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [activeRes, historyRes, tasksRes] = await Promise.all([
    getActiveFocusSession(),
    getFocusHistory(30),
    getTasks(),
  ]);

  const availableTasks = (tasksRes.data || [])
    .filter((t) => t.status === 'pending' || t.status === 'in_progress')
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
    }));

  return (
    <PageContainer as="main">
      <FocusWorkspace
        initialActiveSession={activeRes.data}
        initialHistory={historyRes.data || []}
        availableTasks={availableTasks}
      />
    </PageContainer>
  );
}

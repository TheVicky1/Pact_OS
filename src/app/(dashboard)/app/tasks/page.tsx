import { getTasks } from '@/features/tasks/data-access';
import { getGoals } from '@/features/goals/data-access';
import { getProjects } from '@/features/projects/data-access';
import { TasksView } from '@/features/tasks/components/tasks-view';

export const metadata = {
  title: 'Tasks & Commitments | PACT OS',
  description: 'Manage your tasks and commitments tied to your goals and projects.',
};

export default async function TasksPage() {
  const [tasksRes, goalsRes, projectsRes] = await Promise.all([
    getTasks(),
    getGoals(),
    getProjects(),
  ]);

  const tasks = tasksRes.data || [];
  const goals = (goalsRes.data || []).map((g) => ({ id: g.id, title: g.title }));
  const projects = (projectsRes.data || []).map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <TasksView
        initialTasks={tasks}
        availableGoals={goals}
        availableProjects={projects}
      />
    </div>
  );
}

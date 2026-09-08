import { getProjects } from '@/features/projects/data-access';
import { getGoals } from '@/features/goals/data-access';
import { ProjectsView } from '@/features/projects/components/projects-view';

export const metadata = {
  title: 'Projects | PACT',
  description: 'Manage structured initiatives and project streams in PACT.',
};

export default async function ProjectsPage() {
  const [{ data: projects, error: projectsErr }, { data: goals }] = await Promise.all([
    getProjects(),
    getGoals(),
  ]);

  return (
    <main className="max-w-6xl w-full mx-auto p-4 sm:p-8">
      <ProjectsView
        initialProjects={projects || []}
        availableGoals={goals || []}
        error={projectsErr}
      />
    </main>
  );
}


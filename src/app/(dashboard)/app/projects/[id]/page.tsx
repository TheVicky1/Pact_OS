import { notFound } from 'next/navigation';
import { getProjectById, getProjectTasks } from '@/features/projects/data-access';
import { getGoals } from '@/features/goals/data-access';
import { ProjectDetailView } from '@/features/projects/components/project-detail-view';
import type { Metadata } from 'next';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generates dynamic page metadata using the project title.
 * Falls back gracefully if the project is not found or auth fails.
 */
export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: project } = await getProjectById(id);
  return {
    title: project ? `${project.title} | PACT` : 'Project | PACT',
    description: project?.description ?? 'View and manage your PACT project.',
  };
}

/**
 * Project Detail page — server component.
 *
 * Fetches project data, tasks, and available goals in parallel.
 * Security: getProjectById uses RLS to enforce ownership. If the project
 * does not exist or belongs to another user, returns null → notFound().
 * getProjectTasks only selects display-safe task fields (no accountability data).
 */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const [{ data: project, error: projectError }, { data: tasks }, { data: goals }] =
    await Promise.all([getProjectById(id), getProjectTasks(id), getGoals()]);

  // RLS will return null for cross-user or nonexistent projects.
  if (projectError || !project) {
    notFound();
  }

  return (
    <main className="max-w-5xl w-full mx-auto p-4 sm:p-8">
      <ProjectDetailView
        project={project}
        tasks={tasks ?? []}
        availableGoals={goals ?? []}
      />
    </main>
  );
}

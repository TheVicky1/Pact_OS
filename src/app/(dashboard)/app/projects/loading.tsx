import { ProjectsSkeleton } from '@/features/projects/components/projects-skeleton';

export default function ProjectsLoading() {
  return (
    <main className="max-w-6xl w-full mx-auto p-4 sm:p-8">
      <ProjectsSkeleton />
    </main>
  );
}

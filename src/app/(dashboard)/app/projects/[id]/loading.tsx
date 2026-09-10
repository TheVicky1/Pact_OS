import { ProjectDetailSkeleton } from '@/features/projects/components/project-detail-skeleton';

export default function ProjectDetailLoading() {
  return (
    <main className="max-w-5xl w-full mx-auto p-4 sm:p-8">
      <ProjectDetailSkeleton />
    </main>
  );
}

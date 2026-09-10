import { GoalsSkeleton } from '@/features/goals/components/goals-skeleton';

export default function GoalsLoading() {
  return (
    <main className="max-w-6xl w-full mx-auto p-4 sm:p-8">
      <GoalsSkeleton />
    </main>
  );
}

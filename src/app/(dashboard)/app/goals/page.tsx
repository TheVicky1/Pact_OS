import { getGoals } from '@/features/goals/data-access';
import { GoalsView } from '@/features/goals/components/goals-view';

export const metadata = {
  title: 'Goals | PACT',
  description: 'Manage long-term objectives and commitments in PACT.',
};

export default async function GoalsPage() {
  const { data: goals, error } = await getGoals();

  return (
    <main className="max-w-6xl w-full mx-auto p-4 sm:p-8">
      <GoalsView initialGoals={goals || []} error={error} />
    </main>
  );
}


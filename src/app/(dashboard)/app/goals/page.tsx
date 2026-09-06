import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGoals } from '@/features/goals/data-access';
import { GoalsView } from '@/features/goals/components/goals-view';
import { AppHeader } from '@/components/ui/app-header';

export const metadata = {
  title: 'Goals | PACT',
  description: 'Manage long-term objectives and commitments in PACT.',
};

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const timezone = user.user_metadata?.timezone || 'UTC';
  const { data: goals, error } = await getGoals();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <AppHeader timezone={timezone} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        <GoalsView initialGoals={goals || []} error={error} />
      </main>
    </div>
  );
}

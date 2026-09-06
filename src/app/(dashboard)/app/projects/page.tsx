import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjects } from '@/features/projects/data-access';
import { getGoals } from '@/features/goals/data-access';
import { ProjectsView } from '@/features/projects/components/projects-view';
import { AppHeader } from '@/components/ui/app-header';

export const metadata = {
  title: 'Projects | PACT',
  description: 'Manage structured initiatives and project streams in PACT.',
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const timezone = user.user_metadata?.timezone || 'UTC';

  const [{ data: projects, error: projectsErr }, { data: goals }] = await Promise.all([
    getProjects(),
    getGoals(),
  ]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <AppHeader timezone={timezone} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        <ProjectsView
          initialProjects={projects || []}
          availableGoals={goals || []}
          error={projectsErr}
        />
      </main>
    </div>
  );
}

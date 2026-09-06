import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/ui/app-header';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, ShieldCheck, Target, FolderKanban, ArrowRight } from 'lucide-react';
import { getGoals } from '@/features/goals/data-access';
import { getProjects } from '@/features/projects/data-access';

export const metadata = {
  title: 'Dashboard | PACT',
  description: 'PACT Personal Operating System Dashboard',
};

export default async function ProtectedAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email || 'Authenticated User';
  const fullName = user.user_metadata?.full_name || 'User';
  const timezone = user.user_metadata?.timezone || 'UTC';

  const [{ data: goals }, { data: projects }] = await Promise.all([
    getGoals(),
    getProjects(),
  ]);

  const activeGoalsCount = goals ? goals.filter((g) => g.status === 'active').length : 0;
  const activeProjectsCount = projects ? projects.filter((p) => p.status === 'active').length : 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <AppHeader timezone={timezone} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 flex flex-col items-center justify-center space-y-8">
        <div className="w-full glass-card p-8 rounded-3xl border border-zinc-800/80 max-w-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto text-[#d4af37]">
            <User className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-medium text-emerald-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authenticated Session Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Welcome, {fullName}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">{userEmail}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Goals Slice Overview Card */}
            <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Goals</h3>
                  <p className="text-xs text-zinc-400">
                    {activeGoalsCount} active {activeGoalsCount === 1 ? 'objective' : 'objectives'}
                  </p>
                </div>
              </div>

              <Link
                href="/app/goals"
                className="inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors border border-zinc-800 cursor-pointer"
              >
                <span>Manage Goals</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
              </Link>
            </div>

            {/* Projects Slice Overview Card */}
            <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Projects</h3>
                  <p className="text-xs text-zinc-400">
                    {activeProjectsCount} active {activeProjectsCount === 1 ? 'initiative' : 'initiatives'}
                  </p>
                </div>
              </div>

              <Link
                href="/app/projects"
                className="inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors border border-zinc-800 cursor-pointer"
              >
                <span>Manage Projects</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
              </Link>
            </div>
          </div>

          <div className="pt-2 text-xs text-zinc-500">
            Phase 2C Vertical Slice Operational • Real Database RLS & Cross-User Goal Authorization Enforced
          </div>
        </div>
      </main>
    </div>
  );
}

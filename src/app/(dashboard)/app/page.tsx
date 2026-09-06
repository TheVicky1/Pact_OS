import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/ui/app-header';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, ShieldCheck, Target, ArrowRight } from 'lucide-react';
import { getGoals } from '@/features/goals/data-access';

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

  const { data: goals } = await getGoals();
  const activeGoalsCount = goals ? goals.filter((g) => g.status === 'active').length : 0;

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

          {/* Goals Slice Overview Card */}
          <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800 text-left flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Goals Module</h3>
                <p className="text-xs text-zinc-400">
                  {activeGoalsCount} active long-term {activeGoalsCount === 1 ? 'objective' : 'objectives'}
                </p>
              </div>
            </div>

            <Link
              href="/app/goals"
              className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors border border-zinc-700/80 cursor-pointer shrink-0"
            >
              <span>Manage Goals</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
            </Link>
          </div>

          <div className="pt-2 text-xs text-zinc-500">
            Phase 2B Vertical Slice Operational • Real Database RLS Enforced
          </div>
        </div>
      </main>
    </div>
  );
}

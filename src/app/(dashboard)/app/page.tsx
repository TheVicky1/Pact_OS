import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/features/auth/actions';
import { PactLogo } from '@/components/brand/pact-logo';
import { redirect } from 'next/navigation';
import { User, ShieldCheck, LogOut, Clock, Globe } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Application Header */}
      <header className="w-full border-b border-zinc-800/80 bg-[#121217]/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <PactLogo size="md" />

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Timezone: {timezone}</span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Application Shell Foundation */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 flex flex-col items-center justify-center">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Session ID</span>
              </div>
              <p className="text-xs font-mono text-zinc-300 truncate">{user.id}</p>
            </div>

            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Configured Timezone</span>
              </div>
              <p className="text-xs font-mono text-zinc-300">{timezone}</p>
            </div>
          </div>

          <div className="pt-2 text-xs text-zinc-500">
            Phase 1 Foundation Operational • Protected Server Authorization Enforced
          </div>
        </div>
      </main>
    </div>
  );
}

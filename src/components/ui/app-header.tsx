'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PactLogo } from '@/components/brand/pact-logo';
import { signOutAction } from '@/features/auth/actions';
import { LogOut, Globe, Target, LayoutDashboard } from 'lucide-react';

interface AppHeaderProps {
  timezone?: string;
}

export function AppHeader({ timezone = 'UTC' }: AppHeaderProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/app';
  const isGoalsActive = pathname === '/app/goals' || pathname.startsWith('/app/goals/');

  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#121217]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6 sm:gap-8">
        <Link href="/app" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-lg">
          <PactLogo size="sm" />
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/app"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDashboardActive
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/app/goals"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isGoalsActive
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Goals</span>
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{timezone}</span>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </form>
      </div>
    </header>
  );
}

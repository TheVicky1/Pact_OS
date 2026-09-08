'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PactLogo } from '@/components/brand/pact-logo';
import { signOutAction } from '@/features/auth/actions';
import { LogOut, Target, FolderKanban, LayoutDashboard, CheckSquare, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface AppHeaderProps {
  timezone?: string;
  userName?: string;
}

export function AppHeader({ userName }: AppHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboardActive = pathname === '/app';
  const isGoalsActive = pathname === '/app/goals' || pathname.startsWith('/app/goals/');
  const isProjectsActive = pathname === '/app/projects' || pathname.startsWith('/app/projects/');
  const isTasksActive = pathname === '/app/tasks' || pathname.startsWith('/app/tasks/');

  const navItems = [
    {
      href: '/app',
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: isDashboardActive,
    },
    {
      href: '/app/goals',
      label: 'Goals',
      icon: Target,
      isActive: isGoalsActive,
    },
    {
      href: '/app/projects',
      label: 'Projects',
      icon: FolderKanban,
      isActive: isProjectsActive,
    },
    {
      href: '/app/tasks',
      label: 'Tasks',
      icon: CheckSquare,
      isActive: isTasksActive,
    },
  ];

  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#0d0d12]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/app"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-xl transition-all"
          >
            <PactLogo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden sm:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
                    item.isActive
                      ? 'bg-zinc-800/90 text-zinc-100 border border-[#d4af37]/40 shadow-sm shadow-[#d4af37]/10 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-[#d4af37]' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {userName && (
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800/60 px-2.5 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium truncate max-w-[120px]">{userName}</span>
            </div>
          )}

          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-zinc-800 bg-[#09090b]/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    item.isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-[#d4af37]/40 text-[#d4af37]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#d4af37]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {userName && (
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end text-xs text-zinc-400 px-1">
              <span className="text-zinc-300 font-medium">{userName}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}


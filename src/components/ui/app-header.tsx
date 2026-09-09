'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PactLogo } from '@/components/brand/pact-logo';
import { signOutAction } from '@/features/auth/actions';
import {
  LayoutDashboard,
  Target,
  FolderKanban,
  CheckSquare,
  LogOut,
  Bell,
  Menu,
  X,
  User,
  ShieldAlert,
} from 'lucide-react';

export interface AppHeaderProps {
  timezone?: string;
  userName?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}

/**
 * PACT Application Header
 * Redesigned in Phase 4C with cinematic glass styling, subtle active underline indicator,
 * user identity pill, and accessible responsive drawer navigation.
 */
export function AppHeader({ userName }: AppHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboardActive = pathname === '/app';
  const isGoalsActive = pathname === '/app/goals' || pathname.startsWith('/app/goals/');
  const isProjectsActive = pathname === '/app/projects' || pathname.startsWith('/app/projects/');
  const isTasksActive = pathname === '/app/tasks' || pathname.startsWith('/app/tasks/');
  const isAccountabilityActive = pathname === '/app/accountability' || pathname.startsWith('/app/accountability/');

  const navItems: NavItem[] = [
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
    {
      href: '/app/accountability',
      label: 'Accountability',
      icon: ShieldAlert,
      isActive: isAccountabilityActive,
    },
  ];

  // Close mobile drawer on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    },
    [isMobileMenuOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const userInitial = userName?.trim().charAt(0).toUpperCase() || null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#09090b]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Official Logo & Desktop Navigation */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href="/app"
            className="focus-visible:outline-none rounded-xl transition-opacity hover:opacity-90 flex-shrink-0"
            aria-label="PACT Home"
          >
            <PactLogo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium transition-colors focus-visible:outline-none rounded-lg flex items-center gap-2 ${
                  item.isActive
                    ? 'text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <item.icon
                  className={`w-4 h-4 transition-colors ${
                    item.isActive ? 'text-[#d4af37]' : 'text-zinc-400'
                  }`}
                />
                <span>{item.label}</span>

                {/* Visual North Star Underline Indicator */}
                {item.isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[19px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full shadow-sm shadow-[#d4af37]/30"
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section: Utilities & User Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification Bell (from North Star) */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors focus-visible:outline-none cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          </button>

          {/* User Profile Area */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.06]">
            {userName && (
              <div className="hidden sm:flex items-center gap-2.5 bg-zinc-900/60 border border-white/[0.06] pl-1.5 pr-3 py-1 rounded-full text-xs text-zinc-200 shadow-sm">
                {/* User Avatar Circle */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e1e28] to-[#121217] border border-[#d4af37]/40 flex items-center justify-center font-semibold text-[11px] text-[#e2c056] shadow-sm">
                  {userInitial ? userInitial : <User className="w-3 h-3 text-[#d4af37]" />}
                </div>
                <span className="font-medium truncate max-w-[130px] select-none">{userName}</span>
              </div>
            )}

            {/* Sign Out Action */}
            <form action={signOutAction} className="inline-flex">
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/[0.06] px-3 py-1.5 rounded-xl transition-all cursor-pointer focus-visible:outline-none"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-xl focus-visible:outline-none cursor-pointer transition-colors"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#09090b]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? 'page' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  item.isActive
                    ? 'bg-[#121217] text-zinc-100 border border-[#d4af37]/40 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <item.icon
                  className={`w-4 h-4 ${item.isActive ? 'text-[#d4af37]' : 'text-zinc-400'}`}
                />
                <span>{item.label}</span>
                {item.isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                )}
              </Link>
            ))}
          </nav>

          {userName && (
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between px-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-[#d4af37]/30 flex items-center justify-center font-medium text-[10px] text-[#e2c056]">
                  {userInitial || 'U'}
                </div>
                <span className="text-zinc-300 font-medium truncate max-w-[180px]">{userName}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

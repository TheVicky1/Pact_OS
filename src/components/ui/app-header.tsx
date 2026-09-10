'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PactLogo } from '@/components/brand/pact-logo';
import { signOutAction } from '@/features/auth/actions';
import { NotificationPopover } from '@/components/ui/notification-popover';
import { useCommandCenter } from '@/features/command-center';
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
  Calendar as CalendarIcon,
  Timer as TimerIcon,
  Wallet,
  TrendingUp,
  Settings as SettingsIcon,
  Search,
  BookOpen,
  Repeat,
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
 * Redesigned in Phase 4C & Phase 6A with cinematic glass styling, subtle active underline indicator,
 * global Command Center trigger, user identity pill, and accessible responsive drawer navigation.
 */
export function AppHeader({ userName }: AppHeaderProps) {
  const pathname = usePathname();
  const { openCommandCenter } = useCommandCenter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isDashboardActive = pathname === '/app';
  const isReviewActive = pathname === '/app/review' || pathname.startsWith('/app/review/');
  const isFocusActive = pathname === '/app/focus' || pathname.startsWith('/app/focus/');
  const isHabitsActive = pathname === '/app/habits' || pathname.startsWith('/app/habits/');
  const isGoalsActive = pathname === '/app/goals' || pathname.startsWith('/app/goals/');
  const isProjectsActive = pathname === '/app/projects' || pathname.startsWith('/app/projects/');
  const isTasksActive = pathname === '/app/tasks' || pathname.startsWith('/app/tasks/');
  const isAccountabilityActive = pathname === '/app/accountability' || pathname.startsWith('/app/accountability/');
  const isFinanceActive = pathname === '/app/finance' || pathname.startsWith('/app/finance/');
  const isAnalyticsActive = pathname === '/app/analytics' || pathname.startsWith('/app/analytics/');
  const isCalendarActive =
    pathname === '/app/calendar' ||
    pathname.startsWith('/app/calendar/') ||
    pathname === '/app/planner' ||
    pathname.startsWith('/app/planner/');

  const navItems: NavItem[] = [
    {
      href: '/app',
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: isDashboardActive,
    },
    {
      href: '/app/review',
      label: 'Review',
      icon: BookOpen,
      isActive: isReviewActive,
    },
    {
      href: '/app/habits',
      label: 'Habits',
      icon: Repeat,
      isActive: isHabitsActive,
    },
    {
      href: '/app/focus',
      label: 'Focus',
      icon: TimerIcon,
      isActive: isFocusActive,
    },
    {
      href: '/app/planner',
      label: 'Planner',
      icon: CalendarIcon,
      isActive: isCalendarActive,
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
      href: '/app/finance',
      label: 'Finance',
      icon: Wallet,
      isActive: isFinanceActive,
    },
    {
      href: '/app/analytics',
      label: 'Analytics',
      icon: TrendingUp,
      isActive: isAnalyticsActive,
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
        <div className="flex items-center gap-8 lg:gap-10">
          <Link
            href="/app"
            className="focus-visible:outline-none rounded-xl transition-opacity hover:opacity-90 flex-shrink-0"
            aria-label="PACT Home"
          >
            <PactLogo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 lg:gap-7">
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

        {/* Right Section: Command Center, Utilities & User Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Desktop Command Center Search Trigger */}
          <button
            type="button"
            onClick={openCommandCenter}
            aria-label="Open Command Center (Cmd+K / Ctrl+K)"
            className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.08] hover:border-white/[0.15] text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-sm group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/50"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
            <span className="font-normal text-zinc-400">Search or jump to...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded">
              ⌘K
            </kbd>
          </button>

          {/* Mobile / Tablet Quick Search Icon Button */}
          <button
            type="button"
            onClick={openCommandCenter}
            aria-label="Open Command Center"
            className="lg:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded-xl focus-visible:outline-none cursor-pointer transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Bell with Popover Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={isNotificationOpen}
              className={`relative p-2 rounded-full transition-colors focus-visible:outline-none cursor-pointer ${
                isNotificationOpen
                  ? 'bg-white/[0.1] text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  data-testid="notification-unread-dot"
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4af37] ring-2 ring-[#09090b] animate-pulse"
                />
              )}
            </button>

            {/* Interactive Popover */}
            <NotificationPopover
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onUnreadCountChange={setUnreadCount}
            />
          </div>

          {/* User Profile Area */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
            {userName && (
              <div className="hidden sm:flex items-center gap-2.5 bg-zinc-900/60 border border-white/[0.06] pl-1.5 pr-3 py-1 rounded-full text-xs text-zinc-200 shadow-sm">
                {/* User Avatar Circle */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e1e28] to-[#121217] border border-[#d4af37]/40 flex items-center justify-center font-semibold text-[11px] text-[#e2c056] shadow-sm">
                  {userInitial ? userInitial : <User className="w-3 h-3 text-[#d4af37]" />}
                </div>
                <span className="font-medium truncate max-w-[130px] select-none">{userName}</span>
              </div>
            )}

            {/* Settings Link */}
            <Link
              href="/app/settings"
              aria-label="Settings and Preferences"
              className={`p-2 rounded-xl border border-white/[0.06] transition-all focus-visible:outline-none cursor-pointer ${
                pathname.startsWith('/app/settings')
                  ? 'bg-[#121217] text-[#e2c056] border-[#d4af37]/40 shadow-sm'
                  : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

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
          {/* Mobile Command Palette Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              openCommandCenter();
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium bg-zinc-900/80 border border-white/[0.08] text-zinc-200 hover:bg-white/[0.06] transition-all min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-[#d4af37]" />
              <span>Command Palette</span>
            </div>
            <kbd className="px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded">
              ⌘K
            </kbd>
          </button>

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

            {/* Mobile Settings Link */}
            <Link
              href="/app/settings"
              aria-current={pathname.startsWith('/app/settings') ? 'page' : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                pathname.startsWith('/app/settings')
                  ? 'bg-[#121217] text-zinc-100 border border-[#d4af37]/40 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <SettingsIcon
                className={`w-4 h-4 ${pathname.startsWith('/app/settings') ? 'text-[#d4af37]' : 'text-zinc-400'}`}
              />
              <span>Settings & Preferences</span>
            </Link>
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

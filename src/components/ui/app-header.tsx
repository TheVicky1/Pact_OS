'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PactLogo } from '@/components/brand/pact-logo';
import { signOutAction } from '@/features/auth/actions';
import { NotificationPopover } from '@/components/ui/notification-popover';
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
  Timer as TimerIcon,
  Wallet,
  TrendingUp,
  Settings as SettingsIcon,
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
 * PACT Application Global Header & Navigation System
 * Clean three-zone horizontal layout:
 * [Logo] -> [Primary Navigation: 8 Core Modules] -> [Flexible Space] -> [Notifications, Profile, Settings, Sign Out]
 * Full responsiveness across desktop, laptop, tablet, and mobile with zero visual collision.
 */
export function AppHeader({ userName }: AppHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isDashboardActive = pathname === '/app';
  const isFocusActive = pathname === '/app/focus' || pathname.startsWith('/app/focus/');
  const isGoalsActive = pathname === '/app/goals' || pathname.startsWith('/app/goals/');
  const isProjectsActive = pathname === '/app/projects' || pathname.startsWith('/app/projects/');
  const isTasksActive = pathname === '/app/tasks' || pathname.startsWith('/app/tasks/');
  const isAccountabilityActive =
    pathname === '/app/accountability' || pathname.startsWith('/app/accountability/');
  const isFinanceActive = pathname === '/app/finance' || pathname.startsWith('/app/finance/');
  const isAnalyticsActive = pathname === '/app/analytics' || pathname.startsWith('/app/analytics/');

  const navItems: NavItem[] = [
    {
      href: '/app',
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: isDashboardActive,
    },
    {
      href: '/app/focus',
      label: 'Focus',
      icon: TimerIcon,
      isActive: isFocusActive,
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
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Left Section: Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-6 xl:gap-8 h-full shrink-0 min-w-0">
          <Link
            href="/app"
            className="focus-visible:outline-none rounded-xl transition-opacity hover:opacity-90 flex-shrink-0 flex items-center"
            aria-label="PACT Home"
          >
            <PactLogo size="sm" />
          </Link>

          {/* Desktop Navigation (Available on xl screens and above; tablet/laptop gracefully tiered) */}
          <nav aria-label="Main Navigation" className="hidden xl:flex items-center gap-1 2xl:gap-2 h-full">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? 'page' : undefined}
                className={`relative h-full flex items-center gap-1.5 px-2.5 2xl:px-3 text-[13px] 2xl:text-sm font-medium transition-colors focus-visible:outline-none rounded-lg group ${
                  item.isActive
                    ? 'text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <item.icon
                  className={`w-3.5 h-3.5 2xl:w-4 2xl:h-4 transition-colors shrink-0 ${
                    item.isActive ? 'text-[#d4af37]' : 'text-zinc-400 group-hover:text-zinc-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>

                {/* Underline Indicator anchored flush to header bottom border */}
                {item.isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 inset-x-1 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full shadow-sm shadow-[#d4af37]/40"
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section: Notification Bell, User Identity, Settings, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Notification Bell with Popover Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={isNotificationOpen}
              className={`relative h-9 w-9 flex items-center justify-center rounded-xl border transition-colors focus-visible:outline-none cursor-pointer ${
                isNotificationOpen
                  ? 'bg-white/[0.1] text-zinc-100 border-white/[0.15]'
                  : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 border-white/[0.06]'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  data-testid="notification-unread-dot"
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4af37] ring-2 ring-[#09090b] animate-pulse"
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

          {/* User Profile Pill */}
          {userName && (
            <div className="hidden sm:flex items-center gap-2 h-9 bg-zinc-900/40 border border-white/[0.06] pl-1.5 pr-3 rounded-xl text-xs text-zinc-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e1e28] to-[#121217] border border-[#d4af37]/40 flex items-center justify-center font-semibold text-[11px] text-[#e2c056] shadow-sm shrink-0">
                {userInitial ? userInitial : <User className="w-3 h-3 text-[#d4af37]" />}
              </div>
              <span className="font-medium truncate max-w-[100px] 2xl:max-w-[140px] select-none">
                {userName}
              </span>
            </div>
          )}

          {/* Settings Link Button */}
          <Link
            href="/app/settings"
            aria-label="Settings and Preferences"
            className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all focus-visible:outline-none cursor-pointer ${
              pathname.startsWith('/app/settings')
                ? 'bg-[#121217] text-[#e2c056] border-[#d4af37]/40 shadow-sm'
                : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 border-white/[0.06]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>

          {/* Sign Out Action */}
          <form action={signOutAction} className="inline-flex">
            <button
              type="submit"
              aria-label="Sign out"
              className="h-9 inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/[0.06] px-3 rounded-xl transition-all cursor-pointer focus-visible:outline-none"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </form>

          {/* Mobile / Tablet Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/[0.06] rounded-xl focus-visible:outline-none cursor-pointer transition-colors"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile / Tablet Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-white/[0.08] bg-[#09090b]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
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
                className={`w-4 h-4 ${
                  pathname.startsWith('/app/settings') ? 'text-[#d4af37]' : 'text-zinc-400'
                }`}
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

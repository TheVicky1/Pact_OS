'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { signOutAction } from '@/features/auth/actions';
import {
  User,
  Settings as SettingsIcon,
  BookOpen,
  LogOut,
  ChevronDown,
  Moon,
} from 'lucide-react';

export interface UserProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  timezone?: string;
}

export function UserProfileDropdown({
  userName,
  userEmail,
  timezone,
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const userInitial = userName?.trim().charAt(0).toUpperCase() || 'U';

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User Account Menu"
        className={`flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/50 ${
          isOpen
            ? 'bg-[#121217] text-zinc-100 border-[#d4af37]/40 shadow-sm'
            : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100 border-white/[0.06] hover:border-white/[0.15]'
        }`}
      >
        {/* User Mini Avatar Circle */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e1e28] to-[#121217] border border-[#d4af37]/40 flex items-center justify-center font-semibold text-[11px] text-[#e2c056] shadow-sm shrink-0">
          {userInitial}
        </div>

        {/* User Name */}
        {userName && (
          <span className="hidden sm:inline font-medium truncate max-w-[100px] 2xl:max-w-[140px] select-none">
            {userName}
          </span>
        )}

        {/* Chevron Indicator */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#d4af37]' : ''
          }`}
        />
      </button>

      {/* Account Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="User Account Options"
          className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-3xl border border-white/[0.08] bg-[#121217]/95 backdrop-blur-2xl shadow-2xl shadow-black/80 p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Profile Header Card */}
          <div className="flex items-center gap-3 p-1.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#262218] via-[#1a1822] to-[#121217] border border-[#d4af37]/50 flex items-center justify-center font-bold text-sm text-[#e2c056] shadow-md shadow-black/40 shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-zinc-100 truncate">
                {userName || 'PACT User'}
              </h4>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {userEmail || 'Personal Operating Space'}
              </p>
            </div>
          </div>

          {/* Micro Metadata Strip (Timezone, Integrity, Cadence) */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Timezone</span>
              <span className="text-xs font-semibold font-mono text-zinc-200 truncate block mt-0.5" title={timezone || 'UTC'}>
                {timezone ? timezone.split('/')[1] || timezone : 'UTC'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Integrity</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Cadence</span>
              <span className="text-xs font-semibold font-mono text-[#e2c056] block mt-0.5">
                Sunday
              </span>
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="h-[1px] w-full bg-white/[0.06]" />

          {/* Functional Account Navigation Action Links */}
          <div className="space-y-0.5">
            <Link
              href="/app/settings#profile"
              role="menuitem"
              onClick={handleClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/50 transition-colors group"
            >
              <User className="w-4 h-4 text-zinc-400 group-hover:text-[#d4af37] transition-colors shrink-0" />
              <span>Profile</span>
            </Link>

            <Link
              href="/app/review"
              role="menuitem"
              onClick={handleClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/50 transition-colors group"
            >
              <BookOpen className="w-4 h-4 text-zinc-400 group-hover:text-[#d4af37] transition-colors shrink-0" />
              <span>Review</span>
            </Link>

            <Link
              href="/app/settings"
              role="menuitem"
              onClick={handleClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/50 transition-colors group"
            >
              <SettingsIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Subtle Divider */}
          <div className="h-[1px] w-full bg-white/[0.06]" />

          {/* Theme Indicator Row */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/40 border border-white/[0.04]">
            <span className="text-xs text-zinc-400 flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Theme</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30 font-bold font-mono text-[10px] tracking-wider">
              DARK OS
            </span>
          </div>

          {/* Subtle Divider */}
          <div className="h-[1px] w-full bg-white/[0.06]" />

          {/* Sign Out Action */}
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400/50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

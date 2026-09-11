'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui';
import { ShieldCheck, Plus, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface DailyFocusHeroProps {
  userName: string;
  greeting: string;
  pendingCount: number;
  completedCount: number;
  urgentCount: number;
  timezone: string;
}

/**
 * PACT Daily Focus Hero & Date Horizon Ribbon
 * Luxury cinematic hero featuring the signature dark planetary sphere on the right 35%,
 * warm golden rim lighting, crisp typography, and restrained ambient lighting.
 */
export function DailyFocusHero({
  userName,
  greeting,
  pendingCount,
  completedCount,
  urgentCount,
  timezone,
}: DailyFocusHeroProps) {
  // Get current local day, month, and weekday in user's profile timezone
  const { dayNumber, monthAbbrev, weekdayName } = useMemo(() => {
    try {
      const now = new Date();
      const day = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        day: 'numeric',
      }).format(now);
      const month = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        month: 'short',
      }).format(now);
      const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
      }).format(now);
      return { dayNumber: day, monthAbbrev: month, weekdayName: weekday };
    } catch {
      return { dayNumber: `${new Date().getDate()}`, monthAbbrev: 'Today', weekdayName: 'Today' };
    }
  }, [timezone]);

  return (
    <div className="space-y-4">
      {/* Primary Hero Banner */}
      <div className="relative rounded-[28px] bg-[#0C0C0F] border border-white/[0.06] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80 overflow-hidden group">
        {/* 1. Cinematic Dark Planetary Sphere on the Right (Occupies ~35% of container) */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 sm:-top-16 sm:-right-16 lg:-top-20 lg:-right-16 w-[280px] sm:w-[380px] lg:w-[460px] h-[280px] sm:h-[380px] lg:h-[460px] pointer-events-none select-none z-0"
        >
          {/* Localized Soft Gold Atmospheric Glow Halo */}
          <div
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl opacity-25"
            style={{
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, rgba(230, 195, 74, 0.12) 40%, transparent 70%)',
            }}
          />

          {/* Core Dark Planetary Sphere Body */}
          <div
            className="absolute inset-4 sm:inset-6 rounded-full border border-white/[0.04]"
            style={{
              background: 'radial-gradient(circle at 74% 24%, #18181C 0%, #101013 32%, #0C0C0F 64%, #050506 100%)',
              boxShadow: 'inset -2px 2px 14px 1px rgba(212, 175, 55, 0.45), inset -1px 1px 3px 0px rgba(255, 245, 220, 0.9), 0 10px 40px rgba(0,0,0,0.95)',
            }}
          >
            {/* Upper-Right Gold Crescent & Specular Highlight */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 82% 18%, rgba(240, 185, 11, 0.5) 0%, rgba(212, 175, 55, 0.2) 20%, transparent 45%)',
              }}
            />

            {/* Subtle Surface Texture Contours */}
            <div
              className="absolute inset-0 rounded-full opacity-15 mix-blend-overlay"
              style={{
                backgroundImage: 'radial-gradient(ellipse at 70% 30%, rgba(255, 255, 255, 0.18) 0%, transparent 60%)',
              }}
            />
          </div>
        </div>

        {/* 2. Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-3.5 max-w-xl">
            {/* Small Gold Outlined Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101012] border border-[#D4AF37]/35 text-[11px] font-medium tracking-wide text-[#E8E8E8] shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>PACT Personal Operating System</span>
            </div>

            {/* Large Bold Warm White Greeting */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#F5F5F5]">
              {greeting},{' '}
              <span className="text-[#F5F5F5] font-extrabold">
                {userName || 'Vicky'}
              </span>
            </h1>

            {/* Supporting Copy in Muted Gray */}
            <p className="text-sm sm:text-base text-[#8B8B92] leading-relaxed max-w-lg">
              {pendingCount > 0
                ? `You have ${pendingCount} ${
                    pendingCount === 1 ? 'commitment' : 'commitments'
                  } scheduled today. Take deliberate, disciplined action.`
                : 'All commitments are in order. Set an intentional target or review your active goals.'}
            </p>
          </div>

          {/* New Commitment Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app/tasks">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4 text-[#090909]" />}
                className="bg-[#D4AF37] hover:bg-[#E6C34A] text-[#090909] font-semibold border border-[#E6C34A]/50 shadow-lg shadow-[#D4AF37]/15 transition-all duration-200"
              >
                New Commitment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Horizon Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3.5">
          {/* Date Squircle */}
          <div className="w-12 h-12 rounded-2xl bg-[#0C0C0F] border border-white/[0.06] flex flex-col items-center justify-center text-center shrink-0 shadow-md">
            <span className="text-base font-extrabold text-[#F5F5F5] leading-none">
              {dayNumber}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] leading-tight mt-0.5">
              {monthAbbrev}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#E8E8E8]">
              <span>{weekdayName}&apos;s Commitments</span>
              <span className="text-[#71717A]">•</span>
              <span className="text-xs font-mono font-medium text-[#A1A1AA]">
                {pendingCount} Pending
                {urgentCount > 0 && (
                  <span className="text-[#D4AF37] ml-1">({urgentCount} Urgent)</span>
                )}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">
              {completedCount > 0
                ? `${completedCount} commitments fulfilled in this cycle.`
                : 'Ready for disciplined execution today.'}
            </p>
          </div>
        </div>

        {/* Informational Day Navigation Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            disabled
            title="Viewing current active day"
            className="w-8 h-8 rounded-xl border border-white/[0.04] bg-[#0C0C0F] text-[#71717A] flex items-center justify-center cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-[11px] font-mono text-[#A1A1AA] px-2.5 py-1 rounded-lg bg-[#0C0C0F] border border-white/[0.04] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#D4AF37]" />
            <span>Today</span>
          </div>
          <button
            type="button"
            disabled
            title="Viewing current active day"
            className="w-8 h-8 rounded-xl border border-white/[0.04] bg-[#0C0C0F] text-[#71717A] flex items-center justify-center cursor-not-allowed"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

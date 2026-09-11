'use client';

import React, { useMemo } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
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
 * Luxury cinematic hero featuring the signature PACT dark planetary sphere
 * with warm golden rim lighting, atmospheric glow, and authoritative status.
 */
export function DailyFocusHero({
  userName,
  greeting,
  pendingCount,
  completedCount,
  urgentCount,
  timezone,
}: DailyFocusHeroProps) {
  // Get current local day and month in user's profile timezone
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
      {/* Primary Hero Banner with Cinematic Planetary Sphere */}
      <div className="relative rounded-3xl bg-[rgba(14,14,19,0.85)] border border-white/[0.09] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/70 backdrop-blur-2xl overflow-hidden group">
        {/* 1. Cinematic Atmospheric Gold Diffuse Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 right-0 w-[420px] sm:w-[540px] h-[340px] sm:h-[420px] bg-gradient-to-bl from-[#d4af37]/20 via-[#aa820a]/8 to-transparent rounded-full blur-3xl pointer-events-none"
        />

        {/* 2. Planetary Sphere Element */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 sm:-top-8 sm:-right-8 lg:-top-6 lg:-right-6 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 pointer-events-none select-none z-0"
        >
          {/* Subtle Outer Atmospheric Halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#d4af37]/10 to-[#f5c037]/25 blur-xl transform scale-110" />

          {/* Core Dark Obsidian Sphere Body with Realistic Shading */}
          <div
            className="absolute inset-0 rounded-full border border-white/[0.06] shadow-2xl shadow-black"
            style={{
              background:
                'radial-gradient(circle at 72% 28%, #262422 0%, #16151a 30%, #0d0c10 65%, #070709 100%)',
            }}
          />

          {/* Golden Upper-Right Rim Light & Specular Crescent */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 82% 18%, rgba(252, 234, 187, 0.85) 0%, rgba(212, 175, 55, 0.5) 18%, rgba(170, 130, 10, 0.18) 38%, transparent 68%)',
            }}
          />

          {/* Razor-thin Bright Gold Crescent Edge Line */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow:
                'inset -3px 3px 12px 1px rgba(212, 175, 55, 0.4), inset -1px 1px 3px 0px rgba(255, 240, 200, 0.8)',
            }}
          />

          {/* Subtle Surface Texture / Latitudinal Contours */}
          <div className="absolute inset-0 rounded-full opacity-20 mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/80" />
        </div>

        {/* 3. Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-3.5 max-w-2xl">
            {/* PACT Operating System Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="gold"
                size="sm"
                icon={<ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />}
                className="bg-[#181820]/90 border-[#d4af37]/30 text-zinc-200 shadow-sm"
              >
                PACT Personal Operating System
              </Badge>
            </div>

            {/* Cinematic Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">
              {greeting},{' '}
              <span className="text-gradient-gold drop-shadow-sm">
                {userName || 'Committed User'}
              </span>
            </h1>

            {/* Context Description */}
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              {pendingCount > 0
                ? `You have ${pendingCount} ${
                    pendingCount === 1 ? 'commitment' : 'commitments'
                  } scheduled today. Take deliberate, disciplined action.`
                : 'All commitments are in order. Set an intentional target or review your active goals.'}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app/tasks">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                className="shadow-xl shadow-[#d4af37]/20 border border-[#f5c037]/50 font-semibold hover:brightness-105 active:scale-[0.98] transition-all"
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
          <div className="w-12 h-12 rounded-2xl bg-[#121217] border border-white/[0.1] flex flex-col items-center justify-center text-center shrink-0 shadow-md">
            <span className="text-base font-extrabold text-zinc-100 leading-none">
              {dayNumber}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#d4af37] leading-tight mt-0.5">
              {monthAbbrev}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <span>{weekdayName}&apos;s Commitments</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono font-medium text-zinc-400">
                {pendingCount} Pending
                {urgentCount > 0 && (
                  <span className="text-amber-400/90 ml-1">({urgentCount} Urgent)</span>
                )}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
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
            className="w-8 h-8 rounded-xl border border-white/[0.06] bg-zinc-900/40 text-zinc-600 flex items-center justify-center cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-[11px] font-mono text-zinc-300 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-white/[0.06] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#d4af37]" />
            <span>Today</span>
          </div>
          <button
            type="button"
            disabled
            title="Viewing current active day"
            className="w-8 h-8 rounded-xl border border-white/[0.06] bg-zinc-900/40 text-zinc-600 flex items-center justify-center cursor-not-allowed"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

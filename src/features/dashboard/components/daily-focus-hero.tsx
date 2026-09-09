'use client';

import React, { useMemo } from 'react';
import { GlassCard, Button, Badge, GoldSpotlight } from '@/components/ui';
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
 * Establishes top-of-dashboard focus and situational awareness.
 * Translated directly from the visual north star hero and date ribbon.
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
  const { dayNumber, monthAbbrev } = useMemo(() => {
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
      return { dayNumber: day, monthAbbrev: month };
    } catch {
      return { dayNumber: `${new Date().getDate()}`, monthAbbrev: 'Today' };
    }
  }, [timezone]);

  return (
    <div className="space-y-4">
      {/* Primary Hero Banner */}
      <GlassCard variant="spotlight" padding="lg" className="relative overflow-hidden">
        <GoldSpotlight position="top-right" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                PACT Personal Operating System
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">
              {greeting},{' '}
              <span className="text-gradient-gold">{userName || 'Committed User'}</span>
            </h1>

            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              {pendingCount > 0
                ? `You have ${pendingCount} ${
                    pendingCount === 1 ? 'commitment' : 'commitments'
                  } scheduled. Take deliberate, disciplined action.`
                : 'All commitments are in order. Set an intentional target or review your active goals.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app/tasks">
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                New Commitment
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* Date Horizon Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3.5">
          {/* Date Squircle */}
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex flex-col items-center justify-center text-center shrink-0 shadow-sm">
            <span className="text-sm font-bold text-zinc-100 leading-none">
              {dayNumber}
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#d4af37] leading-tight">
              {monthAbbrev}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <span>Today&apos;s Commitments</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono font-medium text-zinc-400">
                {pendingCount} Pending
                {urgentCount > 0 && ` (${urgentCount} Urgent)`}
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
          <div className="text-[11px] font-mono text-zinc-400 px-2 flex items-center gap-1">
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

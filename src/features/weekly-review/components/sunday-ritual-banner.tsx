'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SundayRitualBannerProps {
  isSunday: boolean;
  isCompleted: boolean;
  weekLabel: string;
}

export function SundayRitualBanner({
  isSunday,
  isCompleted,
  weekLabel,
}: SundayRitualBannerProps) {
  if (isCompleted) {
    return (
      <div className="glass-card rounded-2xl p-4 sm:p-5 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-zinc-100 text-sm block">
              Sunday Review Completed ({weekLabel})
            </span>
            <span className="text-zinc-400">
              Weekly operating plan is certified and locked.
            </span>
          </div>
        </div>
        <Link
          href="/app/review"
          className="shrink-0 focus-visible:outline-none"
        >
          <Button variant="secondary" size="sm" className="text-xs">
            <span>View Plan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border-[#d4af37]/30 bg-gradient-to-r from-[#181622] via-[#121217] to-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/40">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30 shrink-0 mt-0.5 sm:mt-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold text-sm text-zinc-100 block">
            {isSunday ? 'Sunday Weekly Review Ready' : `Weekly Review (${weekLabel})`}
          </span>
          <span className="text-xs text-zinc-400 mt-0.5 block">
            Audit verified facts, triage open loops, and commit to next week&apos;s strategic priorities.
          </span>
        </div>
      </div>

      <Link
        href="/app/review"
        className="self-start sm:self-auto shrink-0 focus-visible:outline-none"
      >
        <Button variant="primary" size="sm" className="shadow-lg shadow-[#d4af37]/15">
          <span>Start Ritual</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </Link>
    </div>
  );
}

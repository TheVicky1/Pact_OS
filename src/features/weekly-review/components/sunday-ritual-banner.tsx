'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-foreground block">
              Sunday Review Completed ({weekLabel})
            </span>
            <span className="text-muted-foreground">
              Weekly operating plan is locked. Ready to execute.
            </span>
          </div>
        </div>
        <Link
          href="/app/review"
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors font-medium flex items-center space-x-1"
        >
          <span>View Plan</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-card/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-sm text-foreground block">
            {isSunday ? 'Sunday Weekly Review Ready' : `Weekly Review (${weekLabel})`}
          </span>
          <span className="text-xs text-muted-foreground">
            Review past outcomes, clean up open loops, and commit to next week&apos;s priorities.
          </span>
        </div>
      </div>

      <Link
        href="/app/review"
        className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center space-x-1.5 shadow-sm shrink-0"
      >
        <span>Start Ritual</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

'use client';

import React from 'react';
import { CompletionMetrics, RecordedSessionMetrics } from '@/lib/analytics';
import { CheckCircle2, AlertTriangle, ShieldCheck, Timer } from 'lucide-react';

interface AnalyticsSummaryCardsProps {
  completion: CompletionMetrics;
  sessions: RecordedSessionMetrics;
}

export function AnalyticsSummaryCards({
  completion,
  sessions,
}: AnalyticsSummaryCardsProps) {
  const hasResolved = completion.totalResolved > 0;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Progress Summary Metrics"
    >
      {/* 1. Completed Commitments */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Completed
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-emerald-400 font-mono">
          {completion.completedCount}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Fulfilled commitments in period
        </p>
      </div>

      {/* 2. Missed Commitments */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-rose-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Missed
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-rose-400 font-mono">
          {completion.missedCount}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Unfulfilled commitment deadlines
        </p>
      </div>

      {/* 3. Completion Rate */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-amber-400/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Completion Rate
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-3xl lg:text-4xl font-extrabold tracking-tight font-mono text-white">
          {hasResolved ? `${completion.completionRate}%` : 'In Progress'}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {hasResolved
            ? `${completion.completedCount} of ${completion.totalResolved} resolved`
            : 'Computes with resolved tasks'}
        </p>
      </div>

      {/* 4. Recorded Session Duration */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-cyan-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recorded Time
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Timer className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-3xl lg:text-4xl font-extrabold tracking-tight font-mono text-white">
          {sessions.formattedDuration}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {sessions.sessionCount > 0
            ? `Across ${sessions.sessionCount} verified session${sessions.sessionCount === 1 ? '' : 's'}`
            : 'Verified timed sessions'}
        </p>
      </div>
    </div>
  );
}

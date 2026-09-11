'use client';

import React from 'react';
import { AmberBacklight } from '@/components/ui';
import { ShieldCheck, TrendingUp } from 'lucide-react';

export interface FollowThroughWidgetProps {
  completedCount: number;
  missedCount: number;
  pendingCount: number;
}

/**
 * PACT Follow-Through Ratio Widget
 * Center featured card displaying the user's authentic follow-through reliability.
 * Derived strictly from authoritative completed vs missed tasks.
 */
export function FollowThroughWidget({
  completedCount,
  missedCount,
  pendingCount,
}: FollowThroughWidgetProps) {
  const resolvedTotal = completedCount + missedCount;
  const hasHistory = resolvedTotal > 0;
  const followThroughRate = hasHistory
    ? Math.round((completedCount / resolvedTotal) * 100)
    : null;

  return (
    <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden transition-all duration-200 hover:border-[#d4af37]/35 hover:shadow-2xl hover:shadow-[#d4af37]/5 group">
      <AmberBacklight />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between text-zinc-400">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Follow-Through Rate
        </span>
        <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/30 transition-colors">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Main Metric */}
      <div className="relative z-10 my-auto py-2">
        {hasHistory ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-zinc-100 font-mono tracking-tight text-gradient-gold">
                {followThroughRate}%
              </span>
              <span className="text-xs text-zinc-400 font-medium inline-flex items-center gap-1 bg-zinc-900/80 border border-white/[0.06] px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3 text-[#d4af37]" />
                <span>Authoritative</span>
              </span>
            </div>

            {/* Subtle Gold Progress Track */}
            <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#aa820a] via-[#d4af37] to-[#f5c037] shadow-sm shadow-[#d4af37]/40 transition-all duration-500"
                style={{ width: `${followThroughRate}%` }}
              />
            </div>

            <p className="text-xs text-zinc-400">
              Commitment resolution reliability
            </p>
          </div>
        ) : (
          <div className="py-2">
            <span className="text-2xl font-bold text-zinc-300 font-mono">
              In Progress
            </span>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Ratio computes automatically as commitments are resolved.
            </p>
          </div>
        )}
      </div>

      {/* Context Footer */}
      <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono">
        <span>{completedCount} fulfilled</span>
        <span className="text-zinc-600">•</span>
        <span>{missedCount} missed</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400">{pendingCount} pending</span>
      </div>
    </div>
  );
}

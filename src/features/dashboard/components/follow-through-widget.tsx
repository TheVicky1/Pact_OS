'use client';

import React from 'react';
import { GlassCard, AmberBacklight } from '@/components/ui';
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
    <GlassCard
      variant="elevated"
      padding="md"
      className="h-full flex flex-col justify-between min-h-[190px] relative overflow-hidden"
    >
      <AmberBacklight />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between text-zinc-400">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Follow-Through Rate
        </span>
        <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
      </div>

      {/* Main Metric */}
      <div className="relative z-10 my-auto py-1">
        {hasHistory ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-zinc-100 font-mono tracking-tight text-gradient-gold">
                {followThroughRate}%
              </span>
              <span className="text-xs text-zinc-400 font-medium inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Authoritative</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Commitment resolution reliability
            </p>
          </div>
        ) : (
          <div className="py-2">
            <span className="text-2xl font-bold text-zinc-300 font-mono">
              In Progress
            </span>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
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
    </GlassCard>
  );
}

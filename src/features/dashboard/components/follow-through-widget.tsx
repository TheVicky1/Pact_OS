'use client';

import React from 'react';
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
    <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[#0C0C0F] border border-white/[0.06] p-5 sm:p-6 shadow-xl shadow-black/60 relative overflow-hidden transition-all duration-200 hover:border-[#D4AF37]/30 hover:shadow-2xl hover:shadow-black/80 hover:-translate-y-0.5 group cursor-default">
      {/* Subtle Gold Ambient Backlight */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 60%, rgba(212, 175, 55, 0.3) 0%, transparent 65%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between text-[#8B8B92]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8B92]">
          Follow-Through Rate
        </span>
        <div className="w-8 h-8 rounded-xl bg-[#101012] border border-white/[0.06] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/25 transition-colors">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Main Metric */}
      <div className="relative z-10 my-auto py-2">
        {hasHistory ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#F5F5F5] font-mono tracking-tight">
                {followThroughRate}%
              </span>
              <span className="text-xs text-[#A1A1AA] font-medium inline-flex items-center gap-1 bg-[#101012] border border-white/[0.06] px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                <span>Authoritative</span>
              </span>
            </div>

            {/* Subtle Gold Progress Track */}
            <div className="w-full bg-[#101012] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#AA820A] via-[#D4AF37] to-[#E6C34A] shadow-sm shadow-[#D4AF37]/30 transition-all duration-500"
                style={{ width: `${followThroughRate}%` }}
              />
            </div>

            <p className="text-xs text-[#8B8B92]">
              Commitment resolution reliability
            </p>
          </div>
        ) : (
          <div className="py-2">
            <span className="text-2xl font-bold text-[#E8E8E8] font-mono">
              In Progress
            </span>
            <p className="text-xs text-[#8B8B92] mt-1.5 leading-relaxed">
              Ratio computes automatically as commitments are resolved.
            </p>
          </div>
        )}
      </div>

      {/* Context Footer */}
      <div className="relative z-10 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-[#71717A] font-mono">
        <span>{completedCount} fulfilled</span>
        <span className="text-zinc-700">•</span>
        <span>{missedCount} missed</span>
        <span className="text-zinc-700">•</span>
        <span>{pendingCount} pending</span>
      </div>
    </div>
  );
}

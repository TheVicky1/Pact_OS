'use client';

import React from 'react';
import { AccountabilityAggregates } from '@/lib/analytics';
import { ShieldCheck, CheckCircle2, ShieldAlert, Clock, Lock } from 'lucide-react';

interface AccountabilityOutcomesCardProps {
  aggregates: AccountabilityAggregates;
}

export function AccountabilityOutcomesCard({
  aggregates,
}: AccountabilityOutcomesCardProps) {
  const hasCommitments = aggregates.totalActivated > 0;

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Accountability Resolutions</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Factual commitment outcomes & verification events</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-full border border-white/[0.04]">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>Private & Confidential</span>
        </div>
      </div>

      {!hasCommitments ? (
        <div className="py-10 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-xl">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-2">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-zinc-300">No accountability commitments recorded</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm">
            When missed tasks trigger commitments, resolution aggregates appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Fulfilled */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.04] space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span>Fulfilled</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {aggregates.totalFulfilled}
            </div>
            <p className="text-[10px] text-zinc-400">Verified resolutions</p>
          </div>

          {/* Waived */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.04] space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
              <span>Waived</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {aggregates.totalWaived}
            </div>
            <p className="text-[10px] text-zinc-400">Within weekly quotas</p>
          </div>

          {/* Pending */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.04] space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
              <span>Pending</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {aggregates.totalPendingResolution}
            </div>
            <p className="text-[10px] text-zinc-400">Awaiting resolution</p>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400">
        <span>Consequence definitions are strictly isolated from normal analytical surfaces.</span>
      </div>
    </div>
  );
}

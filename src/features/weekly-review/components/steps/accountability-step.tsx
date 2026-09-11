'use client';

import React from 'react';
import { WeeklyAccountabilityMetrics, WeeklyReflection } from '@/lib/weekly-review/types';
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface AccountabilityStepProps {
  accountability: WeeklyAccountabilityMetrics;
  reflection: WeeklyReflection;
  onUpdateReflection: (field: keyof WeeklyReflection, value: string) => void;
}

export function AccountabilityStep({
  accountability,
  reflection,
  onUpdateReflection,
}: AccountabilityStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            Step 2 • Integrity Audit
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400">Accountability</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 mt-1">
          Accountability & Commitment Integrity
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Evaluate whether you kept your commitments without rationalizations. Audit activated pacts and root friction.
        </p>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Activated Pacts</span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            {accountability.totalActivated}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Fulfilled</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {accountability.totalFulfilled}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Waived</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {accountability.totalWaived}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Missed</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {accountability.totalMissed}
          </div>
        </div>
      </div>

      {/* Integrity Assessment Callout */}
      {accountability.totalMissed > 0 ? (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-semibold text-rose-300 text-sm block">
              {accountability.totalMissed} Commitment{accountability.totalMissed > 1 ? 's' : ''} Missed
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Consequences were activated according to deterministic PACT protocol. Review the root causes below to eliminate repeat friction.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-semibold text-emerald-300 text-sm block">
              High Integrity Week
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Zero commitments were broken this review cycle. Your actions aligned fully with your stated commitments.
            </p>
          </div>
        </div>
      )}

      {/* Structured Integrity Reflection Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            Biggest Win <span className="text-zinc-400 font-normal font-sans lowercase">(what went exceptionally well?)</span>
          </label>
          <textarea
            value={reflection.biggestWin}
            onChange={(e) => onUpdateReflection('biggestWin', e.target.value)}
            placeholder="e.g. Shipped Phase 6C on time and maintained 100% habit streak."
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            Biggest Challenge <span className="text-zinc-400 font-normal font-sans lowercase">(what caused friction or failure?)</span>
          </label>
          <textarea
            value={reflection.biggestChallenge}
            onChange={(e) => onUpdateReflection('biggestChallenge', e.target.value)}
            placeholder="e.g. Underestimated task complexity on Wednesday and missed focus blocks."
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

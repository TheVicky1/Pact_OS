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
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 2: Accountability & Commitment Integrity
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Did you keep the commitments you made? Assess your word and integrity without rationalizations.
        </p>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Activated Pacts</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {accountability.totalActivated}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Fulfilled</span>
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-2">
            {accountability.totalFulfilled}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Waived</span>
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-2">
            {accountability.totalWaived}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <XCircle className="w-4 h-4 text-destructive" />
            <span>Missed</span>
          </div>
          <div className="text-2xl font-bold text-destructive mt-2">
            {accountability.totalMissed}
          </div>
        </div>
      </div>

      {/* Integrity Assessment Callout */}
      {accountability.totalMissed > 0 ? (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-destructive block">
              {accountability.totalMissed} Commitment{accountability.totalMissed > 1 ? 's' : ''} Missed
            </span>
            <p className="text-muted-foreground mt-0.5">
              Consequences were activated according to the deterministic PACT protocol. Review the root cause below to avoid repeating the friction.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-emerald-500 block">
              High Integrity Week
            </span>
            <p className="text-muted-foreground mt-0.5">
              Zero commitments were broken this review cycle. Your actions aligned with your stated commitments.
            </p>
          </div>
        </div>
      )}

      {/* Structured Integrity Reflection Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Biggest Win (What went exceptionally well?)
          </label>
          <textarea
            value={reflection.biggestWin}
            onChange={(e) => onUpdateReflection('biggestWin', e.target.value)}
            placeholder="e.g. Shipped Phase 6C on time and maintained 100% habit streak."
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Biggest Challenge (What caused friction or failure?)
          </label>
          <textarea
            value={reflection.biggestChallenge}
            onChange={(e) => onUpdateReflection('biggestChallenge', e.target.value)}
            placeholder="e.g. Underestimated task complexity on Wednesday and missed focus blocks."
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </div>
  );
}

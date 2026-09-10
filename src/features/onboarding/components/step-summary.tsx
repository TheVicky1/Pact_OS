'use client';

import React, { useTransition } from 'react';
import {
  Sparkles,
  User,
  Globe,
  Clock,
  Target,
  Bell,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Rocket,
  FolderKanban,
} from 'lucide-react';

export interface StepSummaryProps {
  fullName: string;
  timezone: string;
  workStartTime: string;
  workEndTime: string;
  dailyTaskTarget: number;
  notifications: {
    dailyPlanReminder: boolean;
    deadlineAlerts: boolean;
    consequenceAlerts: boolean;
    weeklyReviewNotice: boolean;
  };
  initialGoalTitle?: string;
  initialProjectTitle?: string;
  onBack: () => void;
  onComplete: () => Promise<void>;
}

export function StepSummary({
  fullName,
  timezone,
  workStartTime,
  workEndTime,
  dailyTaskTarget,
  notifications,
  initialGoalTitle,
  initialProjectTitle,
  onBack,
  onComplete,
}: StepSummaryProps) {
  const [isPending, startTransition] = useTransition();

  const handleLaunch = () => {
    startTransition(async () => {
      await onComplete();
    });
  };

  const activeAlertsCount = Object.values(notifications).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[#d4af37]" />
          Step 3: Ready to Launch PACT OS
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Review your operational parameters. Your configuration is ready to govern your commitments and productivity horizon.
        </p>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity & Horizon Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <User className="w-4 h-4 text-[#d4af37]" />
            <span>Identity & Time</span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-zinc-500">Operator</span>
              <div className="text-sm font-semibold text-zinc-100">{fullName || 'PACT User'}</div>
            </div>

            <div>
              <span className="text-xs text-zinc-500">Timezone Authority</span>
              <div className="text-sm font-medium text-[#e2c056] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {timezone}
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-500">Daily Working Window</span>
              <div className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {workStartTime} — {workEndTime}
              </div>
            </div>
          </div>
        </div>

        {/* Operating Cadence Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Target className="w-4 h-4 text-[#d4af37]" />
            <span>Operating Cadence</span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-zinc-500">Daily Task Target</span>
              <div className="text-sm font-semibold text-zinc-100">
                {dailyTaskTarget} tasks / day
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-500">Alert Sensitivities</span>
              <div className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#d4af37]" />
                {activeAlertsCount} active alert triggers enabled
              </div>
            </div>

            {(initialGoalTitle || initialProjectTitle) && (
              <div>
                <span className="text-xs text-zinc-500">Starter Focus</span>
                <div className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
                  {initialGoalTitle || initialProjectTitle}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Autonomous PACT Engine Highlights */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181822] to-[#101016] border border-[#d4af37]/20 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#e2c056]">
          <ShieldCheck className="w-4 h-4" />
          <span>What PACT OS is Now Ready to Do:</span>
        </div>

        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Autonomous Accountability Sweeper:</strong> Expired commitments will trigger consequences even when you are offline.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Proof-of-Work Verification:</strong> Resolve consequences via GitHub commits, LeetCode solves, or Codeforces submissions.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Financial & Recurring Discipline:</strong> Track recurring subscriptions, category budgets, and prevent spending drift.
            </span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleLaunch}
          disabled={isPending}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e2c056] to-[#b38f24] hover:brightness-110 text-zinc-950 font-bold text-sm sm:text-base shadow-xl shadow-[#d4af37]/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2.5"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing PACT OS...</span>
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>Launch PACT OS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

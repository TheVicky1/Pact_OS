'use client';

import React from 'react';
import { WeeklyReviewMetrics } from '@/lib/weekly-review/types';
import {
  CheckSquare,
  Target,
  ShieldCheck,
  Timer,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export interface LookBackStepProps {
  metrics: WeeklyReviewMetrics;
  weekLabel: string;
}

export function LookBackStep({ metrics, weekLabel }: LookBackStepProps) {
  const { tasks, goalsAndProjects, accountability, focus, habits, finance } = metrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            Step 1 • Fact Finding
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400">Objective Truth</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 mt-1">
          Look Back — Verified Weekly Facts
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Authoritative audit of verified task execution, commitments, focus time, and cash flow for {weekLabel}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tasks Card */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#d4af37] font-medium text-xs">
              <CheckSquare className="w-4 h-4" />
              <span>Task Execution</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#e2c056] border border-[#d4af37]/20 font-mono font-semibold">
              {tasks.completionRate}% Rate
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
            {tasks.completedCount}{' '}
            <span className="text-xs font-normal text-zinc-400">
              / {tasks.completedCount + tasks.pendingCount + tasks.missedCount} done
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="block font-semibold font-mono text-zinc-200">{tasks.createdCount}</span>
              <span className="text-[11px] text-zinc-400">Created</span>
            </div>
            <div>
              <span className="block font-semibold font-mono text-zinc-200">{tasks.pendingCount}</span>
              <span className="text-[11px] text-zinc-400">Active</span>
            </div>
            <div>
              <span className={`block font-semibold font-mono ${tasks.overdueCount > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                {tasks.overdueCount}
              </span>
              <span className="text-[11px] text-zinc-400">Overdue</span>
            </div>
          </div>
        </div>

        {/* Accountability Card */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-medium text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Commitments & Integrity</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
              {accountability.totalFulfilled} Fulfilled
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
            {accountability.totalActivated}{' '}
            <span className="text-xs font-normal text-zinc-400">pacts activated</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="block font-semibold font-mono text-emerald-400">{accountability.totalFulfilled}</span>
              <span className="text-[11px] text-zinc-400">Fulfilled</span>
            </div>
            <div>
              <span className="block font-semibold font-mono text-amber-400">{accountability.totalWaived}</span>
              <span className="text-[11px] text-zinc-400">Waived</span>
            </div>
            <div>
              <span className={`block font-semibold font-mono ${accountability.totalMissed > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                {accountability.totalMissed}
              </span>
              <span className="text-[11px] text-zinc-400">Missed</span>
            </div>
          </div>
        </div>

        {/* Focus Work Card */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-medium text-xs">
              <Timer className="w-4 h-4" />
              <span>Deep Work Focus</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono font-semibold">
              {focus.totalSessions} Sessions
            </span>
          </div>
          <div className="text-3xl font-bold text-sky-400 font-mono tracking-tight">
            {focus.formattedDuration}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="block font-semibold font-mono text-zinc-200">{focus.completedSessions}</span>
              <span className="text-[11px] text-zinc-400">Completed</span>
            </div>
            <div>
              <span className="block font-semibold font-mono text-zinc-200">{focus.averageSessionMinutes}m</span>
              <span className="text-[11px] text-zinc-400">Avg Duration</span>
            </div>
          </div>
        </div>

        {/* Habits Card */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
              <Repeat className="w-4 h-4" />
              <span>Habit Consistency</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
              {habits.completionRate}%
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
            {habits.completedOccurrences}{' '}
            <span className="text-xs font-normal text-zinc-400">
              / {habits.scheduledOccurrences} done
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="block font-semibold font-mono text-emerald-400">{habits.completedOccurrences}</span>
              <span className="text-[11px] text-zinc-400">Completed</span>
            </div>
            <div>
              <span className="block font-semibold font-mono text-zinc-200">{habits.skippedOccurrences}</span>
              <span className="text-[11px] text-zinc-400">Skipped</span>
            </div>
            <div>
              <span className={`block font-semibold font-mono ${habits.missedOccurrences > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                {habits.missedOccurrences}
              </span>
              <span className="text-[11px] text-zinc-400">Missed</span>
            </div>
          </div>
        </div>

        {/* Finance Card */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-400 font-medium text-xs">
              <Wallet className="w-4 h-4" />
              <span>Financial Cash Flow</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                finance.netCashFlowCents >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              Net {finance.formattedNet}
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-[11px] text-zinc-400 flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3 text-rose-400" /> Outflow
              </span>
              <span className="text-xl font-bold font-mono text-zinc-100">{finance.formattedExpense}</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" /> Inflow
              </span>
              <span className="text-xl font-bold font-mono text-zinc-100">{finance.formattedIncome}</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 pt-3 border-t border-white/[0.06]">
            <span>{finance.exceededBudgetsCount} category budget limit exceedances</span>
          </div>
        </div>

        {/* Goals & Projects Card */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#d4af37] font-medium text-xs">
              <Target className="w-4 h-4" />
              <span>Strategic Focus</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#e2c056] border border-[#d4af37]/20 font-mono font-semibold">
              {goalsAndProjects.activeGoalsCount} Active
            </span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
            {goalsAndProjects.goalsWithProgressCount}{' '}
            <span className="text-xs font-normal text-zinc-400">goals progressed</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
            <div>
              <span className="block font-semibold font-mono text-zinc-200">{goalsAndProjects.activeProjectsCount}</span>
              <span className="text-[11px] text-zinc-400">Active Projects</span>
            </div>
            <div>
              <span className={`block font-semibold font-mono ${goalsAndProjects.stalledGoalsCount > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                {goalsAndProjects.stalledGoalsCount}
              </span>
              <span className="text-[11px] text-zinc-400">Stalled Goals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

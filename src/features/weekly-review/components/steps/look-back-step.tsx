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
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 1: Look Back — Objective Weekly Facts
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Authoritative review of verified activity and commitments for {weekLabel}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tasks Card */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-primary font-medium text-sm">
              <CheckSquare className="w-4 h-4" />
              <span>Task Execution</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
              {tasks.completionRate}% Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {tasks.completedCount}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {tasks.completedCount + tasks.pendingCount + tasks.missedCount} completed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div>
              <span className="block font-semibold text-foreground">{tasks.createdCount}</span>
              Created
            </div>
            <div>
              <span className="block font-semibold text-foreground">{tasks.pendingCount}</span>
              Active
            </div>
            <div>
              <span className={`block font-semibold ${tasks.overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {tasks.overdueCount}
              </span>
              Overdue
            </div>
          </div>
        </div>

        {/* Accountability Card */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-500 font-medium text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Commitments & Integrity</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono">
              {accountability.totalFulfilled} Fulfilled
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {accountability.totalActivated}{' '}
            <span className="text-sm font-normal text-muted-foreground">pacts activated</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div>
              <span className="block font-semibold text-emerald-500">{accountability.totalFulfilled}</span>
              Fulfilled
            </div>
            <div>
              <span className="block font-semibold text-amber-500">{accountability.totalWaived}</span>
              Waived
            </div>
            <div>
              <span className={`block font-semibold ${accountability.totalMissed > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {accountability.totalMissed}
              </span>
              Missed
            </div>
          </div>
        </div>

        {/* Focus Work Card */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-500 font-medium text-sm">
              <Timer className="w-4 h-4" />
              <span>Deep Work Focus</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 font-mono">
              {focus.totalSessions} Sessions
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {focus.formattedDuration}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div>
              <span className="block font-semibold text-foreground">{focus.completedSessions}</span>
              Completed
            </div>
            <div>
              <span className="block font-semibold text-foreground">{focus.averageSessionMinutes}m</span>
              Avg Session
            </div>
          </div>
        </div>

        {/* Habits Card */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-500 font-medium text-sm">
              <Repeat className="w-4 h-4" />
              <span>Habit Consistency</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono">
              {habits.completionRate}%
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {habits.completedOccurrences}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {habits.scheduledOccurrences} scheduled
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div>
              <span className="block font-semibold text-emerald-500">{habits.completedOccurrences}</span>
              Completed
            </div>
            <div>
              <span className="block font-semibold text-foreground">{habits.skippedOccurrences}</span>
              Skipped
            </div>
            <div>
              <span className={`block font-semibold ${habits.missedOccurrences > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {habits.missedOccurrences}
              </span>
              Missed
            </div>
          </div>
        </div>

        {/* Finance Card */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-violet-500 font-medium text-sm">
              <Wallet className="w-4 h-4" />
              <span>Financial Cash Flow</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${finance.netCashFlowCents >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
              Net {finance.formattedNet}
            </span>
          </div>
          <div className="flex items-baseline space-x-4">
            <div>
              <span className="text-xs text-muted-foreground flex items-center">
                <ArrowDownRight className="w-3 h-3 text-destructive mr-0.5" /> Outflow
              </span>
              <span className="text-lg font-bold text-foreground">{finance.formattedExpense}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground flex items-center">
                <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-0.5" /> Inflow
              </span>
              <span className="text-lg font-bold text-foreground">{finance.formattedIncome}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
            <span>{finance.exceededBudgetsCount} category budgets exceeded limit</span>
          </div>
        </div>

        {/* Goals & Projects Card */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-medium text-sm">
              <Target className="w-4 h-4" />
              <span>Strategic Focus</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-mono">
              {goalsAndProjects.activeGoalsCount} Active
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {goalsAndProjects.goalsWithProgressCount}{' '}
            <span className="text-sm font-normal text-muted-foreground">goals progressed</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div>
              <span className="block font-semibold text-foreground">{goalsAndProjects.activeProjectsCount}</span>
              Active Projects
            </div>
            <div>
              <span className={`block font-semibold ${goalsAndProjects.stalledGoalsCount > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                {goalsAndProjects.stalledGoalsCount}
              </span>
              Stalled Goals
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

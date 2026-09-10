'use client';

import React from 'react';
import {
  WeeklyFinanceMetrics,
  WeeklyFocusMetrics,
  WeeklyReflection,
} from '@/lib/weekly-review/types';
import { Wallet, Timer, CheckCircle2, Clock } from 'lucide-react';

export interface FinanceFocusStepProps {
  finance: WeeklyFinanceMetrics;
  focus: WeeklyFocusMetrics;
  reflection: WeeklyReflection;
  onUpdateReflection: (field: keyof WeeklyReflection, value: string) => void;
}

export function FinanceFocusStep({
  finance,
  focus,
  reflection,
  onUpdateReflection,
}: FinanceFocusStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            Step 3 • Resource Discipline
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400">Finance & Focus</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 mt-1">
          Financial Discipline & Focus Output
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Review budget discipline and deep work time distribution for the past 7 operating days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Section */}
        <div className="glass-card rounded-2xl p-6 border-white/[0.08] bg-zinc-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-400 font-medium text-xs">
              <Wallet className="w-4 h-4" />
              <span>Financial Performance</span>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                finance.netCashFlowCents >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              Net: {finance.formattedNet}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
              <span className="text-[11px] text-zinc-400 block">Income (Inflow)</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{finance.formattedIncome}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
              <span className="text-[11px] text-zinc-400 block">Expenses (Outflow)</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{finance.formattedExpense}</span>
            </div>
          </div>

          {/* Category Budget Utilization */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Budget Discipline by Category
            </span>
            {finance.categoryUtilizations.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No category budgets defined.</p>
            ) : (
              <div className="space-y-3">
                {finance.categoryUtilizations.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.colorTag }}
                        />
                        <span className="font-medium text-zinc-200">{cat.categoryName}</span>
                      </div>
                      <span className={`font-mono text-xs ${cat.isOverBudget ? 'text-rose-400 font-semibold' : 'text-zinc-400'}`}>
                        {cat.utilizationPercent}% of budget
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          cat.isOverBudget ? 'bg-rose-500' : 'bg-[#d4af37]'
                        }`}
                        style={{ width: `${Math.min(100, cat.utilizationPercent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Focus Work Section */}
        <div className="glass-card rounded-2xl p-6 border-white/[0.08] bg-zinc-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-medium text-xs">
              <Timer className="w-4 h-4" />
              <span>Deep Work Distribution</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono font-semibold">
              {focus.totalSessions} Sessions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
              <span className="text-[11px] text-zinc-400 block">Total Focused Time</span>
              <span className="text-xl font-bold font-mono text-sky-400">{focus.formattedDuration}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
              <span className="text-[11px] text-zinc-400 block">Average Duration</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{focus.averageSessionMinutes} min</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold font-mono text-zinc-100 block text-sm">{focus.completedSessions}</span>
                <span className="text-[11px] text-zinc-400">Completed Sessions</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold font-mono text-zinc-100 block text-sm">{focus.interruptedSessions}</span>
                <span className="text-[11px] text-zinc-400">Interrupted Sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection Inputs for Method & Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            What Worked? <span className="text-zinc-400 font-normal font-sans lowercase">(systems, routines, or focus windows)</span>
          </label>
          <textarea
            value={reflection.whatWorked}
            onChange={(e) => onUpdateReflection('whatWorked', e.target.value)}
            placeholder="e.g. 50-minute morning focus sessions before opening communication channels."
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            What Did Not Work? <span className="text-zinc-400 font-normal font-sans lowercase">(distractions, impulse spending, context switches)</span>
          </label>
          <textarea
            value={reflection.whatDidNotWork}
            onChange={(e) => onUpdateReflection('whatDidNotWork', e.target.value)}
            placeholder="e.g. Afternoon context switching and unplanned dining expenses."
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  WeeklyFinanceMetrics,
  WeeklyFocusMetrics,
  WeeklyReflection,
} from '@/lib/weekly-review/types';
import { Wallet, Timer, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 3: Financial Discipline & Focus Output
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review budget discipline and deep work time distribution for the past 7 days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Section */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-violet-400 font-medium text-sm">
              <Wallet className="w-4 h-4" />
              <span>Financial Performance</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                finance.netCashFlowCents >= 0
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              Net: {finance.formattedNet}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <span className="text-xs text-muted-foreground block">Income (Inflow)</span>
              <span className="text-lg font-bold text-emerald-500">{finance.formattedIncome}</span>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <span className="text-xs text-muted-foreground block">Expenses (Outflow)</span>
              <span className="text-lg font-bold text-foreground">{finance.formattedExpense}</span>
            </div>
          </div>

          {/* Category Budget Utilization */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Budget Discipline by Category
            </span>
            {finance.categoryUtilizations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No category budgets defined.</p>
            ) : (
              <div className="space-y-2.5">
                {finance.categoryUtilizations.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.colorTag }}
                        />
                        <span className="font-medium text-foreground">{cat.categoryName}</span>
                      </div>
                      <span className={cat.isOverBudget ? 'text-destructive font-semibold font-mono' : 'text-muted-foreground font-mono'}>
                        {cat.utilizationPercent}% of budget
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          cat.isOverBudget ? 'bg-destructive' : 'bg-primary'
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
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-400 font-medium text-sm">
              <Timer className="w-4 h-4" />
              <span>Deep Work Distribution</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono font-medium">
              {focus.totalSessions} Sessions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <span className="text-xs text-muted-foreground block">Total Focused Time</span>
              <span className="text-lg font-bold text-sky-400">{focus.formattedDuration}</span>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <span className="text-xs text-muted-foreground block">Average Duration</span>
              <span className="text-lg font-bold text-foreground">{focus.averageSessionMinutes} min</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-background/30 border border-border/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold text-foreground block">{focus.completedSessions}</span>
                <span className="text-muted-foreground">Completed</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-background/30 border border-border/20">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-semibold text-foreground block">{focus.interruptedSessions}</span>
                <span className="text-muted-foreground">Interrupted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection Inputs for Method & Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What Worked? (Systems, habits, routines that helped)
          </label>
          <textarea
            value={reflection.whatWorked}
            onChange={(e) => onUpdateReflection('whatWorked', e.target.value)}
            placeholder="e.g. 50-minute morning focus sessions before checking email."
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What Did Not Work? (Distractions, impulse spending, bottlenecks)
          </label>
          <textarea
            value={reflection.whatDidNotWork}
            onChange={(e) => onUpdateReflection('whatDidNotWork', e.target.value)}
            placeholder="e.g. Late afternoon context switching and unplanned dining expenses."
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </div>
  );
}

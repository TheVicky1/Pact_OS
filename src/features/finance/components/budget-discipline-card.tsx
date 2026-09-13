'use client';

import React from 'react';
import {
  MonthlyBudgetOverview,
  CategoryBudgetStatus,
  FinanceColorTag,
  formatCentsToCurrency,
} from '@/lib/money';
import { Target, AlertTriangle, AlertOctagon, CheckCircle2, Settings } from 'lucide-react';

interface BudgetDisciplineCardProps {
  budgetOverview: MonthlyBudgetOverview;
  currency?: string;
  onManageBudgets: () => void;
}

const COLOR_MAP: Record<FinanceColorTag, { dot: string; text: string; bar: string }> = {
  gold: { dot: 'bg-amber-400', text: 'text-amber-400', bar: 'bg-amber-400' },
  blue: { dot: 'bg-blue-400', text: 'text-blue-400', bar: 'bg-blue-400' },
  purple: { dot: 'bg-purple-400', text: 'text-purple-400', bar: 'bg-purple-400' },
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-400', bar: 'bg-emerald-400' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-500', bar: 'bg-amber-500' },
  rose: { dot: 'bg-rose-400', text: 'text-rose-400', bar: 'bg-rose-400' },
  cyan: { dot: 'bg-cyan-400', text: 'text-cyan-400', bar: 'bg-cyan-400' },
  slate: { dot: 'bg-zinc-400', text: 'text-zinc-400', bar: 'bg-zinc-400' },
};

export function BudgetDisciplineCard({
  budgetOverview,
  currency = 'INR',
  onManageBudgets,
}: BudgetDisciplineCardProps) {
  const hasBudgets = budgetOverview.categories.length > 0;
  const isOverallExceeded = budgetOverview.overallUtilizationPercent >= 100;
  const isOverallApproaching =
    budgetOverview.overallUtilizationPercent >= 80 && !isOverallExceeded;

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Target className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Budget Discipline</h2>
              <p className="text-xs text-zinc-400">Category spending caps and discipline alerts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onManageBudgets}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Set Budgets</span>
          </button>
        </div>

        {/* Overall Utilization Bar (if budgets exist) */}
        {hasBudgets && (
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400 font-medium">Total Budget Spent</span>
              <span className="font-mono font-semibold text-zinc-200">
                {formatCentsToCurrency(budgetOverview.totalBudgetSpentCents, currency)} /{' '}
                {formatCentsToCurrency(budgetOverview.totalBudgetLimitCents, currency)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-1.5">
              <div
                className={`h-full transition-all duration-500 ${
                  isOverallExceeded
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : isOverallApproaching
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(budgetOverview.overallUtilizationPercent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                {isOverallExceeded ? (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertOctagon className="w-3 h-3" /> Over Budget (
                    {formatCentsToCurrency(
                      Math.abs(budgetOverview.totalBudgetRemainingCents),
                      currency
                    )}
                    )
                  </span>
                ) : isOverallApproaching ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Warning (
                    {budgetOverview.overallUtilizationPercent}%)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> On Track (
                    {formatCentsToCurrency(budgetOverview.totalBudgetRemainingCents, currency)}{' '}
                    left)
                  </span>
                )}
              </span>
              <span>{budgetOverview.overallUtilizationPercent}% Utilized</span>
            </div>
          </div>
        )}

        {/* Categories List */}
        {!hasBudgets ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <Target className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No monthly budgets configured</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Establish monthly spending caps per category to track discipline and receive threshold alerts.
            </p>
            <button
              type="button"
              onClick={onManageBudgets}
              className="mt-4 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure Category Limits</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {budgetOverview.categories.map((catStatus: CategoryBudgetStatus) => {
              const theme = COLOR_MAP[catStatus.colorTag] || COLOR_MAP.gold;
              const isExceeded = catStatus.isExceeded;
              const isApproaching = catStatus.isApproaching;

              return (
                <div
                  key={catStatus.budgetId}
                  className={`p-3 rounded-xl border transition-all ${
                    isExceeded
                      ? 'bg-rose-950/20 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                      : isApproaching
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                      <span className="text-xs font-semibold text-white">
                        {catStatus.categoryName}
                      </span>
                      {isExceeded && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                          <AlertOctagon className="w-2.5 h-2.5" /> Exceeded
                        </span>
                      )}
                      {isApproaching && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> ≥80%
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-zinc-200">
                        {formatCentsToCurrency(catStatus.spentCents, currency)}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {' '}
                        / {formatCentsToCurrency(catStatus.limitCents, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isApproaching
                          ? 'bg-amber-400'
                          : theme.bar
                      }`}
                      style={{ width: `${Math.min(catStatus.utilizationPercent, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>{catStatus.utilizationPercent}% of limit</span>
                    <span>
                      {isExceeded ? (
                        <span className="text-rose-400">
                          +{formatCentsToCurrency(Math.max(0, catStatus.spentCents - catStatus.limitCents), currency)} over
                        </span>
                      ) : (
                        <span className="text-zinc-400">
                          {formatCentsToCurrency(catStatus.remainingCents, currency)} left
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
        <span>{budgetOverview.categories.length} category caps active</span>
        <span className="font-mono text-[11px] text-zinc-400">
          {budgetOverview.exceededCount > 0
            ? `${budgetOverview.exceededCount} exceeded`
            : 'All within budget'}
        </span>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { MonthlyTrendItem, formatCentsToCurrency } from '@/lib/money';
import { TrendingUp } from 'lucide-react';

interface MonthlyTrendCardProps {
  trends: MonthlyTrendItem[];
  currency?: string;
}

export function MonthlyTrendCard({ trends, currency = 'INR' }: MonthlyTrendCardProps) {
  const hasData = trends.some((t) => t.incomeCents > 0 || t.expenseCents > 0);

  // Find max value across income and expenses to scale bars proportionally
  const maxCents = Math.max(
    ...trends.map((t) => Math.max(t.incomeCents, t.expenseCents)),
    1 // avoid division by zero
  );

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-white">Monthly Trend</h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" aria-hidden="true" />
              <span className="text-zinc-400">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" aria-hidden="true" />
              <span className="text-zinc-400">Expenses</span>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <TrendingUp className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No trend data recorded</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Income and expenses logged across months will generate historical trends here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div
              className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 pb-2 border-b border-white/[0.06]"
              role="region"
              aria-label="Monthly income and expense trend chart"
            >
              {trends.map((item) => {
                const incomeHeightPct = Math.round((item.incomeCents / maxCents) * 100);
                const expenseHeightPct = Math.round((item.expenseCents / maxCents) * 100);

                return (
                  <div key={item.monthKey} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1 sm:gap-1.5 h-full w-full max-w-[40px] justify-center">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${Math.max(incomeHeightPct, 4)}%` }}
                        className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                          item.incomeCents > 0
                            ? 'bg-emerald-400/80 group-hover:bg-emerald-400'
                            : 'bg-zinc-800/40'
                        }`}
                        title={`${item.monthLabel} Income: ${formatCentsToCurrency(item.incomeCents, currency)}`}
                      />

                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expenseHeightPct, 4)}%` }}
                        className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                          item.expenseCents > 0
                            ? 'bg-rose-400/80 group-hover:bg-rose-400'
                            : 'bg-zinc-800/40'
                        }`}
                        title={`${item.monthLabel} Expenses: ${formatCentsToCurrency(item.expenseCents, currency)}`}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono mt-2 truncate w-full text-center">
                      {item.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Past 6 months</span>
              <span className="font-mono">Real transaction facts only</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

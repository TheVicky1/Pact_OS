'use client';

import React from 'react';
import { CategoryBreakdownItem, formatCentsToCurrency, FinanceColorTag } from '@/lib/money';
import { PieChart, Plus } from 'lucide-react';

interface SpendingBreakdownCardProps {
  breakdown: CategoryBreakdownItem[];
  currency?: string;
  onAddExpense?: () => void;
}

const COLOR_MAP: Record<FinanceColorTag, { bar: string; dot: string; text: string }> = {
  gold: { bar: 'bg-amber-400', dot: 'bg-amber-400', text: 'text-amber-400' },
  blue: { bar: 'bg-blue-400', dot: 'bg-blue-400', text: 'text-blue-400' },
  purple: { bar: 'bg-purple-400', dot: 'bg-purple-400', text: 'text-purple-400' },
  emerald: { bar: 'bg-emerald-400', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  amber: { bar: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-500' },
  rose: { bar: 'bg-rose-400', dot: 'bg-rose-400', text: 'text-rose-400' },
  cyan: { bar: 'bg-cyan-400', dot: 'bg-cyan-400', text: 'text-cyan-400' },
  slate: { bar: 'bg-zinc-400', dot: 'bg-zinc-400', text: 'text-zinc-400' },
};

export function SpendingBreakdownCard({
  breakdown,
  currency = 'INR',
  onAddExpense,
}: SpendingBreakdownCardProps) {
  const hasExpenses = breakdown.length > 0;

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400">
              <PieChart className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-white">Spending Breakdown</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {breakdown.length} {breakdown.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {!hasExpenses ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <PieChart className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No expenses recorded for this period</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Log your spending to see an automated breakdown by category.
            </p>
            {onAddExpense && (
              <button
                type="button"
                onClick={onAddExpense}
                className="mt-4 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add Expense
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Multi-segment visual bar */}
            <div
              className="h-2.5 w-full rounded-full bg-zinc-900 overflow-hidden flex"
              role="progressbar"
              aria-label="Category spending distribution"
            >
              {breakdown.map((item) => {
                const colorConfig = COLOR_MAP[item.colorTag] || COLOR_MAP.slate;
                return (
                  <div
                    key={item.categoryId || 'uncategorized'}
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full ${colorConfig.bar} transition-all duration-500`}
                    title={`${item.categoryName}: ${item.percentage}%`}
                  />
                );
              })}
            </div>

            {/* Category rows */}
            <div className="divide-y divide-white/[0.04] pt-2">
              {breakdown.map((item) => {
                const colorConfig = COLOR_MAP[item.colorTag] || COLOR_MAP.slate;
                return (
                  <div
                    key={item.categoryId || 'uncategorized'}
                    className="py-2.5 flex items-center justify-between text-sm hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.dot}`} aria-hidden="true" />
                      <span className="font-medium text-zinc-200">{item.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-mono">
                        {item.percentage}%
                      </span>
                      <span className="font-mono font-semibold text-white">
                        {formatCentsToCurrency(item.totalCents, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

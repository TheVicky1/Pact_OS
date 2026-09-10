'use client';

import React from 'react';
import {
  FinanceRecurringTransaction,
  FinanceColorTag,
  formatCentsToCurrency,
  generateUpcomingOccurrences,
} from '@/lib/money';
import { RefreshCw, Plus, Play, Pause, Trash2, Edit3, Calendar } from 'lucide-react';

interface RecurringTransactionsCardProps {
  recurringTransactions: FinanceRecurringTransaction[];
  currency?: string;
  onAddRecurring: () => void;
  onEditRecurring: (item: FinanceRecurringTransaction) => void;
  onToggleStatus: (item: FinanceRecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
  onRunDue: () => void;
  isRunningDue?: boolean;
}

const COLOR_MAP: Record<FinanceColorTag, { badge: string; text: string }> = {
  gold: { badge: 'bg-amber-400/10 text-amber-400 border-amber-400/30', text: 'text-amber-400' },
  blue: { badge: 'bg-blue-400/10 text-blue-400 border-blue-400/30', text: 'text-blue-400' },
  purple: { badge: 'bg-purple-400/10 text-purple-400 border-purple-400/30', text: 'text-purple-400' },
  emerald: { badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30', text: 'text-emerald-400' },
  amber: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30', text: 'text-amber-500' },
  rose: { badge: 'bg-rose-400/10 text-rose-400 border-rose-400/30', text: 'text-rose-400' },
  cyan: { badge: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30', text: 'text-cyan-400' },
  slate: { badge: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/30', text: 'text-zinc-300' },
};

export function RecurringTransactionsCard({
  recurringTransactions,
  currency = 'INR',
  onAddRecurring,
  onEditRecurring,
  onToggleStatus,
  onDeleteRecurring,
  onRunDue,
  isRunningDue = false,
}: RecurringTransactionsCardProps) {
  const activeCount = recurringTransactions.filter((r) => r.status === 'active').length;

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Subscriptions & Recurring</h2>
              <p className="text-xs text-zinc-400">Automated recurring billing and commitments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRunDue}
              disabled={isRunningDue}
              title="Process due recurring schedules immediately"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningDue ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Run Due</span>
            </button>
            <button
              type="button"
              onClick={onAddRecurring}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recurring</span>
            </button>
          </div>
        </div>

        {recurringTransactions.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <RefreshCw className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No active subscriptions or recurring schedules</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Add fixed monthly commitments, subscriptions, or recurring income to auto-generate entries.
            </p>
            <button
              type="button"
              onClick={onAddRecurring}
              className="mt-4 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Subscription</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recurringTransactions.map((item) => {
              const colorTag = (item.categories?.color_tag as FinanceColorTag) || 'slate';
              const catTheme = COLOR_MAP[colorTag] || COLOR_MAP.slate;
              const isExpense = item.type === 'expense';
              const upcoming = generateUpcomingOccurrences(item, 2);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.status === 'paused'
                      ? 'bg-zinc-900/30 border-white/[0.04] opacity-75'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {item.description}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${catTheme.badge}`}
                        >
                          {item.categories?.name || 'General'}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                          {item.frequency}
                        </span>
                        {item.status === 'paused' && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-zinc-400">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          Next: <strong className="text-zinc-300 font-semibold">{item.next_occurrence}</strong>
                        </span>
                        {upcoming.length > 1 && (
                          <span className="text-[11px] text-zinc-400 hidden sm:inline">
                            (Followed by: {upcoming.slice(1).join(', ')})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-sm font-semibold font-mono ${
                          isExpense ? 'text-zinc-200' : 'text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCentsToCurrency(item.amount_cents, currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item)}
                          title={item.status === 'active' ? 'Pause subscription' : 'Resume subscription'}
                          className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                        >
                          {item.status === 'active' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditRecurring(item)}
                          title="Edit subscription"
                          className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRecurring(item.id)}
                          title="Delete subscription"
                          className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
        <span>{activeCount} active recurring commitments</span>
        <span className="font-mono text-[11px] text-zinc-400">Server-swept daily</span>
      </div>
    </div>
  );
}

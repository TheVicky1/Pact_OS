'use client';

import React from 'react';
import { FinanceSummary, formatCentsToCurrency } from '@/lib/money';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';

interface FinanceSummaryCardsProps {
  summary: FinanceSummary;
  currency?: string;
}

export function FinanceSummaryCards({ summary, currency = 'INR' }: FinanceSummaryCardsProps) {
  const isNetPositive = summary.netSavingsCents >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Financial Summary">
      {/* 1. Total Balance */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-white/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Balance</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wallet className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono">
          {formatCentsToCurrency(summary.balanceCents, currency)}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Cumulative net position
        </p>
      </div>

      {/* 2. Monthly Income */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Monthly Income</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-emerald-400 font-mono">
          {formatCentsToCurrency(summary.totalIncomeCents, currency)}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Total earnings this period
        </p>
      </div>

      {/* 3. Monthly Expenses */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-rose-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Monthly Expenses</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-rose-400 font-mono">
          {formatCentsToCurrency(summary.totalExpensesCents, currency)}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Total spent this period
        </p>
      </div>

      {/* 4. Net Savings */}
      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-white/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Net Savings</span>
          <div className={`p-2 rounded-xl ${isNetPositive ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            <PiggyBank className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        <div className={`text-2xl lg:text-3xl font-bold tracking-tight font-mono ${isNetPositive ? 'text-white' : 'text-rose-400'}`}>
          {formatCentsToCurrency(summary.netSavingsCents, currency)}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${summary.savingsRatePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {summary.savingsRatePercent}% saved
          </span>
        </div>
      </div>
    </div>
  );
}

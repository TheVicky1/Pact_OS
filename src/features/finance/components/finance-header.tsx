'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, FolderCog, RotateCcw } from 'lucide-react';
import { formatMonthLabel } from '@/lib/money';

interface FinanceHeaderProps {
  currentYearMonth: string; // "YYYY-MM"
  onMonthChange: (yearMonth: string) => void;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onManageCategories: () => void;
  isLoading?: boolean;
}

export function FinanceHeader({
  currentYearMonth,
  onMonthChange,
  onAddExpense,
  onAddIncome,
  onManageCategories,
  isLoading = false,
}: FinanceHeaderProps) {
  const [year, month] = currentYearMonth.split('-').map(Number);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleResetToCurrent = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    onMonthChange(`${curYear}-${String(curMonth).padStart(2, '0')}`);
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-white/[0.06]">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-400">FINANCIAL COMMAND</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-0.5">
          Your Finances
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Month Selector Navigation */}
        <div className="flex items-center rounded-xl bg-zinc-950/60 border border-white/[0.08] p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-sm font-semibold text-white font-mono min-w-[130px] text-center">
            {formatMonthLabel(currentYearMonth)}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Today/Current month shortcut */}
        <button
          type="button"
          onClick={handleResetToCurrent}
          disabled={isLoading}
          className="p-2 rounded-xl bg-zinc-950/60 border border-white/[0.08] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5"
          title="Jump to Current Month"
          aria-label="Jump to Current Month"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Current</span>
        </button>

        {/* Category Manager Button */}
        <button
          type="button"
          onClick={onManageCategories}
          disabled={isLoading}
          className="px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <FolderCog className="w-3.5 h-3.5" />
          <span>Categories</span>
        </button>

        {/* Add Income Button */}
        <button
          type="button"
          onClick={onAddIncome}
          disabled={isLoading}
          className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Income</span>
        </button>

        {/* Add Expense Primary Button */}
        <button
          type="button"
          onClick={onAddExpense}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:from-amber-300 hover:to-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Expense</span>
        </button>
      </div>
    </header>
  );
}

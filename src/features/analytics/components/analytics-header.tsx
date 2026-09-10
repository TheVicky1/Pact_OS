'use client';

import React from 'react';
import { AnalyticsTimeRange } from '@/lib/analytics';
import { ChevronLeft, ChevronRight, RotateCcw, BarChart2 } from 'lucide-react';

interface AnalyticsHeaderProps {
  timeRange: AnalyticsTimeRange;
  periodLabel: string;
  onTimeRangeChange: (range: AnalyticsTimeRange) => void;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onCurrentPeriod: () => void;
  isLoading?: boolean;
}

export function AnalyticsHeader({
  timeRange,
  periodLabel,
  onTimeRangeChange,
  onPrevPeriod,
  onNextPeriod,
  onCurrentPeriod,
  isLoading = false,
}: AnalyticsHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-white/[0.06]">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-400">
            PERFORMANCE & PATTERNS
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-0.5 flex items-center gap-2.5">
          <BarChart2 className="w-6 h-6 text-amber-400 hidden sm:inline" />
          Your Progress
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Time-Range Segmented Tabs [ Week | Month | Quarter ] */}
        <div
          className="flex rounded-xl bg-zinc-950/60 p-1 border border-white/[0.08] backdrop-blur-md"
          role="tablist"
          aria-label="Analytics Time Range Filter"
        >
          <button
            type="button"
            role="tab"
            aria-selected={timeRange === 'week'}
            onClick={() => onTimeRangeChange('week')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeRange === 'week'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={timeRange === 'month'}
            onClick={() => onTimeRangeChange('month')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeRange === 'month'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={timeRange === 'quarter'}
            onClick={() => onTimeRangeChange('quarter')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeRange === 'quarter'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Quarter
          </button>
        </div>

        {/* Period Navigation */}
        <div className="flex items-center rounded-xl bg-zinc-950/60 border border-white/[0.08] p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={onPrevPeriod}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Previous Period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-xs sm:text-sm font-semibold text-white font-mono min-w-[140px] text-center">
            {periodLabel}
          </span>

          <button
            type="button"
            onClick={onNextPeriod}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Next Period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Jump to Current Period */}
        <button
          type="button"
          onClick={onCurrentPeriod}
          disabled={isLoading}
          className="p-2 rounded-xl bg-zinc-950/60 border border-white/[0.08] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5"
          title="Jump to Current Period"
          aria-label="Jump to Current Period"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Current</span>
        </button>
      </div>
    </header>
  );
}

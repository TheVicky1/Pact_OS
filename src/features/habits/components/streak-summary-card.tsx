'use client';

import React from 'react';
import { calculateOverallHabitMetrics } from '@/lib/habits/streaks';
import { Flame, CheckCircle, TrendingUp, Trophy } from 'lucide-react';

interface StreakSummaryCardProps {
  metrics: ReturnType<typeof calculateOverallHabitMetrics>;
}

export function StreakSummaryCard({ metrics }: StreakSummaryCardProps) {
  const {
    totalActiveHabits,
    scheduledTodayCount,
    completedTodayCount,
    todayCompletionPercentage,
    averageCompletionRate,
    highestStreak,
  } = metrics;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Today's Progress */}
      <div className="bg-[#121217]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl transition-all duration-200 hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Today&apos;s Target
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-zinc-100">
            {completedTodayCount}/{scheduledTodayCount}
          </span>
          <span className="text-xs font-mono font-medium text-emerald-400">
            {todayCompletionPercentage}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
            style={{ width: `${todayCompletionPercentage}%` }}
          />
        </div>
      </div>

      {/* 2. Top Active Streak */}
      <div className="bg-[#121217]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl transition-all duration-200 hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Top Streak
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-zinc-100">
            {highestStreak}
          </span>
          <span className="text-xs text-zinc-400">consecutive days</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">Active momentum across {totalActiveHabits} habits</p>
      </div>

      {/* 3. Consistency Adherence */}
      <div className="bg-[#121217]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl transition-all duration-200 hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Adherence Rate
          </span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-zinc-100">
            {averageCompletionRate}%
          </span>
          <span className="text-xs text-cyan-400">consistency</span>
        </div>
        <div className="mt-2.5 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500 rounded-full"
            style={{ width: `${averageCompletionRate}%` }}
          />
        </div>
      </div>

      {/* 4. Total Active Habits */}
      <div className="bg-[#121217]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl transition-all duration-200 hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Habits
          </span>
          <div className="p-1.5 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-zinc-100">
            {totalActiveHabits}
          </span>
          <span className="text-xs text-zinc-400">commitments</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">Deterministic behavioral execution</p>
      </div>
    </div>
  );
}

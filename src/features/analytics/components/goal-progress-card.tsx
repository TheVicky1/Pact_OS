'use client';

import React from 'react';
import Link from 'next/link';
import { GoalProgressItem } from '@/lib/analytics';
import { Target, ArrowUpRight, Plus } from 'lucide-react';

interface GoalProgressCardProps {
  goals: GoalProgressItem[];
}

export function GoalProgressCard({ goals }: GoalProgressCardProps) {
  const hasGoals = goals.length > 0;

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between h-full space-y-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400">
              <Target className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Goal Progress</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Task execution against active goals</p>
            </div>
          </div>

          <Link
            href="/app/goals"
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!hasGoals ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-xl">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-2">
              <Target className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-zinc-300">No active goals yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 max-w-xs">
              Create goals to align and track your commitments over time.
            </p>
            <Link
              href="/app/goals"
              className="mt-3 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Goal
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-3.5 rounded-xl bg-zinc-900/40 border border-white/[0.04] hover:border-white/[0.1] transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
                    {goal.title}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {goal.progressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={goal.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    style={{ width: `${goal.progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>
                    {goal.completedTasks} of {goal.totalTasks} task{goal.totalTasks === 1 ? '' : 's'} completed
                  </span>
                  {goal.targetDate && <span>Target: {goal.targetDate}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

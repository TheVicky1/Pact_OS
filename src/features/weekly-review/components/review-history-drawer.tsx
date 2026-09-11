'use client';

import React from 'react';
import { WeeklyReview } from '@/lib/weekly-review/types';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export interface ReviewHistoryDrawerProps {
  reviews: WeeklyReview[];
  currentWeekStart: string;
}

export function ReviewHistoryDrawer({
  reviews,
  currentWeekStart,
}: ReviewHistoryDrawerProps) {
  if (reviews.length === 0) {
    return (
      <div className="p-12 rounded-3xl border border-white/[0.08] bg-zinc-900/40 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">No Historical Reviews</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Completed weekly reviews will be preserved here with certified, immutable metrics snapshots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Weekly Review Archive ({reviews.length})
        </span>
        <span className="text-xs text-zinc-500 font-mono">Immutable Snapshots</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((r) => {
          const isCurrent = r.week_start === currentWeekStart;
          const isCompleted = r.status === 'completed';
          const metrics = r.snapshot_metrics;
          const prioritiesCount = r.next_week_plan?.topPriorities?.length || 0;

          return (
            <Link
              key={r.id}
              href={`/app/review?week=${r.week_start}`}
              className={`glass-card rounded-2xl p-5 border transition-all text-left space-y-3.5 block group ${
                isCurrent
                  ? 'border-[#d4af37]/50 bg-[#15141c] shadow-md shadow-black/40'
                  : 'border-white/[0.08] bg-zinc-900/60 hover:border-white/[0.16] hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                  <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{r.week_start} – {r.week_end}</span>
                </div>
                <Badge
                  variant={isCompleted ? 'success' : 'warning'}
                  size="sm"
                >
                  {isCompleted ? 'Locked' : 'Draft'}
                </Badge>
              </div>

              {metrics && (
                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400 pt-2 border-t border-white/[0.06]">
                  <div>
                    <span className="font-bold font-mono text-zinc-200 block text-sm">
                      {metrics.tasks.completionRate}%
                    </span>
                    <span className="text-[10px] text-zinc-400">Tasks Rate</span>
                  </div>
                  <div>
                    <span className="font-bold font-mono text-sky-400 block text-sm">
                      {metrics.focus.formattedDuration}
                    </span>
                    <span className="text-[10px] text-zinc-400">Deep Work</span>
                  </div>
                  <div>
                    <span className="font-bold font-mono text-emerald-400 block text-sm">
                      {metrics.accountability.totalFulfilled}
                    </span>
                    <span className="text-[10px] text-zinc-400">Pacts Done</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span>{prioritiesCount} priorities committed</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

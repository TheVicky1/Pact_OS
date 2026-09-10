'use client';

import React from 'react';
import { WeeklyReview } from '@/lib/weekly-review/types';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

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
      <div className="p-6 rounded-xl border border-border/40 bg-card/30 text-center space-y-2">
        <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-foreground">No Historical Reviews</p>
        <p className="text-xs text-muted-foreground">
          Completed weekly reviews will be preserved here with immutable metrics snapshots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
        Weekly Review Archive ({reviews.length})
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {reviews.map((r) => {
          const isCurrent = r.week_start === currentWeekStart;
          const isCompleted = r.status === 'completed';
          const metrics = r.snapshot_metrics;
          const prioritiesCount = r.next_week_plan?.topPriorities?.length || 0;

          return (
            <Link
              key={r.id}
              href={`/app/review?week=${r.week_start}`}
              className={`p-4 rounded-xl border transition-all text-left space-y-3 block ${
                isCurrent
                  ? 'border-primary/60 bg-primary/5 shadow-sm'
                  : 'border-border/50 bg-card/40 hover:border-border/80 hover:bg-card/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-medium text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{r.week_start} to {r.week_end}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-500 font-semibold'
                      : 'bg-amber-500/10 text-amber-500 font-semibold'
                  }`}
                >
                  {isCompleted ? 'Locked' : 'Draft'}
                </span>
              </div>

              {metrics && (
                <div className="grid grid-cols-3 gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                  <div>
                    <span className="font-semibold text-foreground block">
                      {metrics.tasks.completionRate}%
                    </span>
                    Tasks
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">
                      {metrics.focus.formattedDuration}
                    </span>
                    Focus
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">
                      {metrics.accountability.totalFulfilled}
                    </span>
                    Pacts
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{prioritiesCount} priorities committed</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

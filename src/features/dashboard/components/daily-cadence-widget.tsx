'use client';

import React, { useMemo } from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { BarChart3 } from 'lucide-react';

export interface DailyCadenceWidgetProps {
  tasks: TaskWithParents[];
  timezone: string;
}

interface Bucket {
  label: string;
  hourRange: string;
  count: number;
  hasUrgent: boolean;
}

/**
 * PACT Daily Cadence / Execution Distribution Widget
 * Visual histogram plotting commitment volume across local 24-hour day intervals.
 * Direct translation of the reference bar histogram using real task deadlines.
 */
export function DailyCadenceWidget({ tasks, timezone }: DailyCadenceWidgetProps) {
  // Aggregate tasks into 6 local 4-hour buckets
  const { buckets, maxCount, peakLabel } = useMemo(() => {
    const rawBuckets: Bucket[] = [
      { label: 'Night', hourRange: '12am - 4am', count: 0, hasUrgent: false },
      { label: 'Dawn', hourRange: '4am - 8am', count: 0, hasUrgent: false },
      { label: 'Morning', hourRange: '8am - 12pm', count: 0, hasUrgent: false },
      { label: 'Afternoon', hourRange: '12pm - 4pm', count: 0, hasUrgent: false },
      { label: 'Evening', hourRange: '4pm - 8pm', count: 0, hasUrgent: false },
      { label: 'Late', hourRange: '8pm - 12am', count: 0, hasUrgent: false },
    ];

    for (const task of tasks) {
      try {
        const hour = parseInt(
          new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false,
          }).format(new Date(task.deadline_at)),
          10
        );

        const bucketIndex = Math.min(Math.floor(hour / 4), 5);
        rawBuckets[bucketIndex].count += 1;
        if (task.priority === 'urgent' || task.priority === 'high') {
          rawBuckets[bucketIndex].hasUrgent = true;
        }
      } catch {
        // Skip invalid date strings gracefully
      }
    }

    let max = 0;
    let peak = 'Even';
    for (const b of rawBuckets) {
      if (b.count > max) {
        max = b.count;
        peak = b.label;
      }
    }

    return { buckets: rawBuckets, maxCount: Math.max(max, 1), peakLabel: max > 0 ? peak : 'Balanced' };
  }, [tasks, timezone]);

  return (
    <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[#0C0C0F] border border-white/[0.06] p-5 sm:p-6 shadow-xl shadow-black/60 relative overflow-hidden transition-all duration-200 hover:border-[#D4AF37]/30 hover:shadow-2xl hover:shadow-black/80 group">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8B92]">
            24h Cadence
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#101012] border border-[#D4AF37]/30 text-[#D4AF37]">
            Peak: {peakLabel}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-[#101012] border border-white/[0.06] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/25 transition-colors">
          <BarChart3 className="w-4 h-4" />
        </div>
      </div>

      {/* Histogram Bar Chart */}
      <div className="relative z-10 my-auto py-3">
        <div className="relative h-24 flex items-end justify-between gap-2 pt-4 px-1">
          {/* Subtle threshold guideline */}
          <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-white/[0.04] pointer-events-none" />

          {buckets.map((bucket) => {
            const heightPercent = bucket.count > 0 ? Math.max((bucket.count / maxCount) * 100, 24) : 8;
            const isPeak = bucket.count === maxCount && maxCount > 0;

            return (
              <div
                key={bucket.label}
                className="flex-1 flex flex-col items-center gap-2 group/bar cursor-default"
                title={`${bucket.label} (${bucket.hourRange}): ${bucket.count} tasks`}
              >
                <div className="w-full h-16 flex items-end justify-center">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[22px] rounded-t-md transition-all duration-200 ${
                      isPeak
                        ? 'bg-gradient-to-t from-[#AA820A] to-[#D4AF37] shadow-md shadow-[#D4AF37]/20 border-t border-x border-[#E6C34A]/50'
                        : bucket.count > 0
                        ? 'bg-zinc-700/60 group-hover/bar:bg-zinc-600/80 border-t border-x border-white/[0.08]'
                        : 'bg-zinc-800/25'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-[#71717A] font-mono tracking-tighter truncate max-w-[38px] group-hover/bar:text-[#E8E8E8] transition-colors">
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-[#71717A] font-mono">
        <span>Distribution across day</span>
        <span>{tasks.length} total</span>
      </div>
    </div>
  );
}

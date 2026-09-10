'use client';

import React, { useMemo } from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { GlassCard, Badge } from '@/components/ui';
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
    <GlassCard
      variant="default"
      padding="md"
      className="h-full flex flex-col justify-between min-h-[190px] relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            24h Cadence
          </span>
          <Badge variant="gold" size="sm">
            Peak: {peakLabel}
          </Badge>
        </div>
        <BarChart3 className="w-4 h-4 text-[#d4af37]" />
      </div>

      {/* Histogram Bar Chart */}
      <div className="my-auto py-3">
        <div className="relative h-20 flex items-end justify-between gap-2 pt-4 px-1">
          {/* Subtle threshold guideline */}
          <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-white/[0.12] pointer-events-none" />

          {buckets.map((bucket) => {
            const heightPercent = bucket.count > 0 ? Math.max((bucket.count / maxCount) * 100, 24) : 10;
            const isPeak = bucket.count === maxCount && maxCount > 0;

            return (
              <div
                key={bucket.label}
                className="flex-1 flex flex-col items-center gap-1.5 group cursor-default"
                title={`${bucket.label} (${bucket.hourRange}): ${bucket.count} tasks`}
              >
                <div className="w-full h-16 flex items-end justify-center">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[24px] rounded-full transition-all duration-300 ${
                      isPeak
                        ? 'bg-gradient-to-t from-[#aa820a] to-[#d4af37] shadow-lg shadow-[#d4af37]/20 border border-[#d4af37]/60'
                        : bucket.count > 0
                        ? 'bg-zinc-700/80 hover:bg-zinc-600/90 border border-white/[0.08]'
                        : 'bg-zinc-800/40'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-tighter truncate max-w-[36px]">
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <span>Distribution across day</span>
        <span>{tasks.length} total</span>
      </div>
    </GlassCard>
  );
}

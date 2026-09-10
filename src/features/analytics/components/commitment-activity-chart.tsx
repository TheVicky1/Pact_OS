'use client';

import React from 'react';
import { ActivityTrendPoint } from '@/lib/analytics';
import { BarChart3 } from 'lucide-react';

interface CommitmentActivityChartProps {
  activityTrends: ActivityTrendPoint[];
  periodLabel: string;
}

export function CommitmentActivityChart({
  activityTrends,
  periodLabel,
}: CommitmentActivityChartProps) {
  const hasData = activityTrends.some((p) => p.totalCount > 0);

  // Compute maximum count to scale bars proportionally
  const maxVolume = Math.max(
    ...activityTrends.map((p) => Math.max(p.completedCount, p.missedCount)),
    1
  );

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md space-y-6">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400">
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Commitment Activity</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Execution volume across {periodLabel}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" aria-hidden="true" />
            <span className="text-zinc-300">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" aria-hidden="true" />
            <span className="text-zinc-300">Missed</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
            <BarChart3 className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-zinc-300">No commitment activity in this period</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Commitments due during this period will automatically generate execution bars here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {/* Histogram Bar Grid */}
          <div
            className="grid gap-2 sm:gap-4 items-end h-48 pb-2 border-b border-white/[0.06]"
            style={{
              gridTemplateColumns: `repeat(${activityTrends.length}, minmax(0, 1fr))`,
            }}
            role="region"
            aria-label="Commitment activity execution chart"
          >
            {activityTrends.map((point) => {
              const completedHeightPct = Math.round((point.completedCount / maxVolume) * 100);
              const missedHeightPct = Math.round((point.missedCount / maxVolume) * 100);

              return (
                <div key={point.key} className="flex flex-col items-center h-full justify-end group">
                  <div className="flex items-end gap-1 sm:gap-1.5 h-full w-full max-w-[44px] justify-center">
                    {/* Completed Bar */}
                    <div
                      style={{ height: `${Math.max(completedHeightPct, 4)}%` }}
                      className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                        point.completedCount > 0
                          ? 'bg-emerald-400/80 group-hover:bg-emerald-400 shadow-sm shadow-emerald-500/20'
                          : 'bg-zinc-800/40'
                      }`}
                      title={`${point.label}: ${point.completedCount} completed`}
                    />

                    {/* Missed Bar */}
                    <div
                      style={{ height: `${Math.max(missedHeightPct, 4)}%` }}
                      className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                        point.missedCount > 0
                          ? 'bg-rose-400/80 group-hover:bg-rose-400 shadow-sm shadow-rose-500/20'
                          : 'bg-zinc-800/40'
                      }`}
                      title={`${point.label}: ${point.missedCount} missed`}
                    />
                  </div>

                  <span className="text-[11px] text-zinc-400 font-mono mt-2 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 font-mono">
            <span>Authoritative deadline evaluations</span>
            <span>Real task facts only</span>
          </div>
        </div>
      )}
    </div>
  );
}

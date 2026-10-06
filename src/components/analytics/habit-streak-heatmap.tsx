'use client';

import React, { useMemo, useRef, useState } from 'react';

export interface DailyCompletionRecord {
  date: string; // YYYY-MM-DD
  count: number;
  target: number;
}

export type IntensityTier = 0 | 1 | 2 | 3 | 4;

export interface StreakHeatmapCell extends DailyCompletionRecord {
  tier: IntensityTier;
}

export const HEATMAP_WEEKS = 52;

const TIER_COLORS: Record<IntensityTier, string> = {
  0: 'bg-[#141419] border-white/[0.04]',
  1: 'bg-[#423408] border-[#614b0e]',
  2: 'bg-[#785e0d] border-[#a17e13]',
  3: 'bg-[#b89218] border-[#d4af37]',
  4: 'bg-[#f0cb46] border-[#fef08a] shadow-[0_0_8px_rgba(240,203,70,0.35)]',
};

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/** Completion percentage, capped at 100. A day with completions but no target counts as 100%. */
export function getCompletionPercent(count: number, target: number): number {
  if (count <= 0) return 0;
  return target > 0 ? Math.min(100, (count / target) * 100) : 100;
}

/** Maps a day to its colour tier: 0 = none, 1 = 1–25%, 2 = 26–50%, 3 = 51–75%, 4 = 76–100%. */
export function getIntensityTier(count: number, target: number): IntensityTier {
  const pct = getCompletionPercent(count, target);
  if (pct === 0) return 0;
  return pct <= 25 ? 1 : pct <= 50 ? 2 : pct <= 75 ? 3 : 4;
}

/**
 * Builds HEATMAP_WEEKS week columns (index 0 = Sunday) ending with the week that contains
 * `endDate`. Dates without a record count as zero; days after `endDate` are `null`.
 */
export function buildStreakHeatmapWeeks(
  records: DailyCompletionRecord[],
  endDate: string
): (StreakHeatmapCell | null)[][] {
  const byDate = new Map(records.map((r) => [r.date, r]));
  const [y, m, d] = endDate.split('-').map(Number);
  const end = new Date(Date.UTC(y, m - 1, d));
  const day = new Date(end);
  day.setUTCDate(day.getUTCDate() - end.getUTCDay() - (HEATMAP_WEEKS - 1) * 7);

  const weeks: (StreakHeatmapCell | null)[][] = [];
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const week: (StreakHeatmapCell | null)[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const date = day.toISOString().slice(0, 10);
      const { count = 0, target = 0 } = byDate.get(date) ?? {};
      week.push(day > end ? null : { date, count, target, tier: getIntensityTier(count, target) });
      day.setUTCDate(day.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function formatHeatmapDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Screen-reader label, e.g. "Oct 6, 2026: 4 of 5 habits completed". */
export function getCellLabel({ date, count, target }: DailyCompletionRecord): string {
  const done = target > 0 ? `${count} of ${target}` : `${count}`;
  return `${formatHeatmapDate(date)}: ${done} ${(target || count) === 1 ? 'habit' : 'habits'} completed`;
}

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Next [row, week] for an arrow key, or null when it would leave the grid or land on a future day. */
export function moveGridFocus(
  weeks: (StreakHeatmapCell | null)[][],
  [row, col]: [number, number],
  key: string
): [number, number] | null {
  const delta = ARROW_DELTAS[key];
  if (!delta) return null;
  const next: [number, number] = [row + delta[0], col + delta[1]];
  return weeks[next[1]]?.[next[0]] ? next : null;
}

interface HabitStreakHeatmapProps {
  records: DailyCompletionRecord[];
  /** Last day shown (YYYY-MM-DD). Defaults to today in the viewer's timezone. */
  endDate?: string;
  className?: string;
}

export function HabitStreakHeatmap({ records, endDate, className = '' }: HabitStreakHeatmapProps) {
  const end = endDate ?? new Date().toLocaleDateString('en-CA'); // en-CA formats as YYYY-MM-DD
  const weeks = useMemo(() => buildStreakHeatmapWeeks(records, end), [records, end]);
  const gridRef = useRef<HTMLDivElement>(null);
  // Roving tabindex: only one cell is in the tab order; arrow keys move between cells.
  // Defaults to (and falls back to, if `endDate` changes) the most recent day.
  const [focused, setActive] = useState<[number, number] | null>(null);
  const active: [number, number] =
    focused && weeks[focused[1]]?.[focused[0]]
      ? focused
      : [weeks[HEATMAP_WEEKS - 1].findLastIndex(Boolean), HEATMAP_WEEKS - 1];
  const [tooltip, setTooltip] = useState<{ cell: StreakHeatmapCell; x: number; y: number } | null>(
    null
  );

  const showTooltip = (cell: StreakHeatmapCell, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const next = moveGridFocus(weeks, active, e.key);
    if (!next) return;
    e.preventDefault();
    setActive(next);
    gridRef.current?.querySelector<HTMLElement>(`[data-pos="${next[0]}-${next[1]}"]`)?.focus();
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div className="overflow-x-auto pb-2">
        <div
          ref={gridRef}
          role="grid"
          aria-label={`Habit completions over the last ${HEATMAP_WEEKS} weeks`}
          onKeyDown={handleKeyDown}
          className="inline-flex flex-col gap-[3px]"
        >
          {DAY_LABELS.map((dayLabel, row) => (
            <div key={row} role="row" className="flex gap-[3px] items-center">
              <span aria-hidden="true" className="w-6 pr-1 text-right text-[9px] text-zinc-500 select-none">
                {dayLabel}
              </span>
              {weeks.map((week, col) => {
                const cell = week[row];
                if (!cell) return <span key={col} className="w-[11px] h-[11px]" />;
                const isActive = active[0] === row && active[1] === col;
                return (
                  <div
                    key={cell.date}
                    role="gridcell"
                    data-pos={`${row}-${col}`}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={getCellLabel(cell)}
                    onMouseEnter={(e) => showTooltip(cell, e.currentTarget)}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={(e) => {
                      setActive([row, col]);
                      showTooltip(cell, e.currentTarget);
                    }}
                    onBlur={() => setTooltip(null)}
                    className={`w-[11px] h-[11px] shrink-0 rounded-[2px] border transition-transform duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#d4af37] hover:scale-125 ${TIER_COLORS[cell.tier]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-zinc-500" aria-hidden="true">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((tier) => (
          <span key={tier} className={`w-2.5 h-2.5 rounded-[2px] border ${TIER_COLORS[tier]}`} />
        ))}
        <span>More</span>
      </div>

      {tooltip && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          className="pointer-events-none z-[9999] whitespace-nowrap rounded-xl border border-[#d4af37]/30 bg-[#0e0e14]/95 px-3 py-2 text-xs text-zinc-100 shadow-2xl shadow-black/90 backdrop-blur-md"
        >
          <div className="font-semibold text-[#e2c056]">{formatHeatmapDate(tooltip.cell.date)}</div>
          <div className="text-zinc-400">
            {tooltip.cell.count} {tooltip.cell.count === 1 ? 'completion' : 'completions'}
            {' · '}
            {Math.round(getCompletionPercent(tooltip.cell.count, tooltip.cell.target))}% of target
          </div>
        </div>
      )}
    </div>
  );
}

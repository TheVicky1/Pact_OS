'use client';

import React, { useState, useMemo } from 'react';
import { GitHubDailyContribution } from '@/lib/integrations/proof-of-work/github';

interface GitHubContributionHeatmapProps {
  dailyContributions: GitHubDailyContribution[];
  username?: string;
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-[#141419] border-white/[0.04]',
  1: 'bg-[#423408] border-[#614b0e]',
  2: 'bg-[#785e0d] border-[#a17e13]',
  3: 'bg-[#b89218] border-[#d4af37]',
  4: 'bg-[#f0cb46] border-[#fef08a] shadow-[0_0_8px_rgba(240,203,70,0.35)]',
};

function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

function formatTooltipDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function GitHubContributionHeatmap({
  dailyContributions,
  username,
}: GitHubContributionHeatmapProps) {
  const [viewRange, setViewRange] = useState<'365' | '90'>('365');
  const [hoveredDay, setHoveredDay] = useState<GitHubDailyContribution | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // 1. Filter data based on active range
  const filteredData = useMemo(() => {
    if (!dailyContributions || dailyContributions.length === 0) return [];
    if (viewRange === '90') {
      return dailyContributions.slice(-90);
    }
    return dailyContributions.slice(-371); // ~53 weeks of data
  }, [dailyContributions, viewRange]);

  // 2. Compute exact sum of displayed contributions (guarantees header matches calendar data)
  const displayedTotal = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item?.count || 0), 0);
  }, [filteredData]);

  // 3. Group days into chronological calendar columns of 7 days (Sunday to Saturday)
  const { weeks, monthHeaders } = useMemo(() => {
    if (filteredData.length === 0) return { weeks: [], monthHeaders: [] };

    const firstDateStr = filteredData[0].date;
    const firstDayOfWeek = getDayOfWeek(firstDateStr); // 0 (Sun) to 6 (Sat)

    const paddedList: (GitHubDailyContribution | null)[] = [];
    // Pad leading days for the first partial week so Sunday is at index 0
    for (let i = 0; i < firstDayOfWeek; i++) {
      paddedList.push(null);
    }
    for (const item of filteredData) {
      paddedList.push(item);
    }

    const cols: (GitHubDailyContribution | null)[][] = [];
    let currentWeek: (GitHubDailyContribution | null)[] = [];

    for (let i = 0; i < paddedList.length; i++) {
      currentWeek.push(paddedList[i]);
      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      cols.push(currentWeek);
    }

    // Determine month labels based on the first valid day of each week
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    let lastLabeledCol = -4;

    cols.forEach((col, weekIdx) => {
      const firstValid = col.find((d) => d !== null);
      if (firstValid) {
        const [y, m, d] = firstValid.date.split('-').map(Number);
        const dateObj = new Date(Date.UTC(y, m - 1, d));
        const monthNum = dateObj.getUTCMonth();

        // Place label on first week of month if not colliding with previous label
        if (monthNum !== lastMonth && weekIdx - lastLabeledCol >= 2) {
          months.push({
            label: dateObj.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
            weekIndex: weekIdx,
          });
          lastMonth = monthNum;
          lastLabeledCol = weekIdx;
        }
      }
    });

    return { weeks: cols, monthHeaders: months };
  }, [filteredData]);

  const handleMouseEnter = (
    day: GitHubDailyContribution | null,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!day) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="font-semibold text-zinc-200">
            {`${displayedTotal.toLocaleString()} ${
              displayedTotal === 1 ? 'contribution' : 'contributions'
            } ${viewRange === '90' ? 'in the last 90 days' : 'in the past year'}`}
          </span>
          {username && (
            <span className="text-zinc-500">
              • <span className="text-amber-400 font-mono">@{username}</span>
            </span>
          )}
        </div>

        {/* 90d / 365d Toggle */}
        <div className="inline-flex rounded-xl bg-zinc-900/80 p-0.5 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setViewRange('90')}
            className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              viewRange === '90'
                ? 'bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Last 90 Days
          </button>
          <button
            type="button"
            onClick={() => setViewRange('365')}
            className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              viewRange === '365'
                ? 'bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Past Year
          </button>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="inline-block min-w-full">
          {/* Month Label Row */}
          <div className="flex text-[10px] text-zinc-400 font-medium mb-1.5 pl-8 h-4 relative select-none">
            {monthHeaders.map((m, i) => (
              <span
                key={i}
                className="absolute transform"
                style={{ left: `${m.weekIndex * 15 + 32}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid with Day Labels on Left */}
          <div className="flex gap-2 items-start">
            {/* 7 Day Rows Labels: Mon (1), Wed (3), Fri (5) */}
            <div className="flex flex-col gap-[3px] text-[9px] text-zinc-500 font-medium select-none w-6 text-right">
              <span className="h-[11px] leading-[11px]" />
              <span className="h-[11px] leading-[11px]">Mon</span>
              <span className="h-[11px] leading-[11px]" />
              <span className="h-[11px] leading-[11px]">Wed</span>
              <span className="h-[11px] leading-[11px]" />
              <span className="h-[11px] leading-[11px]">Fri</span>
              <span className="h-[11px] leading-[11px]" />
            </div>

            {/* Contribution Weeks Columns (7 cells per column) */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={dIdx}
                          className="w-[11px] h-[11px] rounded-[2px] bg-transparent"
                        />
                      );
                    }

                    const levelClass = LEVEL_COLORS[day.level] || LEVEL_COLORS[0];

                    return (
                      <div
                        key={day.date}
                        tabIndex={0}
                        aria-label={`${day.count} contributions on ${day.date}`}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        onFocus={(e) =>
                          handleMouseEnter(day, e as unknown as React.MouseEvent<HTMLDivElement>)
                        }
                        onBlur={handleMouseLeave}
                        className={`w-[11px] h-[11px] rounded-[2px] border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#d4af37] hover:scale-125 ${levelClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Legend & Description */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#141419] border border-white/[0.04]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#423408] border border-[#614b0e]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#785e0d] border border-[#a17e13]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#b89218] border border-[#d4af37]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#f0cb46] border border-[#fef08a]" />
          </div>
          <span>More</span>
        </div>

        <span className="text-[10px] text-zinc-400">
          GitHub Contribution Calendar
        </span>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="bg-[#0e0e14]/95 backdrop-blur-md border border-[#d4af37]/30 text-zinc-100 text-xs px-3 py-2 rounded-xl shadow-2xl shadow-black/90 whitespace-nowrap animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="font-semibold text-[#e2c056]">
            {formatTooltipDate(hoveredDay.date)} —{' '}
            {hoveredDay.count === 0
              ? 'No contributions'
              : `${hoveredDay.count} ${hoveredDay.count === 1 ? 'contribution' : 'contributions'}`}
          </div>
          {(hoveredDay.commitCount > 0 || hoveredDay.prCount > 0) && (
            <div className="text-[10px] text-zinc-400 mt-1 pt-1 border-t border-white/[0.06] flex items-center gap-2">
              {hoveredDay.commitCount > 0 && (
                <span>
                  {hoveredDay.commitCount}{' '}
                  {hoveredDay.commitCount === 1 ? 'commit' : 'commits'}
                </span>
              )}
              {hoveredDay.commitCount > 0 && hoveredDay.prCount > 0 && (
                <span className="text-zinc-600">•</span>
              )}
              {hoveredDay.prCount > 0 && (
                <span>
                  {hoveredDay.prCount}{' '}
                  {hoveredDay.prCount === 1 ? 'pull request' : 'pull requests'}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

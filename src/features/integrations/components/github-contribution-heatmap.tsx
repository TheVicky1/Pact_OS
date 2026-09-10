'use client';

import React, { useState, useMemo } from 'react';
import { GitHubDailyContribution } from '@/lib/integrations/proof-of-work/github';

interface GitHubContributionHeatmapProps {
  dailyContributions: GitHubDailyContribution[];
  username?: string;
  totalContributions?: number;
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-[#18181b]/70 border-[#27272a]/50 text-zinc-600',
  1: 'bg-[#423408] border-[#614b0e] text-amber-300',
  2: 'bg-[#785e0d] border-[#a17e13] text-amber-200',
  3: 'bg-[#b89218] border-[#d4af37] text-amber-100',
  4: 'bg-[#f0cb46] border-[#fef08a] text-zinc-950 shadow-[0_0_6px_rgba(240,203,70,0.4)]',
};

export function GitHubContributionHeatmap({
  dailyContributions,
  username,
  totalContributions,
}: GitHubContributionHeatmapProps) {
  const [viewRange, setViewRange] = useState<'365' | '90'>('365');
  const [hoveredDay, setHoveredDay] = useState<GitHubDailyContribution | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Filter daily contributions based on viewRange
  const filteredData = useMemo(() => {
    if (!dailyContributions || dailyContributions.length === 0) return [];
    if (viewRange === '90') {
      return dailyContributions.slice(-90);
    }
    return dailyContributions.slice(-365);
  }, [dailyContributions, viewRange]);

  // Group days into columns of 7 days (weeks)
  const { weeks, monthHeaders } = useMemo(() => {
    if (filteredData.length === 0) return { weeks: [], monthHeaders: [] };

    const firstDateStr = filteredData[0].date;
    const firstDate = new Date(firstDateStr + 'T12:00:00Z');
    const firstDayOfWeek = firstDate.getUTCDay(); // 0 = Sun, 1 = Mon, ...

    const paddedList: (GitHubDailyContribution | null)[] = [];
    // Pad initial days of the week if firstDate is not Sunday
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

    // Determine month headers position
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    cols.forEach((col, weekIdx) => {
      const firstValid = col.find((d) => d !== null);
      if (firstValid) {
        const d = new Date(firstValid.date + 'T12:00:00Z');
        const m = d.getUTCMonth();
        if (m !== lastMonth) {
          months.push({
            label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
            weekIndex: weekIdx,
          });
          lastMonth = m;
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

  const formatTooltipDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="font-medium text-zinc-300">
            {typeof totalContributions === 'number'
              ? `${totalContributions.toLocaleString()} contributions`
              : 'Contribution History'}
          </span>
          {username && (
            <span className="text-zinc-500">
              by <span className="text-amber-400 font-mono">@{username}</span>
            </span>
          )}
        </div>

        {/* 90d / 365d Toggle */}
        <div className="inline-flex rounded-lg bg-zinc-900/80 p-0.5 border border-zinc-800">
          <button
            type="button"
            onClick={() => setViewRange('90')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              viewRange === '90'
                ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Last 90 Days
          </button>
          <button
            type="button"
            onClick={() => setViewRange('365')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              viewRange === '365'
                ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
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
          <div className="flex text-[10px] text-zinc-500 mb-1 pl-7 h-4 relative">
            {monthHeaders.map((m, i) => (
              <span
                key={i}
                className="absolute transform"
                style={{ left: `${m.weekIndex * 13 + 28}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid with Day Labels on Left */}
          <div className="flex gap-1">
            {/* Day of Week Labels */}
            <div className="flex flex-col justify-between text-[9px] text-zinc-500 pr-1.5 py-0.5 select-none w-6 text-right">
              <span className="h-[10px] leading-[10px]">Sun</span>
              <span className="h-[10px] leading-[10px]">Tue</span>
              <span className="h-[10px] leading-[10px]">Thu</span>
              <span className="h-[10px] leading-[10px]">Sat</span>
            </div>

            {/* Contribution Weeks Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={dIdx}
                          className="w-[10px] h-[10px] rounded-[2px] bg-transparent"
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
                        onFocus={(e) => handleMouseEnter(day, e as unknown as React.MouseEvent<HTMLDivElement>)}
                        onBlur={handleMouseLeave}
                        className={`w-[10px] h-[10px] rounded-[2px] border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 hover:scale-125 ${levelClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Legend & Status */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#18181b]/70 border border-[#27272a]/50" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#423408] border border-[#614b0e]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#785e0d] border border-[#a17e13]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#b89218] border border-[#d4af37]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#f0cb46] border border-[#fef08a]" />
          </div>
          <span>More</span>
        </div>

        <span className="text-[10px] text-zinc-500">
          Daily commits & pull requests
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
          className="bg-zinc-950/95 backdrop-blur-md border border-amber-500/30 text-zinc-100 text-xs px-3 py-2 rounded-lg shadow-xl shadow-black/80 whitespace-nowrap animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="font-semibold text-amber-300">
            {hoveredDay.count === 0
              ? 'No contributions'
              : `${hoveredDay.count} contribution${hoveredDay.count === 1 ? '' : 's'}`}
          </div>
          <div className="text-[11px] text-zinc-400">
            {formatTooltipDate(hoveredDay.date)}
          </div>
          {(hoveredDay.commitCount > 0 || hoveredDay.prCount > 0) && (
            <div className="text-[10px] text-zinc-500 mt-1 pt-1 border-t border-zinc-800 flex items-center gap-2">
              {hoveredDay.commitCount > 0 && (
                <span>{hoveredDay.commitCount} {hoveredDay.commitCount === 1 ? 'commit' : 'commits'}</span>
              )}
              {hoveredDay.prCount > 0 && (
                <span>{hoveredDay.prCount} {hoveredDay.prCount === 1 ? 'pull request' : 'pull requests'}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

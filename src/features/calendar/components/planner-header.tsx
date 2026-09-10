'use client';

import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui';

export type PlannerViewMode = 'day' | 'week' | 'month';

export interface PlannerHeaderProps {
  viewMode: PlannerViewMode;
  onViewModeChange: (mode: PlannerViewMode) => void;
  title: string;
  selectedDate: string;
  timezone: string;
  isCurrentPeriod: boolean;
  eventCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateSelect: (dateStr: string) => void;
  onAddEvent: () => void;
}

export function PlannerHeader({
  viewMode,
  onViewModeChange,
  title,
  selectedDate,
  timezone,
  isCurrentPeriod,
  eventCount,
  onPrev,
  onNext,
  onToday,
  onDateSelect,
  onAddEvent,
}: PlannerHeaderProps) {
  return (
    <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/40">
      {/* Left: Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-white/[0.1] flex items-center justify-center text-[#d4af37] shadow-inner shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">Planner</h1>
              <span className="text-zinc-600">|</span>
              <span className="text-xs text-zinc-400 font-medium">
                {eventCount} {eventCount === 1 ? 'event' : 'events'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Time-blocking & calendar schedule • {timezone}
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div
          role="tablist"
          aria-label="Planner Views"
          className="inline-flex items-center p-1 rounded-xl bg-zinc-900/80 border border-white/[0.08] shadow-sm shrink-0"
        >
          {(['day', 'week', 'month'] as const).map((mode) => {
            const isActive = viewMode === mode;
            const label = mode.charAt(0).toUpperCase() + mode.slice(1);
            return (
              <button
                key={mode}
                role="tab"
                aria-selected={isActive}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Date Navigation & Actions */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
        {/* Date Controls */}
        <div className="flex items-center rounded-xl bg-zinc-900/80 border border-white/[0.08] p-1 shadow-sm">
          <button
            onClick={onPrev}
            aria-label="Previous Period"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onToday}
            aria-label="Jump to Today"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isCurrentPeriod
                ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            Today
          </button>

          <button
            onClick={onNext}
            aria-label="Next Period"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector Pill */}
        <div className="relative flex items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onDateSelect(e.target.value);
              }
            }}
            aria-label="Select Date"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-zinc-200 transition-colors flex items-center gap-1.5 pointer-events-none">
            <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="truncate max-w-[200px]">{title}</span>
          </div>
        </div>

        {/* Add Event Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onAddEvent}
          icon={<Plus className="w-3.5 h-3.5" />}
          className="shadow-md shadow-[#d4af37]/10 shrink-0"
        >
          Add Event
        </Button>
      </div>
    </div>
  );
}

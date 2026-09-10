'use client';

import React, { useMemo } from 'react';
import type { CalendarEventWithRelations } from '@/types/domain';
import { getMonthGridForDate, getLocalDateString, utcToLocal } from '@/lib/time';
import { COLOR_MAP } from './planner-day-view';
import { Plus } from 'lucide-react';

export interface PlannerMonthViewProps {
  selectedDate: string;
  events: CalendarEventWithRelations[];
  timezone: string;
  onSelectDate: (dateStr: string) => void;
  onOpenDayView: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEventWithRelations) => void;
  onRequestCreate: (dateStr: string, timeStr?: string) => void;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlannerMonthView({
  selectedDate,
  events,
  timezone,
  onSelectDate,
  onOpenDayView,
  onSelectEvent,
  onRequestCreate,
}: PlannerMonthViewProps) {
  // Compute monthly grid
  const monthData = useMemo(() => {
    return getMonthGridForDate(selectedDate, timezone);
  }, [selectedDate, timezone]);

  // Group events by local date in user's timezone
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventWithRelations[]>();
    for (const ev of events) {
      const evDate = getLocalDateString(new Date(ev.start_time), timezone);
      if (!map.has(evDate)) {
        map.set(evDate, []);
      }
      map.get(evDate)!.push(ev);
    }
    return map;
  }, [events, timezone]);

  return (
    <div
      className="overflow-x-auto select-none focus:outline-none rounded-xl border border-white/[0.08] bg-zinc-950/40 p-3 sm:p-4"
      tabIndex={0}
      aria-label="Month Calendar View"
    >
      <div className="min-w-[720px]">
        {/* Weekday Header Row */}
        <div className="grid grid-cols-7 border-b border-white/[0.08] pb-2 mb-2 bg-zinc-950/60 rounded-t-lg text-center">
          {WEEKDAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`text-xs font-semibold uppercase tracking-wider py-1 ${
                i >= 5 ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Month Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthData.grid.map((cell) => {
            const cellEvents = eventsByDate.get(cell.dateStr) || [];
            const isSelected = cell.dateStr === selectedDate;
            const maxVisiblePills = 3;
            const overflowCount = Math.max(0, cellEvents.length - maxVisiblePills);

            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDate(cell.dateStr)}
                onDoubleClick={() => onOpenDayView(cell.dateStr)}
                className={`min-h-[105px] sm:min-h-[120px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                  isSelected
                    ? 'bg-zinc-900/90 border-[#d4af37]/60 shadow-md ring-1 ring-[#d4af37]/20'
                    : cell.isCurrentMonth
                    ? 'bg-zinc-950/40 border-white/[0.05] hover:border-white/20 hover:bg-zinc-900/40'
                    : 'bg-zinc-950/20 border-white/[0.02] text-zinc-600 opacity-40 hover:opacity-80'
                }`}
              >
                {/* Cell Header: Day Number + Add Button */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                      cell.isToday
                        ? 'bg-[#d4af37] text-zinc-950 font-extrabold shadow-sm shadow-[#d4af37]/40'
                        : isSelected
                        ? 'text-zinc-100 font-bold bg-white/10'
                        : cell.isCurrentMonth
                        ? 'text-zinc-300'
                        : 'text-zinc-500'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Add Event Quick Button (Hover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestCreate(cell.dateStr, '09:00');
                    }}
                    aria-label={`Add event on ${cell.dateStr}`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Event Pills */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {cellEvents.slice(0, maxVisiblePills).map((ev) => {
                    const colors = COLOR_MAP[ev.color_tag] || COLOR_MAP.gold;
                    const timeStr = utcToLocal(ev.start_time, timezone, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <div
                        key={ev.id}
                        data-event-card="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02] ${colors.bg} ${colors.border} ${colors.text}`}
                        title={`${ev.title} (${timeStr})`}
                      >
                        <div className={`w-1 h-1 rounded-full shrink-0 ${colors.dot}`} />
                        <span className="truncate font-medium flex-1">{ev.title}</span>
                        <span className="text-[9px] opacity-70 font-mono shrink-0 hidden sm:inline">
                          {timeStr}
                        </span>
                      </div>
                    );
                  })}

                  {overflowCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDayView(cell.dateStr);
                      }}
                      className="text-[9px] font-semibold text-[#d4af37] hover:underline px-1 block truncate"
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import { Sparkles, FolderKanban, Target, CheckSquare, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarEventWithRelations } from '@/types/domain';
import {
  computeTimelineRange,
  layoutVerticalEvents,
  WEEK_HOUR_HEIGHT_PX,
} from '../layout';
import {
  getWeekDaysForDate,
  getLocalDateString,
  getLocalHourAndMinute,
  utcToLocal,
} from '@/lib/time';
import { COLOR_MAP } from './planner-day-view';

export interface PlannerWeekViewProps {
  selectedDate: string;
  events: CalendarEventWithRelations[];
  timezone: string;
  onSelectEvent: (event: CalendarEventWithRelations) => void;
  onRequestCreate: (dateStr: string, timeStr: string) => void;
  onSelectDate: (dateStr: string) => void;
}

export function PlannerWeekView({
  selectedDate,
  events,
  timezone,
  onSelectEvent,
  onRequestCreate,
  onSelectDate,
}: PlannerWeekViewProps) {
  // Compute week days (Monday..Sunday)
  const { days } = useMemo(
    () => getWeekDaysForDate(selectedDate, timezone),
    [selectedDate, timezone]
  );

  // Compute common timeline range across all week events
  const range = useMemo(() => {
    return computeTimelineRange(events, timezone);
  }, [events, timezone]);

  const totalHeightPx = (range.endHour - range.startHour) * WEEK_HOUR_HEIGHT_PX;

  // Group events by local date in user's timezone
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventWithRelations[]>();
    for (const d of days) {
      map.set(d.dateStr, []);
    }
    for (const ev of events) {
      const evDate = getLocalDateString(new Date(ev.start_time), timezone);
      const list = map.get(evDate);
      if (list) {
        list.push(ev);
      }
    }
    return map;
  }, [events, days, timezone]);

  // Current time position for today's column
  const todayDateStr = useMemo(() => getLocalDateString(new Date(), timezone), [timezone]);
  const currentMinutesOffset = useMemo(() => {
    const { hour, minute } = getLocalHourAndMinute(new Date().toISOString(), timezone);
    const nowMinutes = hour * 60 + minute;
    if (nowMinutes < range.startMinutes || nowMinutes > range.endMinutes) {
      return null;
    }
    return ((nowMinutes - range.startMinutes) / 60) * WEEK_HOUR_HEIGHT_PX;
  }, [timezone, range]);

  const handleColumnClick = (
    e: React.MouseEvent<HTMLDivElement>,
    dateStr: string
  ) => {
    if ((e.target as HTMLElement).closest('[data-event-card="true"]')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clickRatio = Math.max(0, Math.min(1, offsetY / totalHeightPx));
    const clickMinutes = range.startMinutes + clickRatio * range.totalMinutes;
    const roundedMinutes = Math.floor(clickMinutes / 30) * 30;

    const hour = Math.floor(roundedMinutes / 60);
    const minute = roundedMinutes % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    onRequestCreate(dateStr, timeStr);
  };

  return (
    <div className="space-y-4">
      {/* Empty State Banner */}
      {events.length === 0 && (
        <div className="px-4 py-3 rounded-xl bg-zinc-900/30 border border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>Your week is clear. Click any day and time slot to schedule an event.</span>
          </div>
          <button
            onClick={() => onRequestCreate(selectedDate, '09:00')}
            className="text-xs font-semibold text-[#d4af37] hover:underline cursor-pointer"
          >
            + Add Event
          </button>
        </div>
      )}

      {/* Week Grid Container */}
      <div
        className="overflow-x-auto select-none focus:outline-none rounded-xl border border-white/[0.08] bg-zinc-950/40 p-3 sm:p-4"
        tabIndex={0}
        aria-label="Week Calendar View"
      >
        <div className="min-w-[840px]">
          {/* 1. Day Column Headers */}
          <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-white/[0.08] pb-3 mb-1 bg-zinc-950/60 rounded-t-lg">
            {/* Time gutter header */}
            <div className="text-[11px] font-mono text-zinc-500 font-medium pl-2 pt-2">
              GMT
            </div>

            {/* 7 Days Headers */}
            {days.map((d) => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => onSelectDate(d.dateStr)}
                  className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-zinc-900 border border-[#d4af37]/40 shadow-sm'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium uppercase tracking-wider ${
                      d.isToday
                        ? 'text-[#d4af37] font-bold'
                        : isSelected
                        ? 'text-zinc-200'
                        : 'text-zinc-400'
                    }`}
                  >
                    {d.dayOfWeek}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mt-1 text-xs font-semibold transition-colors ${
                      d.isToday
                        ? 'bg-[#d4af37] text-zinc-950 font-bold shadow-md shadow-[#d4af37]/30'
                        : isSelected
                        ? 'bg-white/10 text-zinc-100 font-bold'
                        : 'text-zinc-300'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Grid Body: Time gutter + 7 columns */}
          <div className="relative grid grid-cols-[64px_repeat(7,1fr)]">
            {/* Time Gutter */}
            <div className="relative" style={{ height: `${totalHeightPx}px` }}>
              {range.hoursList.map((slot, idx) => {
                if (idx === range.hoursList.length - 1) return null;
                const topPx = idx * WEEK_HOUR_HEIGHT_PX;
                return (
                  <div
                    key={slot.hour}
                    className="absolute right-3 -translate-y-2 text-[11px] font-mono text-zinc-500 select-none"
                    style={{ top: `${topPx}px` }}
                  >
                    {slot.label}
                  </div>
                );
              })}
            </div>

            {/* 7 Interactive Day Columns */}
            {days.map((d) => {
              const dayEvents = eventsByDay.get(d.dateStr) || [];
              const positioned = layoutVerticalEvents(
                dayEvents,
                timezone,
                range,
                WEEK_HOUR_HEIGHT_PX
              );
              const isTodayColumn = d.dateStr === todayDateStr;

              return (
                <div
                  key={d.dateStr}
                  onClick={(e) => handleColumnClick(e, d.dateStr)}
                  className={`relative border-l border-white/[0.06] transition-colors cursor-pointer hover:bg-white/[0.02] ${
                    isTodayColumn ? 'bg-[#d4af37]/[0.02]' : ''
                  }`}
                  style={{ height: `${totalHeightPx}px` }}
                  title={`Click to schedule an event on ${d.dayOfWeekFull}, ${d.dateStr}`}
                >
                  {/* Hour Horizontal Grid Lines */}
                  {range.hoursList.map((slot, idx) => {
                    const topPx = idx * WEEK_HOUR_HEIGHT_PX;
                    return (
                      <React.Fragment key={slot.hour}>
                        <div
                          className="absolute left-0 right-0 border-t border-white/[0.06] pointer-events-none"
                          style={{ top: `${topPx}px` }}
                        />
                        {/* Half-hour dashed guide line */}
                        <div
                          className="absolute left-0 right-0 border-t border-white/[0.02] border-dashed pointer-events-none"
                          style={{ top: `${topPx + WEEK_HOUR_HEIGHT_PX / 2}px` }}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Current Time Line (Today only) */}
                  {isTodayColumn && currentMinutesOffset !== null && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${currentMinutesOffset}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#d4af37] -ml-1 animate-pulse shadow-[0_0_6px_#d4af37]" />
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-[#d4af37] to-[#d4af37]/40 shadow-[0_0_6px_#d4af37]" />
                    </div>
                  )}

                  {/* Positioned Vertical Event Cards */}
                  {positioned.map((pe) => {
                    const colors = COLOR_MAP[pe.event.color_tag] || COLOR_MAP.gold;
                    const widthPct = 100 / pe.totalColumns;
                    const leftPct = pe.columnIndex * widthPct;

                    const startStr = utcToLocal(pe.event.start_time, timezone, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });
                    const endStr = utcToLocal(pe.event.end_time, timezone, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <div
                        key={pe.event.id}
                        data-event-card="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(pe.event);
                        }}
                        style={{
                          top: `${pe.topPx + 2}px`,
                          height: `${Math.max(26, pe.heightPx - 4)}px`,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                        className={`absolute z-10 rounded-lg p-1.5 border backdrop-blur-md transition-all cursor-pointer shadow-sm overflow-hidden flex flex-col justify-start group ${colors.bg} ${colors.border} ${colors.glow}`}
                      >
                        <div className="flex items-center gap-1 min-w-0 justify-between">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                            <h4 className={`text-[11px] font-semibold truncate leading-tight ${colors.text}`}>
                              {pe.event.title}
                            </h4>
                          </div>
                          {(pe.event.is_external || pe.event.google_event_id) && (
                            <CalendarIcon className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                          )}
                        </div>

                        {pe.heightPx >= 44 && (
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                            {startStr} – {endStr}
                          </div>
                        )}

                        {pe.heightPx >= 64 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {pe.event.tasks && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-zinc-300 truncate">
                                <CheckSquare className="w-2 h-2 text-emerald-400 shrink-0" />
                                <span className="truncate">{pe.event.tasks.title}</span>
                              </span>
                            )}
                            {pe.event.projects && !pe.event.tasks && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-zinc-300 truncate">
                                <FolderKanban className="w-2 h-2 text-[#d4af37] shrink-0" />
                                <span className="truncate">{pe.event.projects.title}</span>
                              </span>
                            )}
                            {pe.event.goals && !pe.event.tasks && !pe.event.projects && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-zinc-300 truncate">
                                <Target className="w-2 h-2 text-blue-400 shrink-0" />
                                <span className="truncate">{pe.event.goals.title}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

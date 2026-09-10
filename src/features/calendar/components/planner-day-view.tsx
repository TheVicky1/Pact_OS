'use client';

import React, { useMemo, useRef } from 'react';
import { Sparkles, FolderKanban, Target, CheckSquare } from 'lucide-react';
import type { CalendarEventWithRelations } from '@/types/domain';
import {
  layoutHorizontalEvents,
  horizontalOffsetToTime,
  LANE_HEIGHT_PX,
} from '../layout';
import { utcToLocal, getLocalHourAndMinute } from '@/lib/time';

export interface PlannerDayViewProps {
  dateStr: string;
  events: CalendarEventWithRelations[];
  timezone: string;
  isToday: boolean;
  onSelectEvent: (event: CalendarEventWithRelations) => void;
  onRequestCreate: (timeStr: string) => void;
}

export const COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; glow: string; dot: string }
> = {
  gold: {
    bg: 'bg-[#d4af37]/10',
    border: 'border-[#d4af37]/40',
    text: 'text-[#d4af37]',
    glow: 'hover:border-[#d4af37]/70',
    dot: 'bg-[#d4af37]',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    glow: 'hover:border-blue-500/70',
    dot: 'bg-blue-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    glow: 'hover:border-purple-500/70',
    dot: 'bg-purple-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'hover:border-emerald-500/70',
    dot: 'bg-emerald-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: 'hover:border-amber-500/70',
    dot: 'bg-amber-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    glow: 'hover:border-rose-500/70',
    dot: 'bg-rose-400',
  },
};

export function PlannerDayView({
  events,
  timezone,
  isToday,
  onSelectEvent,
  onRequestCreate,
}: PlannerDayViewProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Compute layout and range
  const layoutResult = useMemo(() => {
    return layoutHorizontalEvents<CalendarEventWithRelations>(events, timezone);
  }, [events, timezone]);

  const { range, positionedEvents, totalHeightPx } = layoutResult;

  // Compute current-time indicator offset
  const { currentOffsetPercent, currentTimeFormatted } = useMemo(() => {
    if (!isToday) return { currentOffsetPercent: null, currentTimeFormatted: '' };

    const { hour, minute } = getLocalHourAndMinute(new Date().toISOString(), timezone);
    const nowMinutes = hour * 60 + minute;

    if (nowMinutes < range.startMinutes || nowMinutes > range.endMinutes) {
      return { currentOffsetPercent: null, currentTimeFormatted: '' };
    }

    const pct = ((nowMinutes - range.startMinutes) / range.totalMinutes) * 100;
    const h = Math.floor(nowMinutes / 60);
    const m = nowMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const timeFormatted = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;

    return { currentOffsetPercent: pct, currentTimeFormatted: timeFormatted };
  }, [isToday, timezone, range]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-event-card="true"]')) {
      return;
    }
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const { timeStr } = horizontalOffsetToTime(offsetX, rect.width, range, 30);
    onRequestCreate(timeStr);
  };

  return (
    <div className="space-y-4">
      {/* Empty State Notice */}
      {events.length === 0 && (
        <div className="px-4 py-3 rounded-xl bg-zinc-900/30 border border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>Your day is clear. Click any open slot on the timeline to schedule an event.</span>
          </div>
          <button
            onClick={() => onRequestCreate('09:00')}
            className="text-xs font-semibold text-[#d4af37] hover:underline cursor-pointer"
          >
            + Add Event
          </button>
        </div>
      )}

      {/* Horizontal Timeline Container */}
      <div
        className="overflow-x-auto select-none focus:outline-none rounded-xl border border-white/[0.08] bg-zinc-950/40 p-3 sm:p-4"
        tabIndex={0}
        aria-label="Day Timeline View"
      >
        <div className="min-w-[820px] relative">
          {/* Time Axis Header */}
          <div className="relative h-8 border-b border-white/[0.08] bg-zinc-900/40 rounded-t-lg overflow-hidden">
            {range.hoursList.map((slot, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === range.hoursList.length - 1;
              return (
                <div
                  key={slot.hour}
                  className="absolute top-0 bottom-0 flex flex-col justify-between"
                  style={{ left: `${slot.offsetPercent}%` }}
                >
                  <span
                    className={`text-[11px] font-mono text-zinc-400 font-medium pt-1 ${
                      isFirst
                        ? 'translate-x-1'
                        : isLast
                        ? '-translate-x-full pr-1'
                        : '-translate-x-1/2'
                    }`}
                  >
                    {slot.label}
                  </span>
                  <div className="w-px h-1.5 bg-white/20" />
                </div>
              );
            })}
          </div>

          {/* Timeline Track */}
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative cursor-pointer bg-zinc-950/20 hover:bg-zinc-900/10 transition-colors border-x border-b border-white/[0.08] rounded-b-lg overflow-hidden"
            style={{ minHeight: `${Math.max(160, totalHeightPx + 24)}px` }}
            title="Click any open time slot to create an event"
          >
            {/* Guide Lines */}
            {range.hoursList.map((slot) => {
              const halfHourPercent =
                slot.hour < range.endHour
                  ? ((slot.hour * 60 + 30 - range.startMinutes) / range.totalMinutes) * 100
                  : null;

              return (
                <React.Fragment key={slot.hour}>
                  <div
                    className="absolute top-0 bottom-0 w-px border-r border-white/[0.05] pointer-events-none"
                    style={{ left: `${slot.offsetPercent}%` }}
                  />
                  {halfHourPercent !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-px border-r border-white/[0.02] border-dashed pointer-events-none"
                      style={{ left: `${halfHourPercent}%` }}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Current Time Indicator */}
            {currentOffsetPercent !== null && (
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                style={{ left: `${currentOffsetPercent}%` }}
              >
                <div className="absolute top-1 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-[#d4af37]/50 shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-[#d4af37]">
                    {currentTimeFormatted}
                  </span>
                </div>
                <div className="w-[2px] h-full bg-gradient-to-b from-[#d4af37] via-[#d4af37]/80 to-[#d4af37]/30 shadow-[0_0_8px_#d4af37]" />
              </div>
            )}

            {/* Event Cards */}
            <div className="relative p-2" style={{ minHeight: `${totalHeightPx}px` }}>
              {positionedEvents.map((pe) => {
                const colors = COLOR_MAP[pe.event.color_tag] || COLOR_MAP.gold;
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
                      top: `${pe.topPx + 8}px`,
                      height: `${LANE_HEIGHT_PX}px`,
                      left: `calc(${pe.leftPercent}% + 2px)`,
                      width: `calc(${pe.widthPercent}% - 4px)`,
                    }}
                    className={`absolute z-10 rounded-xl px-3 py-1.5 border backdrop-blur-md transition-all cursor-pointer shadow-md overflow-hidden flex items-center justify-between gap-2 group ${colors.bg} ${colors.border} ${colors.glow}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xs font-semibold truncate ${colors.text}`}>
                            {pe.event.title}
                          </h3>
                          <span className="text-[10px] text-zinc-400 font-mono shrink-0 hidden sm:inline">
                            {startStr} – {endStr}
                          </span>
                        </div>
                        {/* Linked Relation Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pe.event.tasks && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 truncate">
                              <CheckSquare className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{pe.event.tasks.title}</span>
                            </span>
                          )}
                          {pe.event.projects && !pe.event.tasks && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 truncate">
                              <FolderKanban className="w-2.5 h-2.5 text-[#d4af37] shrink-0" />
                              <span className="truncate max-w-[140px]">{pe.event.projects.title}</span>
                            </span>
                          )}
                          {pe.event.goals && !pe.event.tasks && !pe.event.projects && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 truncate">
                              <Target className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{pe.event.goals.title}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-400 font-mono shrink-0 sm:hidden">
                      {startStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

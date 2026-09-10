'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GlassCard, Button } from '@/components/ui';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  FolderKanban,
  Target,
  CheckSquare,
} from 'lucide-react';
import type { CalendarEventWithRelations } from '@/types/domain';
import { getCalendarEventsForDayAction } from '../actions';
import {
  layoutHorizontalEvents,
  horizontalOffsetToTime,
  LANE_HEIGHT_PX,
} from '../layout';
import {
  getLocalDateString,
  formatCalendarDateHeader,
  getLocalHourAndMinute,
  addDaysToDateString,
  utcToLocal,
} from '@/lib/time';
import { EventModal } from './event-modal';

export interface DailyCalendarWidgetProps {
  initialEvents?: CalendarEventWithRelations[];
  timezone: string;
  projects?: Array<{ id: string; title: string }>;
  goals?: Array<{ id: string; title: string }>;
  tasks?: Array<{ id: string; title: string }>;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string; dot: string }> = {
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

export function DailyCalendarWidget({
  initialEvents = [],
  timezone,
  projects = [],
  goals = [],
  tasks = [],
}: DailyCalendarWidgetProps) {
  // Authoritative today string in profile timezone
  const todayStr = useMemo(() => getLocalDateString(new Date(), timezone), [timezone]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [events, setEvents] = useState<CalendarEventWithRelations[]>(initialEvents);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEventWithRelations | null>(null);
  const [prefilledStartTime, setPrefilledStartTime] = useState<string>('09:00');

  // Current time marker state
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const changeDate = useCallback(
    async (newDate: string) => {
      setSelectedDate(newDate);
      setIsLoadingEvents(true);
      try {
        const data = await getCalendarEventsForDayAction(newDate, timezone);
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [timezone]
  );

  const refreshEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const data = await getCalendarEventsForDayAction(selectedDate, timezone);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [selectedDate, timezone]);

  // Update current time indicator in user's profile timezone
  useEffect(() => {
    const updateTime = () => {
      const { hour, minute } = getLocalHourAndMinute(new Date().toISOString(), timezone);
      setCurrentTimeMinutes(hour * 60 + minute);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // every 30s
    return () => clearInterval(interval);
  }, [timezone]);

  // Day navigation handlers
  const handlePrevDay = () => changeDate(addDaysToDateString(selectedDate, -1));
  const handleNextDay = () => changeDate(addDaysToDateString(selectedDate, 1));
  const handleToday = () => changeDate(todayStr);

  const isToday = selectedDate === todayStr;
  const dateHeader = useMemo(
    () => formatCalendarDateHeader(selectedDate, timezone),
    [selectedDate, timezone]
  );

  // Layout calculations for horizontal events
  const layoutResult = useMemo(() => {
    return layoutHorizontalEvents<CalendarEventWithRelations>(events, timezone);
  }, [events, timezone]);

  const { range, positionedEvents, totalHeightPx } = layoutResult;

  // Calculate current-time indicator offset percent
  const currentOffsetPercent = useMemo(() => {
    if (!isToday || currentTimeMinutes === null) return null;
    if (currentTimeMinutes < range.startMinutes || currentTimeMinutes > range.endMinutes) {
      return null;
    }
    return ((currentTimeMinutes - range.startMinutes) / range.totalMinutes) * 100;
  }, [isToday, currentTimeMinutes, range]);

  const currentTimeFormatted = useMemo(() => {
    if (currentTimeMinutes === null) return '';
    const h = Math.floor(currentTimeMinutes / 60);
    const m = currentTimeMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  }, [currentTimeMinutes]);

  // Click on empty horizontal time slot to create event
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks on the track background, not on event cards
    if ((e.target as HTMLElement).closest('[data-event-card="true"]')) {
      return;
    }

    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const { timeStr } = horizontalOffsetToTime(offsetX, rect.width, range, 30);

    setPrefilledStartTime(timeStr);
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenAddEvent = () => {
    setPrefilledStartTime('09:00');
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEventWithRelations) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  return (
    <GlassCard variant="default" padding="none" className="overflow-hidden border-white/[0.08]">
      {/* 1. Header — Visual & Structural Alignment */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-white/[0.1] flex items-center justify-center text-[#d4af37] shadow-inner shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
                Daily Calendar
              </h2>
              <span className="text-zinc-600">|</span>
              <span className="text-xs text-zinc-400 font-medium">
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Your schedule for the day • {timezone}
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Day Navigation */}
          <div className="flex items-center rounded-xl bg-zinc-900/80 border border-white/[0.08] p-1 shadow-sm">
            <button
              onClick={handlePrevDay}
              aria-label="Previous Day"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isToday
                  ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              Today
            </button>

            <button
              onClick={handleNextDay}
              aria-label="Next Day"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
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
                  changeDate(e.target.value);
                }
              }}
              aria-label="Select Date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-zinc-200 transition-colors flex items-center gap-1.5 pointer-events-none">
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>{dateHeader.formatted}</span>
            </div>
          </div>

          {/* Add Event Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddEvent}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="shadow-md shadow-[#d4af37]/10 shrink-0"
          >
            Add Event
          </Button>
        </div>
      </div>

      {/* 2. Empty State Secondary Banner (Timeline remains visible below) */}
      {events.length === 0 && !isLoadingEvents && (
        <div className="px-4 py-2.5 bg-zinc-900/30 border-b border-white/[0.04] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Your day is clear. Click an open slot to schedule something.</span>
          </div>
          <button
            onClick={handleOpenAddEvent}
            className="text-xs font-semibold text-[#d4af37] hover:underline"
          >
            + Add Event
          </button>
        </div>
      )}

      {/* 3. Horizontal Calendar Container */}
      <div className="overflow-x-auto select-none focus:outline-none p-4 sm:p-5" tabIndex={0} aria-label="Daily Calendar Timeline">
        <div className="min-w-[820px] relative">
          {/* Horizontal Time Axis Header */}
          <div className="relative h-8 border-b border-white/[0.08] bg-zinc-950/40 rounded-t-xl overflow-hidden">
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

          {/* Interactive Timeline Track */}
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative cursor-pointer bg-zinc-950/20 hover:bg-zinc-900/10 transition-colors border-x border-b border-white/[0.08] rounded-b-xl overflow-hidden"
            style={{ minHeight: `${Math.max(140, totalHeightPx + 24)}px` }}
            title="Click any open time slot to create an event"
          >
            {/* Vertical Guide Lines */}
            {range.hoursList.map((slot) => {
              // Calculate half-hour guide line
              const halfHourPercent =
                slot.hour < range.endHour
                  ? ((slot.hour * 60 + 30 - range.startMinutes) / range.totalMinutes) * 100
                  : null;

              return (
                <React.Fragment key={slot.hour}>
                  {/* Full hour guide line */}
                  <div
                    className="absolute top-0 bottom-0 w-px border-r border-white/[0.05] pointer-events-none"
                    style={{ left: `${slot.offsetPercent}%` }}
                  />
                  {/* Half hour dashed guide line */}
                  {halfHourPercent !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-px border-r border-white/[0.02] border-dashed pointer-events-none"
                      style={{ left: `${halfHourPercent}%` }}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Current Time Vertical Line (Only Today) */}
            {currentOffsetPercent !== null && (
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                style={{ left: `${currentOffsetPercent}%` }}
              >
                {/* Top Badge with Dot and Time */}
                <div className="absolute top-1 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-[#d4af37]/50 shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-[#d4af37]">
                    {currentTimeFormatted}
                  </span>
                </div>
                {/* Vertical gold guide line extending through the timeline */}
                <div className="w-[2px] h-full bg-gradient-to-b from-[#d4af37] via-[#d4af37]/80 to-[#d4af37]/30 shadow-[0_0_8px_#d4af37]" />
              </div>
            )}

            {/* Positioned Event Cards */}
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
                      handleEditEvent(pe.event);
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
                          {(pe.event.is_external || pe.event.google_event_id) && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                              <CalendarIcon className="w-2.5 h-2.5 text-blue-400" />
                              <span className="hidden md:inline">Google</span>
                            </span>
                          )}
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

                    {/* Compact time on small screens */}
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

      {/* 4. Event Creation / Editing Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventToEdit={eventToEdit}
          initialDateStr={selectedDate}
          initialStartTimeStr={prefilledStartTime}
          timezone={timezone}
          projects={projects}
          goals={goals}
          tasks={tasks}
          onEventSaved={refreshEvents}
        />
      )}
    </GlassCard>
  );
}

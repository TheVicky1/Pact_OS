'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { GlassCard } from '@/components/ui';
import type { CalendarEventWithRelations } from '@/types/domain';
import {
  getLocalDateString,
  formatCalendarDateHeader,
  formatWeekRangeHeader,
  formatMonthYearHeader,
  addDaysToDateString,
} from '@/lib/time';
import {
  getCalendarEventsForDayAction,
  getCalendarEventsForWeekAction,
  getCalendarEventsForMonthAction,
} from '../actions';
import { PlannerHeader, PlannerViewMode } from './planner-header';
import { PlannerDayView } from './planner-day-view';
import { PlannerWeekView } from './planner-week-view';
import { PlannerMonthView } from './planner-month-view';
import { PlannerTasksPanel, PlannerTaskItem } from './planner-tasks-panel';
import { EventModal } from './event-modal';

export interface PlannerWorkspaceProps {
  initialEvents?: CalendarEventWithRelations[];
  timezone: string;
  initialView?: PlannerViewMode;
  projects?: Array<{ id: string; title: string }>;
  goals?: Array<{ id: string; title: string }>;
  tasks?: Array<{ id: string; title: string; priority?: string; status?: string; deadline_at?: string }>;
}

export function PlannerWorkspace({
  initialEvents = [],
  timezone,
  initialView = 'day',
  projects = [],
  goals = [],
  tasks = [],
}: PlannerWorkspaceProps) {
  // Authoritative Today date string in profile timezone
  const todayStr = useMemo(() => getLocalDateString(new Date(), timezone), [timezone]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<PlannerViewMode>(initialView);

  const [events, setEvents] = useState<CalendarEventWithRelations[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEventWithRelations | null>(null);
  const [modalDateStr, setModalDateStr] = useState<string>(todayStr);
  const [modalStartTimeStr, setModalStartTimeStr] = useState<string>('09:00');

  // Load events for the current active view & date
  const loadEvents = useCallback(
    async (date: string, mode: PlannerViewMode) => {
      setIsLoading(true);
      try {
        let data: CalendarEventWithRelations[] = [];
        if (mode === 'day') {
          data = await getCalendarEventsForDayAction(date, timezone);
        } else if (mode === 'week') {
          data = await getCalendarEventsForWeekAction(date, timezone);
        } else if (mode === 'month') {
          data = await getCalendarEventsForMonthAction(date, timezone);
        }
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    },
    [timezone]
  );

  const refreshEvents = useCallback(() => {
    loadEvents(selectedDate, viewMode);
  }, [loadEvents, selectedDate, viewMode]);

  // View mode switcher
  const handleViewModeChange = (newMode: PlannerViewMode) => {
    setViewMode(newMode);
    loadEvents(selectedDate, newMode);
  };

  // Date navigation handlers
  const handlePrev = () => {
    let newDate = selectedDate;
    if (viewMode === 'day') {
      newDate = addDaysToDateString(selectedDate, -1);
    } else if (viewMode === 'week') {
      newDate = addDaysToDateString(selectedDate, -7);
    } else if (viewMode === 'month') {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const prevDateObj = new Date(Date.UTC(year, month - 2, 1));
      const py = prevDateObj.getUTCFullYear();
      const pm = prevDateObj.getUTCMonth() + 1;
      const daysInPrev = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      const clampedDay = Math.min(day, daysInPrev);
      newDate = `${py}-${String(pm).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
    }
    setSelectedDate(newDate);
    loadEvents(newDate, viewMode);
  };

  const handleNext = () => {
    let newDate = selectedDate;
    if (viewMode === 'day') {
      newDate = addDaysToDateString(selectedDate, 1);
    } else if (viewMode === 'week') {
      newDate = addDaysToDateString(selectedDate, 7);
    } else if (viewMode === 'month') {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const nextDateObj = new Date(Date.UTC(year, month, 1));
      const ny = nextDateObj.getUTCFullYear();
      const nm = nextDateObj.getUTCMonth() + 1;
      const daysInNext = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
      const clampedDay = Math.min(day, daysInNext);
      newDate = `${ny}-${String(nm).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
    }
    setSelectedDate(newDate);
    loadEvents(newDate, viewMode);
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
    loadEvents(todayStr, viewMode);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    loadEvents(dateStr, viewMode);
  };

  // Header Title
  const headerTitle = useMemo(() => {
    if (viewMode === 'day') {
      return formatCalendarDateHeader(selectedDate, timezone).formatted;
    }
    if (viewMode === 'week') {
      return formatWeekRangeHeader(selectedDate, timezone);
    }
    return formatMonthYearHeader(selectedDate, timezone);
  }, [viewMode, selectedDate, timezone]);

  const isCurrentPeriod = useMemo(() => {
    if (viewMode === 'day') {
      return selectedDate === todayStr;
    }
    if (viewMode === 'week') {
      return formatWeekRangeHeader(selectedDate, timezone) === formatWeekRangeHeader(todayStr, timezone);
    }
    return formatMonthYearHeader(selectedDate, timezone) === formatMonthYearHeader(todayStr, timezone);
  }, [viewMode, selectedDate, todayStr, timezone]);

  // Event modal actions
  const handleOpenAddEvent = (dateStr?: string, timeStr?: string) => {
    setEventToEdit(null);
    setModalDateStr(dateStr || selectedDate);
    setModalStartTimeStr(timeStr || '09:00');
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEventWithRelations) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleOpenDayView = (dateStr: string) => {
    setSelectedDate(dateStr);
    setViewMode('day');
    loadEvents(dateStr, 'day');
  };

  const displaySafeTasks = useMemo(
    () => tasks.map((t) => ({ id: t.id, title: t.title })),
    [tasks]
  );

  return (
    <div className="space-y-6">
      <GlassCard variant="default" padding="none" className="overflow-hidden border-white/[0.08]">
        {/* Planner Header */}
        <PlannerHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          title={headerTitle}
          selectedDate={selectedDate}
          timezone={timezone}
          isCurrentPeriod={isCurrentPeriod}
          eventCount={events.length}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onDateSelect={handleDateSelect}
          onAddEvent={() => handleOpenAddEvent(selectedDate, '09:00')}
        />

        {/* Main Planner Grid & Contextual Side Panel */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Calendar Canvas (Day / Week / Month) */}
            <div className="lg:col-span-9 space-y-4">
              {isLoading && (
                <div className="h-1 bg-[#d4af37]/20 overflow-hidden rounded-full animate-pulse">
                  <div className="h-full bg-[#d4af37] w-1/3 animate-ping" />
                </div>
              )}

              {viewMode === 'day' && (
                <PlannerDayView
                  dateStr={selectedDate}
                  events={events}
                  timezone={timezone}
                  isToday={selectedDate === todayStr}
                  onSelectEvent={handleSelectEvent}
                  onRequestCreate={(timeStr) => handleOpenAddEvent(selectedDate, timeStr)}
                />
              )}

              {viewMode === 'week' && (
                <PlannerWeekView
                  selectedDate={selectedDate}
                  events={events}
                  timezone={timezone}
                  onSelectEvent={handleSelectEvent}
                  onRequestCreate={(dateStr, timeStr) => handleOpenAddEvent(dateStr, timeStr)}
                  onSelectDate={handleDateSelect}
                />
              )}

              {viewMode === 'month' && (
                <PlannerMonthView
                  selectedDate={selectedDate}
                  events={events}
                  timezone={timezone}
                  onSelectDate={handleDateSelect}
                  onOpenDayView={handleOpenDayView}
                  onSelectEvent={handleSelectEvent}
                  onRequestCreate={(dateStr, timeStr) => handleOpenAddEvent(dateStr, timeStr)}
                />
              )}
            </div>

            {/* Right Contextual Tasks Panel */}
            <div className="lg:col-span-3">
              <PlannerTasksPanel
                tasks={tasks as PlannerTaskItem[]}
                timezone={timezone}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Event Creation / Editing Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventToEdit={eventToEdit}
          initialDateStr={modalDateStr}
          initialStartTimeStr={modalStartTimeStr}
          timezone={timezone}
          projects={projects}
          goals={goals}
          tasks={displaySafeTasks}
          onEventSaved={refreshEvents}
        />
      )}
    </div>
  );
}

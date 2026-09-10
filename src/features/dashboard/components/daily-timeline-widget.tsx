'use client';

import React from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { DailyCalendarWidget } from '@/features/calendar';

export interface DailyTimelineWidgetProps {
  tasks: TaskWithParents[];
  timezone: string;
  onComplete?: (taskId: string) => void;
  completingTaskId?: string | null;
}

/**
 * PACT Daily Timeline / Calendar Widget
 * Authoritative Day Planner experience providing vertical time-grid scheduling.
 */
export function DailyTimelineWidget({
  tasks,
  timezone,
}: DailyTimelineWidgetProps) {
  return (
    <DailyCalendarWidget
      timezone={timezone}
      tasks={tasks}
    />
  );
}

export { DailyCalendarWidget };

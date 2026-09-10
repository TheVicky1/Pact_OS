import { CalendarEvent } from '../../types/domain';
import { getLocalHourAndMinute } from '../../lib/time';

export const DEFAULT_START_HOUR = 8; // 8:00 AM
export const DEFAULT_END_HOUR = 20; // 8:00 PM
export const MIN_EVENT_DURATION_MINUTES = 30; // Minimum visual width = 30 mins
export const LANE_HEIGHT_PX = 46;
export const LANE_GAP_PX = 10;

export interface HorizontalPositionedEvent<T extends CalendarEvent = CalendarEvent> {
  event: T;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  leftPercent: number;
  widthPercent: number;
  laneIndex: number;
  topPx: number;
}

export interface TimelineRange {
  startHour: number;
  endHour: number;
  startMinutes: number;
  endMinutes: number;
  totalMinutes: number;
  hoursList: Array<{ hour: number; label: string; offsetPercent: number }>;
}

/**
 * Computes the visible horizontal time range.
 * Default is 8 AM to 8 PM (12 hours).
 * If there are scheduled events outside this window, expands cleanly to encompass them.
 */
export function computeTimelineRange(
  events: CalendarEvent[],
  timeZone: string
): TimelineRange {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;

  for (const ev of events) {
    const { hour: sH } = getLocalHourAndMinute(ev.start_time, timeZone);
    const { hour: eH, minute: eM } = getLocalHourAndMinute(ev.end_time, timeZone);

    if (sH < startHour) {
      startHour = Math.max(0, sH);
    }
    const effectiveEndHour = eM > 0 ? eH + 1 : eH;
    if (effectiveEndHour > endHour) {
      endHour = Math.min(24, effectiveEndHour);
    }
  }

  // Ensure minimum 12-hour span for spacious aesthetic
  if (endHour - startHour < 12) {
    endHour = Math.min(24, startHour + 12);
  }

  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const totalMinutes = endMinutes - startMinutes;

  const hoursList: Array<{ hour: number; label: string; offsetPercent: number }> = [];
  for (let h = startHour; h <= endHour; h++) {
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayH = h === 0 || h === 24 ? 12 : h > 12 ? h - 12 : h;
    const label = `${displayH} ${ampm}`;
    const offsetPercent = ((h * 60 - startMinutes) / totalMinutes) * 100;
    hoursList.push({ hour: h, label, offsetPercent });
  }

  return {
    startHour,
    endHour,
    startMinutes,
    endMinutes,
    totalMinutes,
    hoursList,
  };
}

export interface HorizontalLayoutResult<T extends CalendarEvent = CalendarEvent> {
  positionedEvents: HorizontalPositionedEvent<T>[];
  totalLanes: number;
  totalHeightPx: number;
  range: TimelineRange;
}

/**
 * Calculates horizontal positions (leftPercent, widthPercent) and lane assignments
 * for all events scheduled on the selected day.
 */
export function layoutHorizontalEvents<T extends CalendarEvent = CalendarEvent>(
  events: T[],
  timeZone: string,
  forcedRange?: TimelineRange
): HorizontalLayoutResult<T> {
  const range = forcedRange || computeTimelineRange(events, timeZone);

  if (!events || events.length === 0) {
    return {
      positionedEvents: [],
      totalLanes: 1,
      totalHeightPx: LANE_HEIGHT_PX + LANE_GAP_PX * 2,
      range,
    };
  }

  // 1. Calculate local start and end minutes for each event
  const parsed = events.map((event) => {
    const { hour: sH, minute: sM } = getLocalHourAndMinute(event.start_time, timeZone);
    const { hour: eH, minute: eM } = getLocalHourAndMinute(event.end_time, timeZone);

    const startMinutes = sH * 60 + sM;
    let endMinutes = eH * 60 + eM;

    // Clamp endMinutes if crossing midnight
    if (endMinutes <= startMinutes) {
      endMinutes = 24 * 60;
    }

    const actualDuration = endMinutes - startMinutes;
    const displayDuration = Math.max(MIN_EVENT_DURATION_MINUTES, actualDuration);

    return {
      event,
      startMinutes,
      endMinutes,
      displayDuration,
    };
  });

  // 2. Sort chronologically by start time, then longer events first
  parsed.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return b.displayDuration - a.displayDuration;
  });

  // 3. Greedy lane assignment for horizontal rows
  const laneEnds: number[] = [];
  const positioned: HorizontalPositionedEvent<T>[] = [];

  for (const item of parsed) {
    let assignedLane = -1;

    for (let i = 0; i < laneEnds.length; i++) {
      // Allow reuse of lane if previous event has finished with a 5-minute buffer
      if (laneEnds[i] <= item.startMinutes) {
        assignedLane = i;
        laneEnds[i] = item.endMinutes;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = laneEnds.length;
      laneEnds.push(item.endMinutes);
    }

    // Calculate leftPercent and widthPercent relative to the timeline range
    const clampedStart = Math.max(range.startMinutes, item.startMinutes);
    const clampedEnd = Math.min(range.endMinutes, item.startMinutes + item.displayDuration);

    const leftPercent = Math.max(
      0,
      ((clampedStart - range.startMinutes) / range.totalMinutes) * 100
    );
    const widthPercent = Math.max(
      2,
      ((clampedEnd - clampedStart) / range.totalMinutes) * 100
    );

    const topPx = assignedLane * (LANE_HEIGHT_PX + LANE_GAP_PX);

    positioned.push({
      event: item.event,
      startMinutes: item.startMinutes,
      endMinutes: item.endMinutes,
      durationMinutes: item.displayDuration,
      leftPercent,
      widthPercent,
      laneIndex: assignedLane,
      topPx,
    });
  }

  const totalLanes = Math.max(1, laneEnds.length);
  const totalHeightPx = totalLanes * (LANE_HEIGHT_PX + LANE_GAP_PX) + 16;

  return {
    positionedEvents: positioned,
    totalLanes,
    totalHeightPx,
    range,
  };
}

/**
 * Converts a horizontal click position on the timeline track into a rounded time.
 * Rounds to nearest 15 or 30-minute interval.
 */
export function horizontalOffsetToTime(
  offsetX: number,
  trackWidth: number,
  range: TimelineRange,
  intervalMinutes: number = 30
): { hour: number; minute: number; timeStr: string } {
  if (trackWidth <= 0) {
    return { hour: range.startHour, minute: 0, timeStr: `${String(range.startHour).padStart(2, '0')}:00` };
  }

  const ratio = Math.max(0, Math.min(1, offsetX / trackWidth));
  const clickMinutes = range.startMinutes + ratio * range.totalMinutes;

  const roundedMinutes = Math.floor(clickMinutes / intervalMinutes) * intervalMinutes;
  const clampedMinutes = Math.max(0, Math.min(23 * 60 + 59, roundedMinutes));

  const hour = Math.floor(clampedMinutes / 60);
  const minute = clampedMinutes % 60;

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  return { hour, minute, timeStr };
}

export const WEEK_HOUR_HEIGHT_PX = 56;

export interface VerticalPositionedEvent<T extends CalendarEvent = CalendarEvent> {
  event: T;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  topPx: number;
  heightPx: number;
  columnIndex: number;
  totalColumns: number;
}

/**
 * Calculates vertical positions (topPx, heightPx, sub-column layout)
 * for events within a single day column in Week view.
 */
export function layoutVerticalEvents<T extends CalendarEvent = CalendarEvent>(
  events: T[],
  timeZone: string,
  range: TimelineRange,
  hourHeightPx: number = WEEK_HOUR_HEIGHT_PX
): VerticalPositionedEvent<T>[] {
  if (!events || events.length === 0) {
    return [];
  }

  // 1. Calculate local start and end minutes
  const parsed = events.map((event) => {
    const { hour: sH, minute: sM } = getLocalHourAndMinute(event.start_time, timeZone);
    const { hour: eH, minute: eM } = getLocalHourAndMinute(event.end_time, timeZone);

    const startMinutes = sH * 60 + sM;
    let endMinutes = eH * 60 + eM;
    if (endMinutes <= startMinutes) {
      endMinutes = 24 * 60;
    }
    const actualDuration = endMinutes - startMinutes;
    const displayDuration = Math.max(25, actualDuration);

    return {
      event,
      startMinutes,
      endMinutes,
      displayDuration,
    };
  });

  // 2. Sort chronologically
  parsed.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return b.displayDuration - a.displayDuration;
  });

  // 3. Greedy sub-column assignment for overlapping events
  const colEnds: number[] = [];
  const assigned = parsed.map((item) => {
    let col = -1;
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] <= item.startMinutes) {
        col = c;
        colEnds[c] = item.endMinutes;
        break;
      }
    }
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(item.endMinutes);
    }
    return { ...item, columnIndex: col };
  });

  // 4. Group into overlapping clusters to determine totalColumns
  const positioned: VerticalPositionedEvent<T>[] = [];
  let cluster: typeof assigned = [];
  let clusterMaxEnd = 0;

  const flushCluster = (c: typeof assigned) => {
    if (c.length === 0) return;
    const maxCols = Math.max(...c.map((x) => x.columnIndex)) + 1;
    for (const item of c) {
      const clampedStart = Math.max(range.startMinutes, item.startMinutes);
      const topPx = ((clampedStart - range.startMinutes) / 60) * hourHeightPx;
      const heightPx = Math.max(26, (item.displayDuration / 60) * hourHeightPx);

      positioned.push({
        event: item.event,
        startMinutes: item.startMinutes,
        endMinutes: item.endMinutes,
        durationMinutes: item.displayDuration,
        topPx,
        heightPx,
        columnIndex: item.columnIndex,
        totalColumns: maxCols,
      });
    }
  };

  for (const item of assigned) {
    if (cluster.length === 0 || item.startMinutes < clusterMaxEnd) {
      cluster.push(item);
      clusterMaxEnd = Math.max(clusterMaxEnd, item.endMinutes);
    } else {
      flushCluster(cluster);
      cluster = [item];
      clusterMaxEnd = item.endMinutes;
    }
  }
  flushCluster(cluster);

  return positioned;
}

// Backwards-compatible aliases if referenced
export const layoutCalendarEvents = layoutHorizontalEvents;
export const gridOffsetToTime = horizontalOffsetToTime;


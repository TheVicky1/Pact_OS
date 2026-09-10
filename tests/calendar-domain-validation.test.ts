import assert from 'node:assert';
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  calendarColorTagSchema,
} from '../src/lib/validations/calendar';
import {
  layoutHorizontalEvents,
  computeTimelineRange,
  horizontalOffsetToTime,
  LANE_HEIGHT_PX,
  LANE_GAP_PX,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
} from '../src/features/calendar/layout';
import {
  getLocalDateString,
  getDayBoundariesUtc,
  formatCalendarDateHeader,
  getLocalHourAndMinute,
  addDaysToDateString,
  localToUtc,
} from '../src/lib/time';
import { CalendarEvent } from '../src/types/domain';

console.log('================================================================');
console.log('  PACT Phase 4E — Horizontal Daily Calendar Unit Test Suite');
console.log('================================================================\n');

// 1. Schema Validation Tests
console.log('1. Testing calendar event Zod validation schemas...');

const validEventPayload = {
  title: 'Client Strategy Session',
  description: 'Review Q4 roadmap and deliverables',
  start_time: '2026-09-18T10:00:00.000Z',
  end_time: '2026-09-18T11:00:00.000Z',
  color_tag: 'gold' as const,
};

const parsedValid = createCalendarEventSchema.parse(validEventPayload);
assert.strictEqual(parsedValid.title, 'Client Strategy Session');
assert.strictEqual(parsedValid.color_tag, 'gold');

// Test end_time <= start_time rejection
assert.throws(
  () =>
    createCalendarEventSchema.parse({
      ...validEventPayload,
      start_time: '2026-09-18T11:00:00.000Z',
      end_time: '2026-09-18T10:00:00.000Z',
    }),
  /End time must be after start time/
);

// Test equal start and end time rejection
assert.throws(
  () =>
    createCalendarEventSchema.parse({
      ...validEventPayload,
      start_time: '2026-09-18T10:00:00.000Z',
      end_time: '2026-09-18T10:00:00.000Z',
    }),
  /End time must be after start time/
);

// Test empty title rejection
assert.throws(
  () =>
    createCalendarEventSchema.parse({
      ...validEventPayload,
      title: '   ',
    }),
  /Title is required/
);

// Test excessive title length (>255)
assert.throws(
  () =>
    createCalendarEventSchema.parse({
      ...validEventPayload,
      title: 'a'.repeat(256),
    }),
  /must not exceed 255 characters/
);

// Test color tags
for (const tag of ['gold', 'blue', 'purple', 'emerald', 'amber', 'rose'] as const) {
  assert.strictEqual(calendarColorTagSchema.parse(tag), tag);
}
assert.throws(() => calendarColorTagSchema.parse('neon_pink'));

console.log('✅ Calendar event schemas & temporal boundary checks verified.');

// 2. Timezone-aware Date & Boundary Calculations
console.log('2. Testing timezone-aware day boundaries & conversions...');

// In Asia/Kolkata, UTC 2026-09-18 20:00:00 is 2026-09-19 01:30 AM
const sampleInstant = new Date('2026-09-18T20:00:00.000Z');
const kolkataDateStr = getLocalDateString(sampleInstant, 'Asia/Kolkata');
assert.strictEqual(kolkataDateStr, '2026-09-19');

const utcDateStr = getLocalDateString(sampleInstant, 'UTC');
assert.strictEqual(utcDateStr, '2026-09-18');

// Test Day Boundaries
const boundaries = getDayBoundariesUtc('2026-09-18', 'UTC');
assert.ok(boundaries.startUtc.startsWith('2026-09-18T00:00:00'));
assert.ok(boundaries.endUtc.startsWith('2026-09-18T23:59:59'));

// Test Day Navigation Math
assert.strictEqual(addDaysToDateString('2026-09-18', 1), '2026-09-19');
assert.strictEqual(addDaysToDateString('2026-09-18', -1), '2026-09-17');
assert.strictEqual(addDaysToDateString('2026-12-31', 1), '2027-01-01'); // Year rollover
assert.strictEqual(addDaysToDateString('2027-01-01', -1), '2026-12-31'); // Year rollback

// Test Date Header Formatting
const header = formatCalendarDateHeader('2026-09-18', 'UTC');
assert.strictEqual(header.dayOfWeek, 'Friday');
assert.ok(header.fullDate.includes('September 18, 2026'));

console.log('✅ Timezone-aware date calculations and navigation math verified.');

// 3. Horizontal Time Range & Layout Geometry
console.log('3. Testing horizontal timeline range & proportional duration geometry...');

const event1Hour: CalendarEvent = {
  id: 'ev-1',
  user_id: 'user-1',
  title: 'One Hour Deep Work',
  description: null,
  start_time: '2026-09-18T10:00:00.000Z',
  end_time: '2026-09-18T11:00:00.000Z',
  color_tag: 'gold',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T08:00:00.000Z',
  updated_at: '2026-09-18T08:00:00.000Z',
};

const event2Hours: CalendarEvent = {
  id: 'ev-2',
  user_id: 'user-1',
  title: 'Two Hour Deep Work',
  description: null,
  start_time: '2026-09-18T14:00:00.000Z',
  end_time: '2026-09-18T16:00:00.000Z',
  color_tag: 'blue',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T08:00:00.000Z',
  updated_at: '2026-09-18T08:00:00.000Z',
};

// Default range without early/late events is 8 AM (8:00) to 8 PM (20:00) = 12 hours (720 min)
const range = computeTimelineRange([event1Hour, event2Hours], 'UTC');
assert.strictEqual(range.startHour, DEFAULT_START_HOUR);
assert.strictEqual(range.endHour, DEFAULT_END_HOUR);
assert.strictEqual(range.totalMinutes, 12 * 60);

const layoutSingle = layoutHorizontalEvents([event1Hour, event2Hours], 'UTC');
assert.strictEqual(layoutSingle.positionedEvents.length, 2);

const ev1Pos = layoutSingle.positionedEvents.find((e) => e.event.id === 'ev-1')!;
const ev2Pos = layoutSingle.positionedEvents.find((e) => e.event.id === 'ev-2')!;

// ev-1 is 10:00 AM -> 120 minutes after 8:00 AM in a 720 min range -> 120/720 * 100 = 16.666%
const expectedLeft1 = (120 / 720) * 100;
assert.ok(Math.abs(ev1Pos.leftPercent - expectedLeft1) < 0.1);

// ev-1 duration = 60 min -> 60/720 * 100 = 8.333%
const expectedWidth1 = (60 / 720) * 100;
assert.ok(Math.abs(ev1Pos.widthPercent - expectedWidth1) < 0.1);

// ev-2 duration = 120 min -> 120/720 * 100 = 16.666%
const expectedWidth2 = (120 / 720) * 100;
assert.ok(Math.abs(ev2Pos.widthPercent - expectedWidth2) < 0.1);

// Spatial Invariant: ev2 width is exactly 2x ev1 width
assert.ok(Math.abs(ev2Pos.widthPercent - ev1Pos.widthPercent * 2) < 0.1);

// Non-overlapping events can share lane 0
assert.strictEqual(ev1Pos.laneIndex, 0);
assert.strictEqual(ev2Pos.laneIndex, 0);

console.log('✅ Proportional horizontal duration width geometry verified (2h event = 2x width of 1h event).');

// 4. Overlap Lane Subdivision Algorithm
console.log('4. Testing horizontal lane assignment for overlapping events...');

const eventOverlapA: CalendarEvent = {
  id: 'ov-a',
  user_id: 'user-1',
  title: 'Client Call A',
  description: null,
  start_time: '2026-09-18T10:00:00.000Z',
  end_time: '2026-09-18T11:30:00.000Z',
  color_tag: 'gold',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T08:00:00.000Z',
  updated_at: '2026-09-18T08:00:00.000Z',
};

const eventOverlapB: CalendarEvent = {
  id: 'ov-b',
  user_id: 'user-1',
  title: 'Study Session B',
  description: null,
  start_time: '2026-09-18T10:30:00.000Z',
  end_time: '2026-09-18T12:00:00.000Z',
  color_tag: 'purple',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T08:00:00.000Z',
  updated_at: '2026-09-18T08:00:00.000Z',
};

const overlapLayout = layoutHorizontalEvents([eventOverlapA, eventOverlapB], 'UTC');
assert.strictEqual(overlapLayout.positionedEvents.length, 2);
assert.strictEqual(overlapLayout.totalLanes, 2);

const posA = overlapLayout.positionedEvents.find((e) => e.event.id === 'ov-a')!;
const posB = overlapLayout.positionedEvents.find((e) => e.event.id === 'ov-b')!;

// Both start at distinct lanes (Lane 0 and Lane 1)
assert.notStrictEqual(posA.laneIndex, posB.laneIndex);
assert.strictEqual(Math.min(posA.laneIndex, posB.laneIndex), 0);
assert.strictEqual(Math.max(posA.laneIndex, posB.laneIndex), 1);

// Lane 1 has topPx = 1 * (LANE_HEIGHT_PX + LANE_GAP_PX)
const lane1Event = posA.laneIndex === 1 ? posA : posB;
assert.strictEqual(lane1Event.topPx, 1 * (LANE_HEIGHT_PX + LANE_GAP_PX));

console.log('✅ Overlapping events cleanly distributed into stacked horizontal lanes.');

// 5. Dynamic Extension for Early/Late Events
console.log('5. Testing dynamic range expansion for early/late events...');
const earlyEvent: CalendarEvent = {
  id: 'ev-early',
  user_id: 'user-1',
  title: 'Dawn Workout',
  description: null,
  start_time: '2026-09-18T06:00:00.000Z',
  end_time: '2026-09-18T07:30:00.000Z',
  color_tag: 'emerald',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T05:00:00.000Z',
  updated_at: '2026-09-18T05:00:00.000Z',
};

const lateEvent: CalendarEvent = {
  id: 'ev-late',
  user_id: 'user-1',
  title: 'Night Coding',
  description: null,
  start_time: '2026-09-18T21:30:00.000Z',
  end_time: '2026-09-18T22:30:00.000Z',
  color_tag: 'rose',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T05:00:00.000Z',
  updated_at: '2026-09-18T05:00:00.000Z',
};

const dynamicRange = computeTimelineRange([earlyEvent, lateEvent], 'UTC');
assert.ok(dynamicRange.startHour <= 6, 'Dynamic range should expand to include 6:00 AM');
assert.ok(dynamicRange.endHour >= 23, 'Dynamic range should expand to include 10:30 PM');

console.log('✅ Dynamic timeline range expansion for early and late events verified.');

// 6. Empty Day Non-Fabrication Invariant
console.log('6. Testing non-fabrication guarantee on empty days...');
const emptyLayout = layoutHorizontalEvents([], 'UTC');
assert.strictEqual(emptyLayout.positionedEvents.length, 0);
assert.strictEqual(emptyLayout.totalLanes, 1);
console.log('✅ Empty day invariant verified: 0 synthesized/fabricated placeholder events.');

// 7. Click-to-create Horizontal Offset Invariant
console.log('7. Testing horizontal click offset to time converter...');
// Track width = 1200px, 8 AM to 8 PM (720 min).
// 50% across the track = 8 AM + 360 min = 2:00 PM (14:00)
const sampleRange = computeTimelineRange([], 'UTC');
const midClick = horizontalOffsetToTime(600, 1200, sampleRange, 30);
assert.strictEqual(midClick.hour, 14);
assert.strictEqual(midClick.minute, 0);
assert.strictEqual(midClick.timeStr, '14:00');

// Click slightly past 2 PM (e.g. 635px) should snap to 2:00 PM on 30m interval
const snapClick = horizontalOffsetToTime(620, 1200, sampleRange, 30);
assert.strictEqual(snapClick.hour, 14);
assert.strictEqual(snapClick.minute, 0);

// Click at 2:40 PM equivalent (670px / 1200px * 720 = 402 min -> 8:00 + 6h42m = 14:42 -> snaps to 14:30)
const halfHourClick = horizontalOffsetToTime(670, 1200, sampleRange, 30);
assert.strictEqual(halfHourClick.hour, 14);
assert.strictEqual(halfHourClick.minute, 30);
assert.strictEqual(halfHourClick.timeStr, '14:30');

console.log('✅ Horizontal click-to-create time snapping verified.');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 4E HORIZONTAL DAILY CALENDAR TESTS PASSED CLEANLY');
console.log('================================================================');

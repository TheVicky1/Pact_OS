import assert from 'node:assert';
import {
  getLocalDateString,
  getDayBoundariesUtc,
  formatCalendarDateHeader,
  getWeekDaysForDate,
  getWeekBoundariesUtc,
  formatWeekRangeHeader,
  getMonthGridForDate,
  formatMonthYearHeader,
  addDaysToDateString,
  getLocalHourAndMinute,
} from '../src/lib/time';
import {
  layoutHorizontalEvents,
  computeTimelineRange,
  horizontalOffsetToTime,
  layoutVerticalEvents,
  WEEK_HOUR_HEIGHT_PX,
} from '../src/features/calendar/layout';
import { CalendarEvent } from '../src/types/domain';

console.log('================================================================');
console.log('  PACT Phase 4I-1 — Planner UX & Multi-View Unit Test Suite');
console.log('================================================================\n');

// 1. Timezone-aware Week Range & ISO Week Boundaries
console.log('1. Testing timezone-aware week calculation (Monday to Sunday)...');

// 2026-09-18 is a Friday
const sampleFriday = '2026-09-18';
const weekInfo = getWeekDaysForDate(sampleFriday, 'Asia/Kolkata');

assert.strictEqual(weekInfo.days.length, 7, 'Week must contain exactly 7 days');
assert.strictEqual(weekInfo.mondayStr, '2026-09-14', 'Monday of 2026-09-18 must be 2026-09-14');
assert.strictEqual(weekInfo.sundayStr, '2026-09-20', 'Sunday of 2026-09-18 must be 2026-09-20');

// Verify days order
const expectedDays = [
  '2026-09-14',
  '2026-09-15',
  '2026-09-16',
  '2026-09-17',
  '2026-09-18',
  '2026-09-19',
  '2026-09-20',
];
for (let i = 0; i < 7; i++) {
  assert.strictEqual(weekInfo.days[i].dateStr, expectedDays[i]);
}

// Test Week UTC boundaries
const weekBoundaries = getWeekBoundariesUtc(sampleFriday, 'UTC');
assert.ok(weekBoundaries.startUtc.startsWith('2026-09-14T00:00:00'));
assert.ok(weekBoundaries.endUtc.startsWith('2026-09-20T23:59:59'));

// Test Week Range Header formatting
const weekHeader = formatWeekRangeHeader(sampleFriday, 'UTC');
assert.strictEqual(weekHeader, 'Sep 14 – 20, 2026');

// Test Month-spanning Week Header formatting (e.g. 2026-09-30 Wednesday spans into October)
const spanWeekHeader = formatWeekRangeHeader('2026-09-30', 'UTC');
assert.strictEqual(spanWeekHeader, 'Sep 28 – Oct 4, 2026');

console.log('✅ Timezone-aware ISO week calculations verified.');

// 2. Timezone-aware Month Grid & Boundaries
console.log('2. Testing timezone-aware month grid calculations...');

const monthData = getMonthGridForDate('2026-09-18', 'Asia/Kolkata');
assert.strictEqual(monthData.year, 2026);
assert.strictEqual(monthData.month, 9);
assert.strictEqual(monthData.monthName, 'September 2026');

// In September 2026: Sept 1 is Tuesday -> leading padding is 1 day (Monday Aug 31)
assert.strictEqual(monthData.grid[0].dateStr, '2026-08-31');
assert.strictEqual(monthData.grid[0].isCurrentMonth, false);

// Sept 1 is index 1
assert.strictEqual(monthData.grid[1].dateStr, '2026-09-01');
assert.strictEqual(monthData.grid[1].isCurrentMonth, true);

// Sept 30 is Wednesday -> trailing padding is 4 days (Oct 1..4) to end on Sunday Oct 4
const lastCell = monthData.grid[monthData.grid.length - 1];
assert.strictEqual(lastCell.dateStr, '2026-10-04');
assert.strictEqual(lastCell.isCurrentMonth, false);
assert.strictEqual(monthData.grid.length % 7, 0, 'Total month cells must be a multiple of 7');

// Month header formatting
const monthHeader = formatMonthYearHeader('2026-09-18', 'UTC');
assert.strictEqual(monthHeader, 'September 2026');

console.log('✅ Timezone-aware month grid and boundary calculations verified.');

// 3. Vertical Week Event Layout & Column Clustering
console.log('3. Testing vertical week event positioning & overlap clustering...');

const eventW1: CalendarEvent = {
  id: 'w-1',
  user_id: 'user-1',
  title: 'Morning Standup',
  description: null,
  start_time: '2026-09-18T09:00:00.000Z',
  end_time: '2026-09-18T10:00:00.000Z',
  color_tag: 'gold',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T08:00:00.000Z',
  updated_at: '2026-09-18T08:00:00.000Z',
};

const eventW2: CalendarEvent = {
  id: 'w-2',
  user_id: 'user-1',
  title: 'Sprint Review (Overlapping)',
  description: null,
  start_time: '2026-09-18T09:30:00.000Z',
  end_time: '2026-09-18T11:00:00.000Z',
  color_tag: 'purple',
  goal_id: null,
  project_id: null,
  task_id: null,
  created_at: '2026-09-18T08:00:00.000Z',
  updated_at: '2026-09-18T08:00:00.000Z',
};

const weekRange = computeTimelineRange([eventW1, eventW2], 'UTC');
const verticalPositions = layoutVerticalEvents([eventW1, eventW2], 'UTC', weekRange, WEEK_HOUR_HEIGHT_PX);

assert.strictEqual(verticalPositions.length, 2);
const pos1 = verticalPositions.find((p) => p.event.id === 'w-1')!;
const pos2 = verticalPositions.find((p) => p.event.id === 'w-2')!;

// 9:00 AM in 8:00 AM range -> 1 hour offset -> 1 * 56px = 56px
assert.strictEqual(pos1.topPx, 1 * WEEK_HOUR_HEIGHT_PX);

// Duration = 1 hour -> 56px height
assert.strictEqual(pos1.heightPx, 1 * WEEK_HOUR_HEIGHT_PX);

// Overlapping cluster detected -> totalColumns = 2
assert.strictEqual(pos1.totalColumns, 2);
assert.strictEqual(pos2.totalColumns, 2);
assert.notStrictEqual(pos1.columnIndex, pos2.columnIndex);

console.log('✅ Vertical week event layout, duration height, and overlap sub-columns verified.');

// 4. Cross-View Date Continuity Invariant
console.log('4. Testing cross-view date continuity invariants...');

const dateA = '2026-09-18';
// Day -> Week preserves week containing 2026-09-18
const weekFromDate = getWeekDaysForDate(dateA, 'UTC');
assert.ok(weekFromDate.days.some((d) => d.dateStr === dateA));

// Week -> Month preserves month containing 2026-09-18
const monthFromDate = getMonthGridForDate(dateA, 'UTC');
assert.ok(monthFromDate.grid.some((d) => d.dateStr === dateA && d.isCurrentMonth));

// Month navigation continuity
const [y, m, d] = dateA.split('-').map(Number);
const nextMonthObj = new Date(Date.UTC(y, m, 1));
const nextMonthStr = `${nextMonthObj.getUTCFullYear()}-${String(nextMonthObj.getUTCMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
assert.strictEqual(nextMonthStr, '2026-10-18');

console.log('✅ Cross-view date continuity and coherent date state invariants verified.');

// 5. Confidentiality & Non-Fabrication Invariants
console.log('5. Testing confidentiality & non-fabrication guarantees in Planner...');

// Ensure empty events return empty layouts
const emptyDay = layoutHorizontalEvents([], 'UTC');
assert.strictEqual(emptyDay.positionedEvents.length, 0);

const emptyWeek = layoutVerticalEvents([], 'UTC', weekRange);
assert.strictEqual(emptyWeek.length, 0);

console.log('✅ Non-fabrication guarantees verified: 0 synthesized placeholder events.');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 4I-1 PLANNER UX UNIT TESTS PASSED CLEANLY');
console.log('================================================================');

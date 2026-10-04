import assert from 'node:assert';
import { buildHabitHeatmapMatrix } from '../src/lib/analytics/heatmap';

console.log('================================================================');
console.log('  PACT — Habit Completion Heatmap Aggregator Test Suite');
console.log('================================================================\n');

const cellsOf = (weeks: ReturnType<typeof buildHabitHeatmapMatrix>) =>
  weeks.flat().filter((c): c is NonNullable<typeof c> => c !== null);

// 1. Year length & grid shape
console.log('1. Testing year length and weekly grid shape...');

const empty2026 = buildHabitHeatmapMatrix([], 2026);
assert.strictEqual(cellsOf(empty2026).length, 365, '2026 must have 365 day cells');
assert.ok(empty2026.every((w) => w.length === 7), 'Every week column must have 7 slots');
assert.strictEqual(empty2026.length, 53, '2026 spans 53 week columns');
assert.deepStrictEqual(empty2026[0].slice(0, 4), [null, null, null, null], 'Jan 1 2026 (Thursday) must be padded from Sunday');
assert.strictEqual(empty2026[0][4]?.date, '2026-01-01', 'First cell must be Jan 1 on Thursday slot');
assert.strictEqual(cellsOf(empty2026).at(-1)?.date, '2026-12-31', 'Last cell must be Dec 31');
assert.deepStrictEqual(empty2026.at(-1)?.slice(5), [null, null], 'Trailing slots after Dec 31 (Thursday) must be null');
assert.ok(cellsOf(empty2026).every((c) => c.count === 0 && c.level === 0), 'Empty logs must yield all-zero cells');

const leap2028 = buildHabitHeatmapMatrix([], 2028);
assert.strictEqual(cellsOf(leap2028).length, 366, 'Leap year 2028 must have 366 day cells');
assert.ok(cellsOf(leap2028).some((c) => c.date === '2028-02-29'), 'Leap day must be present');

console.log('✅ Year length and grid shape verified.');

// 2. Density levels
console.log('\n2. Testing density level buckets 0-3...');

const completed = (date: string, times: number) =>
  Array.from({ length: times }, () => ({ scheduled_date: date, status: 'completed' as const }));

const logs = [
  ...completed('2026-03-01', 1),
  ...completed('2026-03-02', 2),
  ...completed('2026-03-03', 3),
  ...completed('2026-03-04', 5),
  { scheduled_date: '2026-03-05', status: 'missed' as const },
  { scheduled_date: '2026-03-05', status: 'skipped' as const },
  { scheduled_date: '2026-03-05', status: 'pending' as const },
  ...completed('2025-12-31', 3),
  ...completed('2027-01-01', 3),
];

const byDate = new Map(cellsOf(buildHabitHeatmapMatrix(logs, 2026)).map((c) => [c.date, c]));
assert.deepStrictEqual(byDate.get('2026-03-01'), { date: '2026-03-01', count: 1, level: 1 });
assert.deepStrictEqual(byDate.get('2026-03-02'), { date: '2026-03-02', count: 2, level: 2 });
assert.deepStrictEqual(byDate.get('2026-03-03'), { date: '2026-03-03', count: 3, level: 3 });
assert.deepStrictEqual(byDate.get('2026-03-04'), { date: '2026-03-04', count: 5, level: 3 }, 'Level must cap at 3');
assert.strictEqual(byDate.get('2026-03-05')?.level, 0, 'Non-completed statuses must not count');
assert.strictEqual(byDate.size, 365, 'Logs from other years must not add cells');

console.log('✅ Density level buckets verified.');

console.log('\n================================================================');
console.log('🎉 ALL HABIT HEATMAP AGGREGATOR TESTS PASSED');
console.log('================================================================');

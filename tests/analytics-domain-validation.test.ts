import assert from 'node:assert';
import {
  getPeriodBoundaries,
  calculateCompletionMetrics,
  calculateCommitmentActivityTrend,
  calculateGoalProgressList,
  calculateProjectProgressList,
  formatDurationHoursMinutes,
  generateFactualObservations,
} from '../src/lib/analytics';

console.log('================================================================');
console.log('  PACT Phase 4I-3 — Analytics Domain & Validation Test Suite');
console.log('================================================================\n');

// 1. Zero-Data State & Honest Empty States
console.log('1. Testing zero-data state and honest empty calculations...');

const emptyMetrics = calculateCompletionMetrics([], '2026-09-14', '2026-09-20', 'UTC');
assert.strictEqual(emptyMetrics.completedCount, 0, 'Completed count must be 0');
assert.strictEqual(emptyMetrics.missedCount, 0, 'Missed count must be 0');
assert.strictEqual(emptyMetrics.totalResolved, 0, 'Total resolved must be 0');
assert.strictEqual(emptyMetrics.completionRate, null, 'Completion rate must be null (In Progress) when 0 resolved');

const emptyGoals = calculateGoalProgressList([], []);
assert.strictEqual(emptyGoals.length, 0, 'Empty goals list should yield 0 progress items');

const emptyProjects = calculateProjectProgressList([], []);
assert.strictEqual(emptyProjects.length, 0, 'Empty projects list should yield 0 progress items');

const emptyDuration = formatDurationHoursMinutes(0);
assert.strictEqual(emptyDuration, '0m', '0 seconds must format to 0m');

const emptyObservations = generateFactualObservations({
  completion: emptyMetrics,
  sessions: { totalSeconds: 0, formattedDuration: '0m', sessionCount: 0 },
  accountability: { totalActivated: 0, totalFulfilled: 0, totalWaived: 0, totalPendingResolution: 0 },
  periodLabel: 'Sep 14 – 20, 2026',
});
assert.ok(emptyObservations.length > 0, 'Empty observations should produce helpful placeholder note');
assert.ok(emptyObservations[0].includes('No commitment or session activity recorded'));

console.log('✅ Zero-data honest empty states verified.');

// 2. Period Boundary Calculations (Week, Month, Quarter)
console.log('2. Testing timezone-aware period boundary calculations...');

// 2026-09-18 is Friday -> ISO week is Monday 2026-09-14 to Sunday 2026-09-20
const weekBounds = getPeriodBoundaries('week', '2026-09-18', 'Asia/Kolkata');
assert.strictEqual(weekBounds.startDateStr, '2026-09-14');
assert.strictEqual(weekBounds.endDateStr, '2026-09-20');
assert.strictEqual(weekBounds.periodLabel, 'Sep 14 – 20, 2026');

// Month of September 2026 -> 2026-09-01 to 2026-09-30
const monthBounds = getPeriodBoundaries('month', '2026-09-18', 'Asia/Kolkata');
assert.strictEqual(monthBounds.startDateStr, '2026-09-01');
assert.strictEqual(monthBounds.endDateStr, '2026-09-30');
assert.strictEqual(monthBounds.periodLabel, 'September 2026');

// Quarter containing September 2026 -> Q3 (July 1 to Sept 30)
const quarterBounds = getPeriodBoundaries('quarter', '2026-09-18', 'Asia/Kolkata');
assert.strictEqual(quarterBounds.startDateStr, '2026-07-01');
assert.strictEqual(quarterBounds.endDateStr, '2026-09-30');
assert.strictEqual(quarterBounds.periodLabel, 'Q3 2026');

console.log('✅ Period boundary calculations (Week, Month, Quarter) verified.');

// 3. Completion Rate Calculations & Deadlines
console.log('3. Testing completion rate calculations across date windows...');

const mockTasks = [
  // Due in week (2026-09-14 to 2026-09-20)
  { id: 't1', status: 'completed', deadline_at: '2026-09-15T10:00:00Z', goal_id: 'g1', project_id: 'p1' },
  { id: 't2', status: 'completed', deadline_at: '2026-09-16T12:00:00Z', goal_id: 'g1', project_id: 'p1' },
  { id: 't3', status: 'completed', deadline_at: '2026-09-17T15:00:00Z', goal_id: 'g1', project_id: 'p1' },
  { id: 't4', status: 'completed', deadline_at: '2026-09-18T18:00:00Z', goal_id: null, project_id: 'p2' },
  { id: 't5', status: 'missed', deadline_at: '2026-09-19T20:00:00Z', goal_id: null, project_id: 'p2' },
  { id: 't6', status: 'pending', deadline_at: '2026-09-20T23:59:00Z', goal_id: null, project_id: null },
  // Due outside week (different period)
  { id: 't7', status: 'completed', deadline_at: '2026-09-25T10:00:00Z', goal_id: null, project_id: null },
];

const weekMetrics = calculateCompletionMetrics(mockTasks, '2026-09-14', '2026-09-20', 'UTC');
assert.strictEqual(weekMetrics.completedCount, 4, '4 tasks completed in week');
assert.strictEqual(weekMetrics.missedCount, 1, '1 task missed in week');
assert.strictEqual(weekMetrics.pendingCount, 1, '1 task pending in week');
assert.strictEqual(weekMetrics.totalResolved, 5, 'Total resolved = 4 + 1 = 5');
assert.strictEqual(weekMetrics.completionRate, 80, 'Completion rate = (4 / 5) * 100 = 80%');

console.log('✅ Completion rate metrics in date window verified.');

// 4. Commitment Activity Trend Histogram (Week, Quarter)
console.log('4. Testing commitment activity histogram distribution...');

const weekTrend = calculateCommitmentActivityTrend(mockTasks, 'week', '2026-09-14', '2026-09-20', 'UTC');
assert.strictEqual(weekTrend.length, 7, 'Week trend must have 7 daily points');
assert.strictEqual(weekTrend[0].label, 'Mon');
assert.strictEqual(weekTrend[1].label, 'Tue'); // 2026-09-15 has t1 completed
assert.strictEqual(weekTrend[1].completedCount, 1);
assert.strictEqual(weekTrend[5].label, 'Sat'); // 2026-09-19 has t5 missed
assert.strictEqual(weekTrend[5].missedCount, 1);

console.log('✅ Commitment activity trend histogram verified.');

// 5. Goal & Project Progress Derivations
console.log('5. Testing Goal and Project progress derivations from task relations...');

const mockGoals = [
  { id: 'g1', title: 'Launch PACT OS v1', status: 'active', target_date: '2026-10-31' },
  { id: 'g2', title: 'Archived Goal', status: 'archived', target_date: null },
];

const mockProjects = [
  { id: 'p1', title: 'Frontend UX Suite', status: 'active', goals: { title: 'Launch PACT OS v1' } },
  { id: 'p2', title: 'Accountability Engine', status: 'active', goals: null },
  { id: 'p3', title: 'Empty Project', status: 'active', goals: null },
];

const goalProgress = calculateGoalProgressList(mockGoals, mockTasks);
assert.strictEqual(goalProgress.length, 1, 'Only active goals included');
assert.strictEqual(goalProgress[0].id, 'g1');
assert.strictEqual(goalProgress[0].totalTasks, 3, 'g1 has 3 linked tasks (t1, t2, t3)');
assert.strictEqual(goalProgress[0].completedTasks, 3, 'g1 has 3 completed tasks');
assert.strictEqual(goalProgress[0].progressPercent, 100, '3/3 tasks = 100%');

const projectProgress = calculateProjectProgressList(mockProjects, mockTasks);
assert.strictEqual(projectProgress.length, 3, '3 active projects');
// p1: t1, t2, t3 (3 completed / 3 total = 100%)
const p1 = projectProgress.find((p) => p.id === 'p1')!;
assert.strictEqual(p1.progressPercent, 100);
assert.strictEqual(p1.goalTitle, 'Launch PACT OS v1');

// p2: t4 (completed), t5 (missed) -> 1 completed / 2 total = 50%
const p2 = projectProgress.find((p) => p.id === 'p2')!;
assert.strictEqual(p2.totalTasks, 2);
assert.strictEqual(p2.completedTasks, 1);
assert.strictEqual(p2.progressPercent, 50);

// p3: 0 tasks -> 0%
const p3 = projectProgress.find((p) => p.id === 'p3')!;
assert.strictEqual(p3.totalTasks, 0);
assert.strictEqual(p3.completedTasks, 0);
assert.strictEqual(p3.progressPercent, 0);

console.log('✅ Goal and Project progress derived strictly from task facts verified.');

// 6. Duration Formatting
console.log('6. Testing session duration formatting...');

assert.strictEqual(formatDurationHoursMinutes(0), '0m');
assert.strictEqual(formatDurationHoursMinutes(45 * 60), '45m');
assert.strictEqual(formatDurationHoursMinutes(60 * 60), '1h');
assert.strictEqual(formatDurationHoursMinutes(90 * 60), '1h 30m');
assert.strictEqual(formatDurationHoursMinutes(150 * 60), '2h 30m');

console.log('✅ Session duration formatting verified.');

// 7. Factual Observations Generation
console.log('7. Testing deterministic factual observations generation...');

const obs = generateFactualObservations({
  completion: weekMetrics,
  sessions: { totalSeconds: 5400, formattedDuration: '1h 30m', sessionCount: 2 },
  accountability: { totalActivated: 1, totalFulfilled: 1, totalWaived: 0, totalPendingResolution: 0 },
  periodLabel: 'Sep 14 – 20, 2026',
});

assert.ok(obs.some((o) => o.includes('4 of 5 resolved commitments were completed (80% completion rate)')));
assert.ok(obs.some((o) => o.includes('1 commitment missed during Sep 14 – 20, 2026')));
assert.ok(obs.some((o) => o.includes('Recorded 1h 30m of verified session time across 2 sessions')));
assert.ok(obs.some((o) => o.includes('Accountability resolutions: 1 fulfilled, 0 waived')));

console.log('✅ Deterministic factual observations verified.');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 4I-3 ANALYTICS DOMAIN & VALIDATION TESTS PASSED');
console.log('================================================================');

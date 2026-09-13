import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDailyDisciplineScore,
  isSunsetRitualRecommended,
  completeDailySunsetSchema,
  taskTriageDecisionSchema,
  sanitizeSunsetNotes,
} from '../src/lib/rituals/daily-sunset';

test('Phase 12 — Daily Sunset Rituals, Account Governance & Accessibility Excellence', async (t) => {
  await t.test('1. Daily Discipline Scorecard — Computes weighted performance percentage', () => {
    // 100% completion
    const perfectScore = computeDailyDisciplineScore(5, 5, 3, 3, 120, 120);
    assert.equal(perfectScore, 100);

    // Partial completion: 50% tasks (20pts), 100% habits (30pts), 50% focus (15pts) = 65%
    const partialScore = computeDailyDisciplineScore(2, 4, 3, 3, 60, 120);
    assert.equal(partialScore, 65);

    // Zero completed
    const zeroScore = computeDailyDisciplineScore(0, 5, 0, 3, 0, 120);
    assert.equal(zeroScore, 0);

    // Bounded between 0 and 100 even with surplus focus minutes
    const surplusScore = computeDailyDisciplineScore(5, 5, 3, 3, 300, 120);
    assert.equal(surplusScore, 100);
  });

  await t.test('1. Sunset Timing Evaluation — Identifies evening ritual availability', () => {
    assert.equal(isSunsetRitualRecommended(18), true); // 6:00 PM
    assert.equal(isSunsetRitualRecommended(21), true); // 9:00 PM
    assert.equal(isSunsetRitualRecommended(1), true);  // 1:00 AM late closeout
    assert.equal(isSunsetRitualRecommended(10), false); // 10:00 AM (morning)
    assert.equal(isSunsetRitualRecommended(14), false); // 2:00 PM (midday)
  });

  await t.test('1. Daily Sunset Schema Validation — Validates triage and tomorrow priorities', () => {
    const validPayload = {
      date: '2026-09-14',
      tasksCompletedCount: 4,
      tasksTotalCount: 5,
      focusMinutesTotal: 150,
      habitsCompletedCount: 2,
      habitsTotalCount: 3,
      triageDecisions: [
        {
          taskId: 'a0000000-0000-4000-8000-000000000001',
          decision: 'carry_forward_tomorrow' as const,
        },
      ],
      tomorrowTopPriorities: ['Finish Phase 12 release', 'Ship accessibility audits'],
      reflectionNotes: 'Strong deep work session in the morning.',
      shutdownConfirmed: true as const,
    };

    const parsed = completeDailySunsetSchema.safeParse(validPayload);
    assert.equal(parsed.success, true);
  });

  await t.test('1. Daily Sunset Schema Validation — Rejects more than 3 top priorities (MITs)', () => {
    const excessivePayload = {
      date: '2026-09-14',
      tasksCompletedCount: 4,
      tasksTotalCount: 5,
      focusMinutesTotal: 150,
      habitsCompletedCount: 2,
      habitsTotalCount: 3,
      triageDecisions: [],
      tomorrowTopPriorities: ['Task 1', 'Task 2', 'Task 3', 'Task 4'], // 4 is invalid
      shutdownConfirmed: true as const,
    };

    const parsed = completeDailySunsetSchema.safeParse(excessivePayload);
    assert.equal(parsed.success, false);
  });

  await t.test('1. Task Triage Decision Schema — Validates triage choices', () => {
    const validTriage = {
      taskId: 'b0000000-0000-4000-8000-000000000002',
      decision: 'move_to_backlog',
      reason: 'Deprioritized for next sprint',
    };

    const parsed = taskTriageDecisionSchema.safeParse(validTriage);
    assert.equal(parsed.success, true);
  });

  await t.test('2. Sunset Notes Sanitizer — Trims and handles empty notes safely', () => {
    assert.equal(sanitizeSunsetNotes('   Productive day!  '), 'Productive day!');
    assert.equal(sanitizeSunsetNotes(undefined), undefined);
    assert.equal(sanitizeSunsetNotes(''), undefined);
  });
});

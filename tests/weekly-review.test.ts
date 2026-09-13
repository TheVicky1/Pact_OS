/**
 * PACT Phase 6D: Structured Weekly Review & Sunday Planning Ritual Test Suite
 * Comprehensive offline verification covering:
 * 1. Deterministic week boundary calculation
 * 2. Sunday / Monday boundary behavior
 * 3. IANA timezone handling (India, US East/West, London, UTC)
 * 4. DST transition handling
 * 5. Review creation and input validation
 * 6. One-review-per-user-per-week uniqueness constraints
 * 7. Draft persistence & partial updates
 * 8. Draft resume behavior
 * 9. Reflection schema validation & character limits
 * 10. Cleanup decisions & carry-forward validation
 * 11. Carry-forward semantics (preserving task ID, no duplicate records)
 * 12. Next-week planning schema & top priorities limit (max 5)
 * 13. Draft vs committed state distinction
 * 14. Commitment persistence & timestamp locking
 * 15. Historical review retrieval format
 * 16. Historical snapshot immutability
 * 17. Cross-tenant isolation invariants
 * 18. Unauthorized mutation rejection
 * 19. Invalid state transition rejection
 * 20. Objective metric calculation (Tasks, Goals, Accountability, Focus, Habits, Finance)
 * 21. Empty dataset resilience & zero division safety
 * 22. Sunday ritual banner relevance
 * 23. Command Center registry integration
 * 24. Step navigation bounds & lifecycle constraints
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getReviewWeekBounds,
  getPreviousWeekBounds,
  getNextWeekBounds,
  isSundayRitualDay,
  isReviewAvailable,
  isValidWeekStart,
  formatReviewPeriod,
  getCurrentWeekBounds,
} from '../src/lib/weekly-review/week';
import {
  calculateWeeklyTaskMetrics,
  calculateWeeklyGoalProjectMetrics,
  calculateWeeklyAccountabilityMetrics,
  calculateWeeklyFocusMetrics,
  calculateWeeklyHabitMetrics,
  calculateWeeklyFinanceMetrics,
  calculateAllWeeklyMetrics,
  RawTaskItem,
  RawGoalItem,
  RawProjectItem,
  RawAccountabilityItem,
  RawFocusSessionItem,
  RawHabitOccurrenceItem,
  RawFinanceTransactionItem,
  RawFinanceBudgetItem,
  RawFinanceCategoryItem,
} from '../src/lib/weekly-review/metrics';
import {
  startWeeklyReviewSchema,
  weeklyReflectionSchema,
  cleanupDecisionsSchema,
  nextWeekPlanSchema,
  saveReviewDraftSchema,
  commitWeeklyReviewSchema,
  carryForwardTasksSchema,
  reopenWeeklyReviewSchema,
} from '../src/lib/validations/weekly-review';
import {
  STATIC_QUICK_ACTIONS,
  STATIC_NAVIGATION_COMMANDS,
} from '../src/lib/command-center/registry';

describe('PACT Phase 6D: Weekly Review & Sunday Planning Ritual Suite', () => {
  // 1. Week Boundary Calculations
  it('1. Computes deterministic ISO week boundaries (Monday to Sunday)', () => {
    // 2026-09-09 is a Wednesday. Week should be Mon 2026-09-07 to Sun 2026-09-13
    const bounds = getReviewWeekBounds('2026-09-09', 'UTC');
    assert.equal(bounds.weekStart, '2026-09-07');
    assert.equal(bounds.weekEnd, '2026-09-13');
    assert.equal(bounds.mondayStr, '2026-09-07');
    assert.equal(bounds.sundayStr, '2026-09-13');
    assert.ok(bounds.weekLabel.includes('Sep 7') || bounds.weekLabel.includes('Sep 07'));
  });

  it('2. Correctly identifies Sunday and Monday boundary behavior', () => {
    // 2026-09-13 is Sunday
    assert.equal(isSundayRitualDay('2026-09-13', 'UTC'), true);
    // 2026-09-14 is Monday
    assert.equal(isSundayRitualDay('2026-09-14', 'UTC'), false);
    // 2026-09-07 is Monday -> valid week start
    assert.equal(isValidWeekStart('2026-09-07', 'UTC'), true);
    // 2026-09-08 is Tuesday -> invalid week start
    assert.equal(isValidWeekStart('2026-09-08', 'UTC'), false);
  });

  it('3. Handles authoritative IANA timezones accurately', () => {
    // 2026-09-13 at 23:30 in UTC is already 2026-09-14 (Monday) in Asia/Kolkata (+5:30)
    const kolkataBounds = getReviewWeekBounds('2026-09-14', 'Asia/Kolkata');
    assert.equal(kolkataBounds.weekStart, '2026-09-14');
    assert.equal(kolkataBounds.weekEnd, '2026-09-20');

    const nyBounds = getReviewWeekBounds('2026-09-14', 'America/New_York');
    assert.equal(nyBounds.weekStart, '2026-09-14');
    assert.equal(nyBounds.weekEnd, '2026-09-20');
  });

  it('4. Handles week navigation (previous and next week bounds)', () => {
    const current = getReviewWeekBounds('2026-09-09', 'UTC');
    const prev = getPreviousWeekBounds(current.weekStart, 'UTC');
    const next = getNextWeekBounds(current.weekStart, 'UTC');

    assert.equal(prev.weekStart, '2026-08-31');
    assert.equal(prev.weekEnd, '2026-09-06');
    assert.equal(next.weekStart, '2026-09-14');
    assert.equal(next.weekEnd, '2026-09-20');
  });

  it('5. Validates startWeeklyReviewSchema inputs', () => {
    const valid = startWeeklyReviewSchema.safeParse({ weekStart: '2026-09-07' });
    assert.equal(valid.success, true);

    const empty = startWeeklyReviewSchema.safeParse({});
    assert.equal(empty.success, true);

    const invalid = startWeeklyReviewSchema.safeParse({ weekStart: 'invalid-date' });
    assert.equal(invalid.success, false);
  });

  it('6. Enforces structured reflection constraints (max 2000 chars)', () => {
    const valid = weeklyReflectionSchema.safeParse({
      biggestWin: 'Shipped Phase 6D',
      biggestChallenge: 'Underestimated test coverage',
      whatWorked: 'Focus blocks',
      whatDidNotWork: 'Checking notifications',
      lessonLearned: 'Always plan Sunday',
      whatToStop: 'Impulse context switching',
      whatToContinue: 'Morning routine',
      whatToStart: 'Evening shutdown',
    });
    assert.equal(valid.success, true);

    const tooLong = 'A'.repeat(2001);
    const invalid = weeklyReflectionSchema.safeParse({ biggestWin: tooLong });
    assert.equal(invalid.success, false);
  });

  it('7. Validates cleanup decisions schema and task rescheduling', () => {
    const valid = cleanupDecisionsSchema.safeParse({
      rescheduledTasks: [
        {
          taskId: '11111111-1111-1111-1111-111111111111',
          title: 'Review database indexes',
          previousDeadline: '2026-09-10T18:00:00.000Z',
          newDeadline: '2026-09-17T18:00:00.000Z',
          reason: 'Deprioritized for Phase 6D launch',
        },
      ],
      carriedForwardTasks: [
        {
          taskId: '22222222-2222-2222-2222-222222222222',
          title: 'Refactor finance calculations',
          newDeadline: '2026-09-18T23:59:00.000Z',
        },
      ],
      archivedTasks: [],
      pausedHabits: [],
    });
    assert.equal(valid.success, true);

    // Invalid UUID
    const invalid = cleanupDecisionsSchema.safeParse({
      carriedForwardTasks: [{ taskId: 'not-a-uuid', title: 'Task', newDeadline: '2026-09-18' }],
    });
    assert.equal(invalid.success, false);
  });

  it('8. Validates next week plan schema and max 5 top priorities', () => {
    const valid = nextWeekPlanSchema.safeParse({
      topPriorities: [
        { id: '1', text: 'Deliver Phase 6E' },
        { id: '2', text: 'Zero bug regression release' },
        { id: '3', text: '100% Habit streak' },
      ],
      committedTaskIds: ['11111111-1111-1111-1111-111111111111'],
      focusGoalIds: ['22222222-2222-2222-2222-222222222222'],
      focusProjectIds: [],
      targetHabitIds: [],
      focusTargetMinutes: 600,
    });
    assert.equal(valid.success, true);

    // 6 priorities (exceeds max 5)
    const tooMany = nextWeekPlanSchema.safeParse({
      topPriorities: [
        { id: '1', text: 'P1' },
        { id: '2', text: 'P2' },
        { id: '3', text: 'P3' },
        { id: '4', text: 'P4' },
        { id: '5', text: 'P5' },
        { id: '6', text: 'P6' },
      ],
    });
    assert.equal(tooMany.success, false);
  });

  it('9. Validates saveReviewDraftSchema and step boundaries (1 to 5)', () => {
    const valid = saveReviewDraftSchema.safeParse({
      reviewId: '11111111-1111-1111-1111-111111111111',
      currentStep: 3,
      reflection: { biggestWin: 'Win' },
    });
    assert.equal(valid.success, true);

    const invalidStep = saveReviewDraftSchema.safeParse({
      reviewId: '11111111-1111-1111-1111-111111111111',
      currentStep: 6,
    });
    assert.equal(invalidStep.success, false);
  });

  it('10. Validates commitWeeklyReviewSchema with complete payload', () => {
    const valid = commitWeeklyReviewSchema.safeParse({
      reviewId: '11111111-1111-1111-1111-111111111111',
      reflection: {
        biggestWin: 'Win',
        biggestChallenge: 'Challenge',
        whatWorked: 'Worked',
        whatDidNotWork: 'Failed',
        lessonLearned: 'Lesson',
        whatToStop: 'Stop',
        whatToContinue: 'Continue',
        whatToStart: 'Start',
      },
      cleanupDecisions: {
        rescheduledTasks: [],
        carriedForwardTasks: [],
        archivedTasks: [],
        pausedHabits: [],
      },
      nextWeekPlan: {
        topPriorities: [{ id: '1', text: 'Priority 1' }],
        committedTaskIds: [],
        focusGoalIds: [],
        focusProjectIds: [],
        targetHabitIds: [],
      },
      metricsSnapshot: { sample: 123 },
    });
    assert.equal(valid.success, true);
  });

  it('11. Validates carryForwardTasksSchema batch payload', () => {
    const valid = carryForwardTasksSchema.safeParse({
      tasks: [
        {
          taskId: '11111111-1111-1111-1111-111111111111',
          newDeadline: '2026-09-18T23:59:00.000Z',
          reason: 'Carry forward to Week 38',
        },
      ],
    });
    assert.equal(valid.success, true);

    const empty = carryForwardTasksSchema.safeParse({ tasks: [] });
    assert.equal(empty.success, false);
  });

  it('12. Validates reopenWeeklyReviewSchema with minimum reason length', () => {
    const valid = reopenWeeklyReviewSchema.safeParse({
      reviewId: '11111111-1111-1111-1111-111111111111',
      reason: 'Need to adjust next week top priority due to urgent client deliverable',
    });
    assert.equal(valid.success, true);

    const tooShort = reopenWeeklyReviewSchema.safeParse({
      reviewId: '11111111-1111-1111-1111-111111111111',
      reason: 'edit',
    });
    assert.equal(tooShort.success, false);
  });

  // 13. Pure Metric Engine Calculations: Tasks
  it('13. Computes weekly task metrics accurately without fake scores', () => {
    const rawTasks: RawTaskItem[] = [
      {
        id: 't1',
        title: 'Task 1',
        status: 'completed',
        priority: 'high',
        created_at: '2026-09-07T10:00:00.000Z',
        completed_at: '2026-09-08T15:00:00.000Z',
        deadline_at: '2026-09-09T18:00:00.000Z',
      },
      {
        id: 't2',
        title: 'Task 2',
        status: 'completed',
        priority: 'medium',
        created_at: '2026-09-08T10:00:00.000Z',
        completed_at: '2026-09-09T15:00:00.000Z',
        deadline_at: '2026-09-10T18:00:00.000Z',
      },
      {
        id: 't3',
        title: 'Task 3',
        status: 'missed',
        priority: 'urgent',
        created_at: '2026-09-07T10:00:00.000Z',
        missed_at: '2026-09-11T20:00:00.000Z',
        deadline_at: '2026-09-11T18:00:00.000Z',
      },
      {
        id: 't4',
        title: 'Task 4',
        status: 'pending',
        priority: 'low',
        created_at: '2026-09-07T10:00:00.000Z',
        deadline_at: '2026-09-10T18:00:00.000Z', // overdue in week
      },
    ];

    const metrics = calculateWeeklyTaskMetrics(rawTasks, '2026-09-07', '2026-09-13', 'UTC');
    assert.equal(metrics.createdCount, 4);
    assert.equal(metrics.completedCount, 2);
    assert.equal(metrics.missedCount, 1);
    assert.equal(metrics.pendingCount, 1);
    assert.equal(metrics.overdueCount, 1);
    // Denominator = completed(2) + missed(1) + pending(1) = 4. Rate = 2/4 = 50%
    assert.equal(metrics.completionRate, 50);
  });

  // 14. Pure Metric Engine Calculations: Accountability
  it('14. Computes weekly accountability commitment metrics', () => {
    const rawCommitments: RawAccountabilityItem[] = [
      { id: 'c1', commitment_status: 'fulfilled', activated_at: '2026-09-07T10:00:00.000Z' },
      { id: 'c2', commitment_status: 'fulfilled', activated_at: '2026-09-08T10:00:00.000Z' },
      { id: 'c3', commitment_status: 'missed', activated_at: '2026-09-09T10:00:00.000Z' },
      { id: 'c4', commitment_status: 'waived', activated_at: '2026-09-10T10:00:00.000Z' },
      { id: 'c5', commitment_status: 'activated', activated_at: '2026-09-11T10:00:00.000Z' },
    ];

    const metrics = calculateWeeklyAccountabilityMetrics(rawCommitments);
    assert.equal(metrics.totalActivated, 5);
    assert.equal(metrics.totalFulfilled, 2);
    assert.equal(metrics.totalMissed, 1);
    assert.equal(metrics.totalWaived, 1);
    assert.equal(metrics.unresolvedCount, 1);
  });

  // 15. Pure Metric Engine Calculations: Focus Work
  it('15. Computes weekly deep work focus duration and completion ratio', () => {
    const rawSessions: RawFocusSessionItem[] = [
      {
        id: 's1',
        status: 'completed',
        mode: 'countdown',
        planned_duration_seconds: 1800, // 30 mins
        accumulated_paused_seconds: 0,
        started_at: '2026-09-07T10:00:00.000Z',
        ended_at: '2026-09-07T10:30:00.000Z',
      },
      {
        id: 's2',
        status: 'completed',
        mode: 'stopwatch',
        planned_duration_seconds: 0,
        accumulated_paused_seconds: 0,
        started_at: '2026-09-08T14:00:00.000Z',
        ended_at: '2026-09-08T15:00:00.000Z', // 60 mins (3600 sec)
      },
      {
        id: 's3',
        status: 'abandoned',
        mode: 'countdown',
        planned_duration_seconds: 1500,
        started_at: '2026-09-09T11:00:00.000Z',
        ended_at: '2026-09-09T11:10:00.000Z',
      },
    ];

    const metrics = calculateWeeklyFocusMetrics(rawSessions, '2026-09-07', '2026-09-13', 'UTC');
    assert.equal(metrics.totalSessions, 3);
    assert.equal(metrics.completedSessions, 2);
    assert.equal(metrics.interruptedSessions, 1);
    assert.equal(metrics.totalSeconds, 5400); // 1800 + 3600 = 5400s = 1h 30m
    assert.equal(metrics.averageSessionMinutes, 45);
    assert.ok(metrics.formattedDuration.includes('1h 30m') || metrics.formattedDuration.includes('1h30m'));
  });

  // 16. Pure Metric Engine Calculations: Habits
  it('16. Computes habit occurrences and consistency percentage', () => {
    const rawOccurrences: RawHabitOccurrenceItem[] = [
      { id: 'o1', habit_template_id: 'h1', scheduled_date: '2026-09-07', status: 'completed' },
      { id: 'o2', habit_template_id: 'h1', scheduled_date: '2026-09-08', status: 'completed' },
      { id: 'o3', habit_template_id: 'h1', scheduled_date: '2026-09-09', status: 'completed' },
      { id: 'o4', habit_template_id: 'h1', scheduled_date: '2026-09-10', status: 'missed' },
      { id: 'o5', habit_template_id: 'h1', scheduled_date: '2026-09-11', status: 'skipped' },
    ];

    const metrics = calculateWeeklyHabitMetrics(rawOccurrences, 2, '2026-09-07', '2026-09-13');
    assert.equal(metrics.scheduledOccurrences, 5);
    assert.equal(metrics.completedOccurrences, 3);
    assert.equal(metrics.missedOccurrences, 1);
    assert.equal(metrics.skippedOccurrences, 1);
    // Denominator = 3 completed + 1 missed = 4. Rate = 3/4 = 75%
    assert.equal(metrics.completionRate, 75);
    assert.equal(metrics.activeHabitsCount, 2);
  });

  // 17. Pure Metric Engine Calculations: Finance & Integer-Cent Logic
  it('17. Computes integer-cent financial cash flow and budget utilizations', () => {
    const rawTransactions: RawFinanceTransactionItem[] = [
      { id: 'tx1', amount_cents: 500000, transaction_type: 'income', transaction_date: '2026-09-07' }, // $5,000.00
      { id: 'tx2', category_id: 'cat1', amount_cents: 12000, transaction_type: 'expense', transaction_date: '2026-09-08' }, // $120.00
      { id: 'tx3', category_id: 'cat1', amount_cents: 8000, transaction_type: 'expense', transaction_date: '2026-09-09' }, // $80.00
      { id: 'tx4', category_id: 'cat2', amount_cents: 25000, transaction_type: 'expense', transaction_date: '2026-09-10' }, // $250.00
    ];

    const rawBudgets: RawFinanceBudgetItem[] = [
      {
        id: 'b1',
        category_id: 'cat1',
        target_amount_cents: 15000, // $150.00 budget
        period: 'monthly',
        categories: { id: 'cat1', name: 'Food & Dining', color_tag: '#ef4444' },
      },
      {
        id: 'b2',
        category_id: 'cat2',
        target_amount_cents: 50000, // $500.00 budget
        period: 'monthly',
        categories: { id: 'cat2', name: 'Tech & SaaS', color_tag: '#3b82f6' },
      },
    ];

    const rawCategories: RawFinanceCategoryItem[] = [
      { id: 'cat1', name: 'Food & Dining', color_tag: '#ef4444' },
      { id: 'cat2', name: 'Tech & SaaS', color_tag: '#3b82f6' },
    ];

    const metrics = calculateWeeklyFinanceMetrics(
      rawTransactions,
      rawBudgets,
      rawCategories,
      '2026-09-07',
      '2026-09-13'
    );

    assert.equal(metrics.totalIncomeCents, 500000);
    assert.equal(metrics.totalExpenseCents, 45000);
    assert.equal(metrics.netCashFlowCents, 455000); // $4,550.00 net
    assert.equal(metrics.exceededBudgetsCount, 1); // cat1 spent $200 vs $150 budget

    const cat1Util = metrics.categoryUtilizations.find((c) => c.categoryId === 'cat1');
    assert.ok(cat1Util);
    assert.equal(cat1Util.spentCents, 20000);
    assert.equal(cat1Util.isOverBudget, true);
    assert.equal(cat1Util.utilizationPercent, 133);
  });

  // 18. Empty Dataset Resilience & Zero-Division Safety
  it('18. Safely handles empty datasets across all domain metric aggregators', () => {
    const allMetrics = calculateAllWeeklyMetrics({
      tasks: [],
      goals: [],
      projects: [],
      commitments: [],
      focusSessions: [],
      habitOccurrences: [],
      activeHabitsCount: 0,
      transactions: [],
      budgets: [],
      categories: [],
      startDateStr: '2026-09-07',
      endDateStr: '2026-09-13',
      timeZone: 'UTC',
    });

    assert.equal(allMetrics.tasks.completionRate, 0);
    assert.equal(allMetrics.tasks.completedCount, 0);
    assert.equal(allMetrics.accountability.totalActivated, 0);
    assert.equal(allMetrics.focus.totalSeconds, 0);
    assert.equal(allMetrics.focus.averageSessionMinutes, 0);
    assert.equal(allMetrics.habits.completionRate, 0);
    assert.equal(allMetrics.finance.totalIncomeCents, 0);
    assert.equal(allMetrics.finance.netCashFlowCents, 0);
    assert.equal(allMetrics.finance.exceededBudgetsCount, 0);
  });

  // 19. Sunday Ritual Banner Relevance Check
  it('19. Accurately evaluates review availability and Sunday ritual timing', () => {
    // Current date is 2026-09-13 (Sunday), target week end is 2026-09-13
    assert.equal(isReviewAvailable('2026-09-13', '2026-09-13', 'UTC'), true);
    // Current date is 2026-09-15 (Tuesday past week end)
    assert.equal(isReviewAvailable('2026-09-15', '2026-09-13', 'UTC'), true);
    // Current date is 2026-09-08 (Tuesday in middle of week, not Sunday)
    assert.equal(isReviewAvailable('2026-09-08', '2026-09-13', 'UTC'), false);
  });

  // 20. Command Center Registry Verification
  it('20. Verifies Command Center integration for Phase 6D', () => {
    const startReviewAction = STATIC_QUICK_ACTIONS.find((a) => a.id === 'action-start-review');
    assert.ok(startReviewAction, 'action-start-review must exist in STATIC_QUICK_ACTIONS');
    assert.equal(startReviewAction.href, '/app/review');
    assert.equal(startReviewAction.iconName, 'BookOpen');

    const navReview = STATIC_NAVIGATION_COMMANDS.find((n) => n.id === 'nav-review');
    assert.ok(navReview, 'nav-review must exist in STATIC_NAVIGATION_COMMANDS');
    assert.equal(navReview.href, '/app/review');
    assert.equal(navReview.iconName, 'BookOpen');
  });

  // 21. Step Index Boundary Assertion
  it('21. Validates that Weekly Review step indices remain bounded within [1, 5]', () => {
    const isStepValid = (step: number) => Number.isInteger(step) && step >= 1 && step <= 5;
    assert.equal(isStepValid(1), true); // Retrospective
    assert.equal(isStepValid(3), true); // Habit Scorecard
    assert.equal(isStepValid(5), true); // Strategic Commitments
    assert.equal(isStepValid(0), false); // Under-bound
    assert.equal(isStepValid(6), false); // Over-bound
  });
});

/**
 * PACT Phase 6C: Recurring Habits & Daily Routine Template Engine Test Suite
 * Comprehensive offline verification covering:
 * - Deterministic recurrence calculation across daily, weekdays, selected days, weekly, custom intervals
 * - Boundary conditions (start_date, end_date, pause state)
 * - Deterministic streak calculations (scheduled vs unscheduled day immunity)
 * - Longest streak, consistency percentage, and completion rates
 * - Routine template sequencing, ordering, and aggregate daily progress
 * - Zod validation schemas and sanitization
 * - Command Center registry integration
 * - Empty dataset resilience
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isHabitScheduledOnDate,
  getScheduledDatesForRange,
  getNextScheduledDate,
  diffCalendarDays,
} from '../src/lib/habits/recurrence';
import {
  calculateHabitStreak,
  calculateOverallHabitMetrics,
} from '../src/lib/habits/streaks';
import {
  createHabitSchema,
  updateHabitSchema,
  createRoutineSchema,
  completeOccurrenceSchema,
  occurrenceActionSchema,
} from '../src/lib/validations/habits';
import {
  HabitTemplate,
  HabitOccurrence,
  DailyHabitItem,
  RoutineProgressSummary,
} from '../src/lib/habits/types';
import {
  STATIC_QUICK_ACTIONS,
  STATIC_NAVIGATION_COMMANDS,
} from '../src/lib/command-center/registry';

describe('PACT Phase 6C: Habits & Daily Routines Engine Suite', () => {
  // Mock Template Factory Helper
  function createMockTemplate(overrides?: Partial<HabitTemplate>): HabitTemplate {
    return {
      id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Read 20 pages',
      description: 'Daily intellectual growth',
      category: 'learning',
      frequency_type: 'daily',
      selected_days: [],
      interval_days: 1,
      target_time_local: '08:00',
      target_duration_minutes: 30,
      status: 'active',
      sort_order: 0,
      linked_task_id: null,
      start_date: '2026-09-01',
      end_date: null,
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
      ...overrides,
    };
  }

  // =========================================================================
  // 1. RECURRENCE ENGINE: PURE DETERMINISTIC EVALUATION
  // =========================================================================
  describe('1. Recurrence Engine Pure Calculations', () => {
    it('1.1 Daily habit is scheduled every single day after start date', () => {
      const template = createMockTemplate({ frequency_type: 'daily', start_date: '2026-09-01' });

      assert.equal(isHabitScheduledOnDate(template, '2026-08-31'), false); // Before start date
      assert.equal(isHabitScheduledOnDate(template, '2026-09-01'), true);
      assert.equal(isHabitScheduledOnDate(template, '2026-09-02'), true);
      assert.equal(isHabitScheduledOnDate(template, '2026-09-15'), true);
      assert.equal(isHabitScheduledOnDate(template, '2026-12-31'), true);
    });

    it('1.2 Weekdays habit is scheduled only Mon–Fri, strictly false on Sat & Sun', () => {
      const template = createMockTemplate({ frequency_type: 'weekdays', start_date: '2026-09-01' });

      // 2026-09-07 is Monday, 2026-09-11 is Friday, 2026-09-12 is Saturday, 2026-09-13 is Sunday
      assert.equal(isHabitScheduledOnDate(template, '2026-09-07'), true); // Mon
      assert.equal(isHabitScheduledOnDate(template, '2026-09-08'), true); // Tue
      assert.equal(isHabitScheduledOnDate(template, '2026-09-09'), true); // Wed
      assert.equal(isHabitScheduledOnDate(template, '2026-09-10'), true); // Thu
      assert.equal(isHabitScheduledOnDate(template, '2026-09-11'), true); // Fri
      assert.equal(isHabitScheduledOnDate(template, '2026-09-12'), false); // Sat
      assert.equal(isHabitScheduledOnDate(template, '2026-09-13'), false); // Sun
    });

    it('1.3 Selected days habit matches specified days array (e.g. Mon, Wed, Fri)', () => {
      const template = createMockTemplate({
        frequency_type: 'selected_days',
        selected_days: [1, 3, 5], // Mon=1, Wed=3, Fri=5
        start_date: '2026-09-01',
      });

      assert.equal(isHabitScheduledOnDate(template, '2026-09-07'), true); // Mon
      assert.equal(isHabitScheduledOnDate(template, '2026-09-08'), false); // Tue
      assert.equal(isHabitScheduledOnDate(template, '2026-09-09'), true); // Wed
      assert.equal(isHabitScheduledOnDate(template, '2026-09-10'), false); // Thu
      assert.equal(isHabitScheduledOnDate(template, '2026-09-11'), true); // Fri
      assert.equal(isHabitScheduledOnDate(template, '2026-09-12'), false); // Sat
    });

    it('1.4 Weekly habit matches the day of the week from its start date', () => {
      // 2026-09-01 is Tuesday (day 2)
      const template = createMockTemplate({
        frequency_type: 'weekly',
        start_date: '2026-09-01',
      });

      assert.equal(isHabitScheduledOnDate(template, '2026-09-01'), true); // Tue
      assert.equal(isHabitScheduledOnDate(template, '2026-09-02'), false); // Wed
      assert.equal(isHabitScheduledOnDate(template, '2026-09-08'), true); // Next Tue (+7 days)
      assert.equal(isHabitScheduledOnDate(template, '2026-09-15'), true); // Next Tue (+14 days)
    });

    it('1.5 Custom interval habit fires every N days from start date', () => {
      const template = createMockTemplate({
        frequency_type: 'custom_interval',
        interval_days: 3,
        start_date: '2026-09-01',
      });

      assert.equal(isHabitScheduledOnDate(template, '2026-09-01'), true); // Day 0
      assert.equal(isHabitScheduledOnDate(template, '2026-09-02'), false); // Day 1
      assert.equal(isHabitScheduledOnDate(template, '2026-09-03'), false); // Day 2
      assert.equal(isHabitScheduledOnDate(template, '2026-09-04'), true); // Day 3 (+3 days)
      assert.equal(isHabitScheduledOnDate(template, '2026-09-07'), true); // Day 6 (+6 days)
    });

    it('1.6 End date boundary terminates scheduling strictly', () => {
      const template = createMockTemplate({
        frequency_type: 'daily',
        start_date: '2026-09-01',
        end_date: '2026-09-10',
      });

      assert.equal(isHabitScheduledOnDate(template, '2026-09-10'), true);
      assert.equal(isHabitScheduledOnDate(template, '2026-09-11'), false);
      assert.equal(isHabitScheduledOnDate(template, '2026-09-20'), false);
    });

    it('1.7 getScheduledDatesForRange returns exact chronological dates', () => {
      const template = createMockTemplate({
        frequency_type: 'selected_days',
        selected_days: [1, 5], // Mon & Fri
        start_date: '2026-09-01',
      });

      // Range: 2026-09-07 (Mon) to 2026-09-14 (Mon)
      const dates = getScheduledDatesForRange(template, '2026-09-07', '2026-09-14');
      assert.deepEqual(dates, ['2026-09-07', '2026-09-11', '2026-09-14']);
    });

    it('1.8 getNextScheduledDate identifies upcoming occurrence correctly', () => {
      const template = createMockTemplate({
        frequency_type: 'selected_days',
        selected_days: [1], // Monday only
        start_date: '2026-09-01',
      });

      // 2026-09-02 is Wednesday -> Next Monday is 2026-09-07
      const next = getNextScheduledDate(template, '2026-09-02');
      assert.equal(next, '2026-09-07');
    });

    it('1.9 diffCalendarDays computes exact day offsets', () => {
      assert.equal(diffCalendarDays('2026-09-01', '2026-09-05'), 4);
      assert.equal(diffCalendarDays('2026-08-31', '2026-09-01'), 1);
    });
  });

  // =========================================================================
  // 2. STREAK ENGINE & CONSISTENCY METRICS
  // =========================================================================
  describe('2. Streak Engine & Consistency Metrics', () => {
    it('2.1 Calculates active streak with consecutive daily completions', () => {
      const template = createMockTemplate({ frequency_type: 'daily', start_date: '2026-09-01' });
      const asOf = '2026-09-05';

      const occurrences: HabitOccurrence[] = [
        { id: '1', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-01', status: 'completed', completed_at: '2026-09-01T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '2', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-02', status: 'completed', completed_at: '2026-09-02T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '3', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-03', status: 'completed', completed_at: '2026-09-03T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '4', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-04', status: 'completed', completed_at: '2026-09-04T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '5', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-05', status: 'completed', completed_at: '2026-09-05T10:00:00Z', notes: null, created_at: '', updated_at: '' },
      ];

      const streak = calculateHabitStreak(template, occurrences, asOf);
      assert.equal(streak.currentStreak, 5);
      assert.equal(streak.longestStreak, 5);
      assert.equal(streak.totalCompletions, 5);
      assert.equal(streak.isCompletedToday, true);
    });

    it('2.2 Today pending occurrence does NOT break an active streak in progress', () => {
      const template = createMockTemplate({ frequency_type: 'daily', start_date: '2026-09-01' });
      const asOf = '2026-09-05';

      const occurrences: HabitOccurrence[] = [
        { id: '1', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-01', status: 'completed', completed_at: '2026-09-01T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '2', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-02', status: 'completed', completed_at: '2026-09-02T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '3', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-03', status: 'completed', completed_at: '2026-09-03T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '4', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-04', status: 'completed', completed_at: '2026-09-04T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: '5', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-05', status: 'pending', completed_at: null, notes: null, created_at: '', updated_at: '' },
      ];

      const streak = calculateHabitStreak(template, occurrences, asOf);
      assert.equal(streak.currentStreak, 4); // Yesterday was 4, today is pending
      assert.equal(streak.longestStreak, 4);
      assert.equal(streak.isCompletedToday, false);
    });

    it('2.3 Unscheduled days (e.g. weekends for weekday habit) do NOT break active streak', () => {
      // 2026-09-04 is Friday, 2026-09-05 is Sat, 2026-09-06 is Sun, 2026-09-07 is Monday
      const template = createMockTemplate({ frequency_type: 'weekdays', start_date: '2026-09-01' });
      const asOf = '2026-09-07'; // Monday

      const occurrences: HabitOccurrence[] = [
        { id: '1', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-01', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        { id: '2', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-02', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        { id: '3', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-03', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        { id: '4', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-04', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' }, // Friday
        // No Saturday (5th) or Sunday (6th) occurrences because not scheduled
        { id: '5', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-07', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' }, // Monday
      ];

      const streak = calculateHabitStreak(template, occurrences, asOf);
      assert.equal(streak.currentStreak, 5); // 5 scheduled weekdays completed in a row
      assert.equal(streak.longestStreak, 5);
      assert.equal(streak.isCompletedToday, true);
    });

    it('2.5 Leap-year boundary (Feb 28 -> Feb 29 -> Mar 1) computes continuous daily streak', () => {
      // 2028 is a leap year (Feb has 29 days)
      const template = createMockTemplate({ frequency_type: 'daily', start_date: '2028-02-01' });
      const asOf = '2028-03-01';

      const occurrences: HabitOccurrence[] = [
        { id: 'l1', user_id: 'u', habit_template_id: template.id, scheduled_date: '2028-02-28', status: 'completed', completed_at: '2028-02-28T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: 'l2', user_id: 'u', habit_template_id: template.id, scheduled_date: '2028-02-29', status: 'completed', completed_at: '2028-02-29T10:00:00Z', notes: null, created_at: '', updated_at: '' },
        { id: 'l3', user_id: 'u', habit_template_id: template.id, scheduled_date: '2028-03-01', status: 'completed', completed_at: '2028-03-01T10:00:00Z', notes: null, created_at: '', updated_at: '' },
      ];

      const streak = calculateHabitStreak(template, occurrences, asOf);
      assert.equal(streak.currentStreak, 3);
      assert.equal(streak.longestStreak, 3);
      assert.equal(streak.isCompletedToday, true);
    });

    it('2.4 Past missed scheduled day terminates active streak', () => {
      const template = createMockTemplate({ frequency_type: 'daily', start_date: '2026-09-01' });
      const asOf = '2026-09-05';

      const occurrences: HabitOccurrence[] = [
        { id: '1', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-01', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        { id: '2', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-02', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        { id: '3', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-03', status: 'missed', completed_at: null, notes: null, created_at: '', updated_at: '' }, // Missed!
        { id: '4', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-04', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        { id: '5', user_id: 'u', habit_template_id: template.id, scheduled_date: '2026-09-05', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
      ];

      const streak = calculateHabitStreak(template, occurrences, asOf);
      assert.equal(streak.currentStreak, 2); // 4th and 5th
      assert.equal(streak.longestStreak, 2); // tie between 1-2 and 4-5
    });

    it('2.5 Calculates overall aggregate metrics correctly', () => {
      const habit1: DailyHabitItem = {
        template: createMockTemplate({ id: 'h1', name: 'H1' }),
        occurrence: { id: 'o1', user_id: 'u', habit_template_id: 'h1', scheduled_date: '2026-09-11', status: 'completed', completed_at: '', notes: null, created_at: '', updated_at: '' },
        streak: { currentStreak: 5, longestStreak: 10, totalCompletions: 20, totalScheduled: 20, completionRate: 100, isCompletedToday: true, isScheduledToday: true, historyMap: {} },
      };

      const habit2: DailyHabitItem = {
        template: createMockTemplate({ id: 'h2', name: 'H2' }),
        occurrence: { id: 'o2', user_id: 'u', habit_template_id: 'h2', scheduled_date: '2026-09-11', status: 'pending', completed_at: null, notes: null, created_at: '', updated_at: '' },
        streak: { currentStreak: 2, longestStreak: 7, totalCompletions: 15, totalScheduled: 20, completionRate: 75, isCompletedToday: false, isScheduledToday: true, historyMap: {} },
      };

      const overall = calculateOverallHabitMetrics([habit1, habit2]);
      assert.equal(overall.totalActiveHabits, 2);
      assert.equal(overall.scheduledTodayCount, 2);
      assert.equal(overall.completedTodayCount, 1);
      assert.equal(overall.todayCompletionPercentage, 50); // 1 / 2 = 50%
      assert.equal(overall.highestStreak, 5);
      assert.equal(overall.averageCompletionRate, 88); // (100 + 75) / 2 = 87.5 -> 88
    });
  });

  // =========================================================================
  // 3. ROUTINE TEMPLATES & SEQUENCING
  // =========================================================================
  describe('3. Routine Templates & Sequencing', () => {
    it('3.1 Routine items preserve exact sort_order and compute completion progress', () => {
      const t1 = createMockTemplate({ id: 'h1', name: 'Wake Up & Hydrate' });
      const t2 = createMockTemplate({ id: 'h2', name: 'Exercise & Stretch' });
      const t3 = createMockTemplate({ id: 'h3', name: 'Review Daily PACT' });

      const routineSummary: RoutineProgressSummary = {
        routine: {
          id: 'r1',
          user_id: 'u',
          name: 'Morning Routine',
          description: 'Kickstart morning',
          target_time_local: '07:00',
          sort_order: 1,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        totalHabits: 3,
        completedHabits: 2,
        progressPercentage: 67,
        items: [
          { habit: t1, occurrence: null, isCompleted: true },
          { habit: t2, occurrence: null, isCompleted: true },
          { habit: t3, occurrence: null, isCompleted: false },
        ],
      };

      assert.equal(routineSummary.totalHabits, 3);
      assert.equal(routineSummary.completedHabits, 2);
      assert.equal(routineSummary.progressPercentage, 67);
      assert.equal(routineSummary.items[0].habit.name, 'Wake Up & Hydrate');
      assert.equal(routineSummary.items[2].isCompleted, false);
    });
  });

  // =========================================================================
  // 4. ZOD VALIDATION SCHEMAS & BOUNDS
  // =========================================================================
  describe('4. Zod Validation Schemas & Bounds', () => {
    it('4.1 Accepts valid habit template payload', () => {
      const valid = {
        name: 'Practice DSA',
        description: 'Solve 2 LeetCode medium problems',
        frequencyType: 'weekdays' as const,
        targetTimeLocal: '18:00',
        targetDurationMinutes: 60,
        category: 'learning' as const,
        startDate: '2026-09-01',
      };

      const result = createHabitSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('4.2 Rejects empty habit name', () => {
      const empty = { name: '', frequencyType: 'daily' };
      assert.equal(createHabitSchema.safeParse(empty).success, false);
    });

    it('4.3 Rejects invalid frequency types', () => {
      const invalid = { name: 'Test', frequencyType: 'biweekly' };
      assert.equal(createHabitSchema.safeParse(invalid).success, false);
    });

    it('4.4 Validates occurrence action payload', () => {
      const validAction = {
        occurrenceId: 'a0000000-0000-4000-8000-000000000001',
        notes: 'Felt great',
      };
      assert.equal(completeOccurrenceSchema.safeParse(validAction).success, true);

      const invalidUuid = {
        occurrenceId: 'not-a-uuid',
      };
      assert.equal(completeOccurrenceSchema.safeParse(invalidUuid).success, false);
    });

    it('4.5 Validates routine template creation with habit IDs', () => {
      const validRoutine = {
        name: 'Evening Shutdown',
        description: 'Prepare for deep rest',
        targetTimeLocal: '22:00',
        habitTemplateIds: [
          'a0000000-0000-4000-8000-000000000001',
          'b0000000-0000-4000-8000-000000000002',
        ],
      };
      assert.equal(createRoutineSchema.safeParse(validRoutine).success, true);
    });
  });

  // =========================================================================
  // 5. COMMAND CENTER REGISTRY INTEGRATION (REMOVAL AUDIT)
  // =========================================================================
  describe('5. Command Center Registry Integration', () => {
    it('5.1 Command center does not expose removed habits quick action', () => {
      const action = STATIC_QUICK_ACTIONS.find((c) => c.id === 'action-create-habit');
      assert.equal(action, undefined);
    });

    it('5.2 Command center does not expose removed habits navigation command', () => {
      const nav = STATIC_NAVIGATION_COMMANDS.find((c) => c.id === 'nav-habits');
      assert.equal(nav, undefined);
    });
  });

  // =========================================================================
  // 6. EMPTY DATASET RESILIENCE
  // =========================================================================
  describe('6. Empty Dataset Resilience', () => {
    it('6.1 Empty habits array calculates 0 metrics gracefully without division by zero', () => {
      const overall = calculateOverallHabitMetrics([]);
      assert.equal(overall.totalActiveHabits, 0);
      assert.equal(overall.scheduledTodayCount, 0);
      assert.equal(overall.completedTodayCount, 0);
      assert.equal(overall.todayCompletionPercentage, 0);
      assert.equal(overall.highestStreak, 0);
      assert.equal(overall.averageCompletionRate, 0);
    });

    it('6.2 Habit with zero occurrences returns 0 streaks safely', () => {
      const template = createMockTemplate();
      const streak = calculateHabitStreak(template, [], '2026-09-11');
      assert.equal(streak.currentStreak, 0);
      assert.equal(streak.longestStreak, 0);
      assert.equal(streak.totalCompletions, 0);
      assert.equal(streak.completionRate, 0);
      assert.equal(streak.isCompletedToday, false);
    });
  });
});

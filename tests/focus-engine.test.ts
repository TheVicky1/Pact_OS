/**
 * PACT Phase 6B: Focus Timer & Deep Work Session Engine Test Suite
 * Validates deterministic timestamp arithmetic, countdown & stopwatch calculations,
 * pause accumulation, natural expiration reconciliation, focus analytics aggregation,
 * validation boundaries, lifecycle state machine rules, Command Center registry integration,
 * sound isolation, and client spoofing defense.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTimerState,
  isSessionExpired,
  computeReconciledStatus,
  formatDuration,
  computeFocusMetrics,
  TimerSessionSnapshot,
} from '../src/lib/focus/timer';
import {
  startFocusSessionSchema,
  completeFocusSessionSchema,
  abandonFocusSessionSchema,
  sessionActionSchema,
  FocusSessionRecord,
} from '../src/lib/validations/focus';
import { ALL_STATIC_COMMANDS, STATIC_QUICK_ACTIONS, STATIC_NAVIGATION_COMMANDS } from '../src/lib/command-center/registry';
import { playFocusSound } from '../src/lib/focus/sound';

describe('PACT Phase 6B: Focus Timer Engine & Deterministic State Suite', () => {
  // =========================================================================
  // 1. DETERMINISTIC COUNTDOWN ARITHMETIC (NO INTERVAL DRIFT)
  // =========================================================================
  it('1.1 Countdown calculates exact remaining seconds at session start', () => {
    const startedAt = '2026-09-11T10:00:00.000Z';
    const now = new Date('2026-09-11T10:00:00.000Z');
    const duration = 1500; // 25 min

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'active',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    const state = computeTimerState(snapshot, now);
    assert.equal(state.remainingSeconds, 1500);
    assert.equal(state.elapsedSeconds, 0);
    assert.equal(state.progressPercentage, 0);
    assert.equal(state.isExpired, false);
    assert.equal(state.displayTime, '25:00');
  });

  it('1.2 Countdown calculates exact remaining time halfway through without drift', () => {
    const startedAt = '2026-09-11T10:00:00.000Z';
    const now = new Date('2026-09-11T10:12:30.000Z'); // +750s
    const duration = 1500; // 25 min

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'active',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    const state = computeTimerState(snapshot, now);
    assert.equal(state.remainingSeconds, 750);
    assert.equal(state.elapsedSeconds, 750);
    assert.equal(state.progressPercentage, 50);
    assert.equal(state.isExpired, false);
    assert.equal(state.displayTime, '12:30');
  });

  it('1.3 Countdown clamps remaining time to 0 and flags expiration when elapsed >= duration', () => {
    const startedAt = '2026-09-11T10:00:00.000Z';
    const now = new Date('2026-09-11T10:30:00.000Z'); // +1800s (past 1500s)
    const duration = 1500;

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'active',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    const state = computeTimerState(snapshot, now);
    assert.equal(state.remainingSeconds, 0);
    assert.equal(state.elapsedSeconds, 1500); // capped at duration for countdown
    assert.equal(state.progressPercentage, 100);
    assert.equal(state.isExpired, true);
    assert.equal(state.displayTime, '00:00');
  });

  // =========================================================================
  // 2. STOPWATCH / OPEN-ENDED FOCUS ARITHMETIC
  // =========================================================================
  it('2.1 Stopwatch calculates unlimited elapsed time and never expires', () => {
    const startedAt = '2026-09-11T10:00:00.000Z';
    const now = new Date('2026-09-11T11:15:42.000Z'); // 4542s (1h 15m 42s)

    const snapshot: TimerSessionSnapshot = {
      mode: 'stopwatch',
      status: 'active',
      planned_duration_seconds: null,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    const state = computeTimerState(snapshot, now);
    assert.equal(state.remainingSeconds, 0);
    assert.equal(state.elapsedSeconds, 4542);
    assert.equal(state.progressPercentage, 0);
    assert.equal(state.isExpired, false);
    assert.equal(state.displayTime, '1:15:42');
  });

  // =========================================================================
  // 3. PAUSE & RESUME DETERMINISM
  // =========================================================================
  it('3.1 Paused session freezes remaining time at paused_at timestamp', () => {
    const startedAt = '2026-09-11T10:00:00.000Z';
    const pausedAt = '2026-09-11T10:10:00.000Z'; // paused at 10m (600s elapsed)
    const now = new Date('2026-09-11T11:00:00.000Z'); // 50m later!
    const duration = 1500;

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'paused',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: pausedAt,
      accumulated_paused_seconds: 0,
    };

    const state = computeTimerState(snapshot, now);
    assert.equal(state.elapsedSeconds, 600);
    assert.equal(state.remainingSeconds, 900);
    assert.equal(state.isExpired, false);
    assert.equal(state.displayTime, '15:00');
  });

  it('3.2 Resumed session with accumulated paused seconds preserves correct remaining time', () => {
    const startedAt = '2026-09-11T10:00:00.000Z';
    const accumulatedPaused = 300; // 5m paused previously
    const now = new Date('2026-09-11T10:15:00.000Z'); // 15m real time since start
    const duration = 1500; // 25m

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'active',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: accumulatedPaused,
    };

    // Net active work = 900 - 300 = 600s (10m)
    // Remaining = 1500 - 600 = 900s (15m)
    const state = computeTimerState(snapshot, now);
    assert.equal(state.elapsedSeconds, 600);
    assert.equal(state.remainingSeconds, 900);
    assert.equal(state.isExpired, false);
    assert.equal(state.displayTime, '15:00');
  });

  // =========================================================================
  // 4. NATURAL EXPIRATION RECONCILIATION & BROWSER REFRESH RECOVERY
  // =========================================================================
  it('4.1 isSessionExpired detects expired countdown even after browser was closed', () => {
    const startedAt = '2026-09-11T08:00:00.000Z';
    const now = new Date('2026-09-11T09:00:00.000Z'); // 1 hour later
    const duration = 1800; // 30 min

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'active',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    assert.equal(isSessionExpired(snapshot, now), true);
    assert.equal(computeReconciledStatus(snapshot, now), 'completed');
  });

  it('4.2 isSessionExpired returns false for active countdown that has time remaining', () => {
    const startedAt = '2026-09-11T08:00:00.000Z';
    const now = new Date('2026-09-11T08:10:00.000Z');
    const duration = 1800;

    const snapshot: TimerSessionSnapshot = {
      mode: 'countdown',
      status: 'active',
      planned_duration_seconds: duration,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    assert.equal(isSessionExpired(snapshot, now), false);
    assert.equal(computeReconciledStatus(snapshot, now), 'active');
  });

  it('4.3 isSessionExpired returns false for stopwatch mode', () => {
    const startedAt = '2026-09-11T08:00:00.000Z';
    const now = new Date('2026-09-11T12:00:00.000Z');

    const snapshot: TimerSessionSnapshot = {
      mode: 'stopwatch',
      status: 'active',
      planned_duration_seconds: null,
      started_at: startedAt,
      paused_at: null,
      accumulated_paused_seconds: 0,
    };

    assert.equal(isSessionExpired(snapshot, now), false);
  });

  // =========================================================================
  // 5. DURATION FORMATTING UTILITY
  // =========================================================================
  it('5.1 formatDuration produces accurate MM:SS and H:MM:SS strings', () => {
    assert.equal(formatDuration(0), '00:00');
    assert.equal(formatDuration(5), '00:05');
    assert.equal(formatDuration(65), '01:05');
    assert.equal(formatDuration(1500), '25:00');
    assert.equal(formatDuration(3599), '59:59');
    assert.equal(formatDuration(3600), '1:00:00');
    assert.equal(formatDuration(3665), '1:01:05');
    assert.equal(formatDuration(7325), '2:02:05');
  });

  // =========================================================================
  // 6. FOCUS METRICS & ANALYTICS AGGREGATION
  // =========================================================================
  it('6.1 computeFocusMetrics aggregates total seconds, completed sessions, and daily breakdown', () => {
    const mockSessions: FocusSessionRecord[] = [
      {
        id: 's-1',
        user_id: 'u-1',
        task_id: 't-100',
        mode: 'countdown',
        status: 'completed',
        planned_duration_seconds: 1500,
        actual_duration_seconds: 1500,
        started_at: '2026-09-10T09:00:00.000Z',
        ended_at: '2026-09-10T09:25:00.000Z',
        paused_at: null,
        accumulated_paused_seconds: 0,
        completion_reason: 'natural_expiration',
        created_at: '2026-09-10T09:00:00.000Z',
        updated_at: '2026-09-10T09:25:00.000Z',
      },
      {
        id: 's-2',
        user_id: 'u-1',
        task_id: 't-100',
        mode: 'countdown',
        status: 'completed',
        planned_duration_seconds: 1500,
        actual_duration_seconds: 1500,
        started_at: '2026-09-10T11:00:00.000Z',
        ended_at: '2026-09-10T11:25:00.000Z',
        paused_at: null,
        accumulated_paused_seconds: 0,
        completion_reason: 'natural_expiration',
        created_at: '2026-09-10T11:00:00.000Z',
        updated_at: '2026-09-10T11:25:00.000Z',
      },
      {
        id: 's-3',
        user_id: 'u-1',
        task_id: 't-200',
        mode: 'stopwatch',
        status: 'completed',
        planned_duration_seconds: null,
        actual_duration_seconds: 3000,
        started_at: '2026-09-11T14:00:00.000Z',
        ended_at: '2026-09-11T14:50:00.000Z',
        paused_at: null,
        accumulated_paused_seconds: 0,
        completion_reason: 'manual_stopwatch',
        created_at: '2026-09-11T14:00:00.000Z',
        updated_at: '2026-09-11T14:50:00.000Z',
      },
      {
        id: 's-4',
        user_id: 'u-1',
        task_id: null,
        mode: 'countdown',
        status: 'abandoned',
        planned_duration_seconds: 1500,
        actual_duration_seconds: 300,
        started_at: '2026-09-11T16:00:00.000Z',
        ended_at: '2026-09-11T16:05:00.000Z',
        paused_at: null,
        accumulated_paused_seconds: 0,
        completion_reason: 'user_abandoned',
        created_at: '2026-09-11T16:00:00.000Z',
        updated_at: '2026-09-11T16:05:00.000Z',
      },
    ];

    const metrics = computeFocusMetrics(mockSessions);
    // Completed focus time: 1500 + 1500 + 3000 = 6000s (100 min)
    assert.equal(metrics.totalFocusSeconds, 6000);
    assert.equal(metrics.completedSessions, 3);
    assert.equal(metrics.abandonedSessions, 1);
    assert.equal(metrics.avgSessionDurationSeconds, 2000); // 6000 / 3

    // Daily breakdown
    assert.equal(metrics.dailyFocusMap['2026-09-10'], 3000);
    assert.equal(metrics.dailyFocusMap['2026-09-11'], 3000);

    // Task breakdown
    assert.equal(metrics.taskFocusMap['t-100'], 3000);
    assert.equal(metrics.taskFocusMap['t-200'], 3000);
  });

  it('6.2 computeFocusMetrics handles empty sessions list safely', () => {
    const metrics = computeFocusMetrics([]);
    assert.equal(metrics.totalFocusSeconds, 0);
    assert.equal(metrics.completedSessions, 0);
    assert.equal(metrics.abandonedSessions, 0);
    assert.equal(metrics.avgSessionDurationSeconds, 0);
    assert.deepEqual(metrics.dailyFocusMap, {});
    assert.deepEqual(metrics.taskFocusMap, {});
  });

  // =========================================================================
  // 7. SCHEMA VALIDATION BOUNDARIES & CLIENT SPOOFING DEFENSE
  // =========================================================================
  it('7.1 startFocusSessionSchema validates valid countdown payload', () => {
    const validPayload = {
      mode: 'countdown',
      planned_duration_seconds: 1500,
      task_id: '11111111-1111-4111-a111-111111111111',
    };
    const parsed = startFocusSessionSchema.safeParse(validPayload);
    assert.equal(parsed.success, true);
  });

  it('7.2 startFocusSessionSchema validates valid stopwatch payload without duration', () => {
    const validStopwatch = {
      mode: 'stopwatch',
    };
    const parsed = startFocusSessionSchema.safeParse(validStopwatch);
    assert.equal(parsed.success, true);
  });

  it('7.3 startFocusSessionSchema rejects countdown with missing or invalid duration', () => {
    const missingDuration = {
      mode: 'countdown',
    };
    const parsed1 = startFocusSessionSchema.safeParse(missingDuration);
    assert.equal(parsed1.success, false);

    const negativeDuration = {
      mode: 'countdown',
      planned_duration_seconds: -300,
    };
    const parsed2 = startFocusSessionSchema.safeParse(negativeDuration);
    assert.equal(parsed2.success, false);

    const excessiveDuration = {
      mode: 'countdown',
      planned_duration_seconds: 50000, // > 12 hours
    };
    const parsed3 = startFocusSessionSchema.safeParse(excessiveDuration);
    assert.equal(parsed3.success, false);
  });

  it('7.4 startFocusSessionSchema rejects invalid UUID for task_id', () => {
    const invalidTask = {
      mode: 'countdown',
      planned_duration_seconds: 1500,
      task_id: 'not-a-valid-uuid',
    };
    const parsed = startFocusSessionSchema.safeParse(invalidTask);
    assert.equal(parsed.success, false);
  });

  it('7.5 completeFocusSessionSchema and abandonFocusSessionSchema require valid session UUID', () => {
    const validSession = {
      session_id: '22222222-2222-4222-a222-222222222222',
      completion_reason: 'manual_completed',
    };
    const parsedComplete = completeFocusSessionSchema.safeParse(validSession);
    assert.equal(parsedComplete.success, true);

    const invalidSession = {
      session_id: 'invalid-id',
    };
    const parsedAbandon = abandonFocusSessionSchema.safeParse(invalidSession);
    assert.equal(parsedAbandon.success, false);

    const parsedAction = sessionActionSchema.safeParse(invalidSession);
    assert.equal(parsedAction.success, false);
  });

  // =========================================================================
  // 8. COMMAND CENTER INTEGRATION CONTRACT
  // =========================================================================
  it('8.1 Command registry includes Focus Timer quick actions and navigation', () => {
    const startFocusAction = STATIC_QUICK_ACTIONS.find((a) => a.id === 'action-start-focus');
    assert.ok(startFocusAction, 'Missing action-start-focus in quick actions');
    assert.equal(startFocusAction.href, '/app/focus');
    assert.equal(startFocusAction.iconName, 'Timer');

    const focusNav = STATIC_NAVIGATION_COMMANDS.find((n) => n.id === 'nav-focus');
    assert.ok(focusNav, 'Missing nav-focus in navigation commands');
    assert.equal(focusNav.href, '/app/focus');
    assert.equal(focusNav.iconName, 'Timer');

    const allIds = new Set(ALL_STATIC_COMMANDS.map((c) => c.id));
    assert.equal(allIds.has('action-start-focus'), true);
    assert.equal(allIds.has('nav-focus'), true);
  });

  // =========================================================================
  // 9. SOUND SYSTEM NON-AUTHORITATIVE CONTRACT
  // =========================================================================
  it('9.1 playFocusSound executes safely in non-browser or muted environments without throwing', () => {
    // In Node.js environment where window.AudioContext does not exist, playFocusSound must resolve cleanly
    assert.doesNotThrow(() => {
      playFocusSound('complete', false); // muted
      playFocusSound('complete', true); // non-browser fallback
      playFocusSound('start', true);
      playFocusSound('pause', true);
    });
  });
});

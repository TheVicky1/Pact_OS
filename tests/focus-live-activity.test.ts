import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FocusSession } from '../src/lib/focus/timer';
import { buildFocusLiveActivityPayload } from '../src/lib/focus/live-activity';

describe('Phase 8: Mobile Live Focus Activity Contracts', () => {
  const baseSession: FocusSession = {
    id: 'f1000000-0000-4000-a000-000000000001',
    user_id: 'u1000000-0000-4000-a000-000000000001',
    task_id: 't1000000-0000-4000-a000-000000000001',
    mode: 'countdown',
    planned_duration_seconds: 1500, // 25 mins
    started_at: '2026-09-13T10:00:00.000Z',
    ended_at: null,
    paused_at: null,
    accumulated_paused_seconds: 0,
    status: 'active',
    completion_reason: null,
    created_at: '2026-09-13T10:00:00.000Z',
    updated_at: '2026-09-13T10:00:00.000Z',
    tasks: {
      id: 't1000000-0000-4000-a000-000000000001',
      title: 'Implement Core Engine',
      status: 'pending',
      priority: 'high',
    },
  };

  it('builds valid Live Activity payload for active countdown session', () => {
    // 5 minutes in (300 seconds elapsed, 1200 seconds remaining)
    const currentEpoch = Date.parse('2026-09-13T10:05:00.000Z');
    const payload = buildFocusLiveActivityPayload(baseSession, currentEpoch);

    assert.equal(payload.version, '1.0');
    assert.equal(payload.activityType, 'deep_work_focus');
    assert.equal(payload.state.sessionId, baseSession.id);
    assert.equal(payload.state.taskTitle, 'Implement Core Engine');
    assert.equal(payload.state.mode, 'countdown');
    assert.equal(payload.state.status, 'active');
    assert.equal(payload.state.elapsedSeconds, 300);
    assert.equal(payload.state.remainingSeconds, 1200);
    assert.equal(payload.state.displayTime, '20:00');
    assert.equal(payload.state.progressPercent, 20); // 300/1500 = 20%
    assert.equal(payload.state.canPause, true);
    assert.equal(payload.state.canComplete, true);

    // Dynamic Island
    assert.equal(payload.dynamicIsland.compactLeading, 'PACT');
    assert.equal(payload.dynamicIsland.compactTrailing, '20:00');
    assert.equal(payload.dynamicIsland.expandedTitle, 'Implement Core Engine');

    // Lock Screen
    assert.equal(payload.lockScreen.title, 'Implement Core Engine');
    assert.equal(payload.lockScreen.progressBarPercent, 20);
  });

  it('handles stopwatch mode Live Activity payload formatting', () => {
    const stopwatchSession: FocusSession = {
      ...baseSession,
      mode: 'stopwatch',
      planned_duration_seconds: null,
      tasks: null,
    };

    // 10 minutes in (600 seconds elapsed)
    const currentEpoch = Date.parse('2026-09-13T10:10:00.000Z');
    const payload = buildFocusLiveActivityPayload(stopwatchSession, currentEpoch);

    assert.equal(payload.state.mode, 'stopwatch');
    assert.equal(payload.state.taskTitle, 'Deep Work Session');
    assert.equal(payload.state.elapsedSeconds, 600);
    assert.equal(payload.state.displayTime, '10:00');
    assert.equal(payload.lockScreen.progressBarPercent, 100);
    assert.ok(payload.dynamicIsland.expandedSubtitle.includes('10:00 elapsed'));
  });

  it('handles paused focus sessions correctly in Live Activity state', () => {
    const pausedSession: FocusSession = {
      ...baseSession,
      status: 'paused',
      paused_at: '2026-09-13T10:05:00.000Z',
    };

    // Current epoch is 10:15:00, but session paused at 10:05:00
    const currentEpoch = Date.parse('2026-09-13T10:15:00.000Z');
    const payload = buildFocusLiveActivityPayload(pausedSession, currentEpoch);

    assert.equal(payload.state.status, 'paused');
    assert.equal(payload.state.elapsedSeconds, 300);
    assert.equal(payload.state.remainingSeconds, 1200);
    assert.equal(payload.state.canPause, false);
    assert.equal(payload.state.canComplete, true);
  });
});

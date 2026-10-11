import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getNextPomodoroStage } from '../src/lib/focus/cycle-tracker';

describe('cycle-tracker utility', () => {
  it('returns short-break when completed sessions is 0 or less than cycle length', () => {
    const s0 = getNextPomodoroStage(0, 4);
    assert.strictEqual(s0.nextSessionType, 'short-break');
    assert.strictEqual(s0.isLongBreakNext, false);
    assert.strictEqual(s0.sessionsUntilLongBreak, 4);

    const s1 = getNextPomodoroStage(1, 4);
    assert.strictEqual(s1.nextSessionType, 'short-break');
    assert.strictEqual(s1.sessionsUntilLongBreak, 3);

    const s3 = getNextPomodoroStage(3, 4);
    assert.strictEqual(s3.nextSessionType, 'short-break');
    assert.strictEqual(s3.sessionsUntilLongBreak, 1);
  });

  it('returns long-break upon completing cycle length multiple', () => {
    const s4 = getNextPomodoroStage(4, 4);
    assert.strictEqual(s4.nextSessionType, 'long-break');
    assert.strictEqual(s4.isLongBreakNext, true);
    assert.strictEqual(s4.sessionsUntilLongBreak, 0);

    const s8 = getNextPomodoroStage(8, 4);
    assert.strictEqual(s8.nextSessionType, 'long-break');
    assert.strictEqual(s8.isLongBreakNext, true);
    assert.strictEqual(s8.sessionsUntilLongBreak, 0);
  });

  it('supports custom cycle lengths', () => {
    const custom = getNextPomodoroStage(3, 3);
    assert.strictEqual(custom.nextSessionType, 'long-break');
    assert.strictEqual(custom.isLongBreakNext, true);

    const customNext = getNextPomodoroStage(4, 3);
    assert.strictEqual(customNext.nextSessionType, 'short-break');
    assert.strictEqual(customNext.sessionsUntilLongBreak, 2);
  });

  it('sanitizes negative inputs cleanly', () => {
    const neg = getNextPomodoroStage(-2, -5);
    assert.strictEqual(neg.completedWorkSessions, 0);
    assert.strictEqual(neg.cycleLength, 1);
  });
});

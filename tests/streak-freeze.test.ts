import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStreakFreezeEligibility } from '../src/lib/habits/streak-freeze';

describe('streak-freeze utility', () => {
  const baseNow = new Date('2026-10-11T12:00:00Z');

  it('approves eligible freeze within 48-hour grace period and decrements allowance', () => {
    const res = evaluateStreakFreezeEligibility({
      availableFreezes: 2,
      missedDateIso: '2026-10-10T12:00:00Z',
      existingFrozenDates: [],
      currentDate: baseNow,
    });
    assert.strictEqual(res.canApplyFreeze, true);
    assert.strictEqual(res.remainingFreezesAfterApply, 1);
  });

  it('rejects when available freezes is 0', () => {
    const res = evaluateStreakFreezeEligibility({
      availableFreezes: 0,
      missedDateIso: '2026-10-10T12:00:00Z',
      existingFrozenDates: [],
      currentDate: baseNow,
    });
    assert.strictEqual(res.canApplyFreeze, false);
    assert.strictEqual(res.reason, 'OUT_OF_FREEZES');
    assert.strictEqual(res.remainingFreezesAfterApply, 0);
  });

  it('rejects future dates', () => {
    const res = evaluateStreakFreezeEligibility({
      availableFreezes: 2,
      missedDateIso: '2026-10-12T12:00:00Z',
      existingFrozenDates: [],
      currentDate: baseNow,
    });
    assert.strictEqual(res.canApplyFreeze, false);
    assert.strictEqual(res.reason, 'FUTURE_DATE');
  });

  it('rejects dates already frozen', () => {
    const res = evaluateStreakFreezeEligibility({
      availableFreezes: 2,
      missedDateIso: '2026-10-10T12:00:00Z',
      existingFrozenDates: ['2026-10-10'],
      currentDate: baseNow,
    });
    assert.strictEqual(res.canApplyFreeze, false);
    assert.strictEqual(res.reason, 'ALREADY_FROZEN');
  });

  it('rejects dates past the grace period window', () => {
    // 3 days ago (72 hours elapsed > 48h limit)
    const res = evaluateStreakFreezeEligibility({
      availableFreezes: 2,
      missedDateIso: '2026-10-08T11:00:00Z',
      existingFrozenDates: [],
      gracePeriodHours: 48,
      currentDate: baseNow,
    });
    assert.strictEqual(res.canApplyFreeze, false);
    assert.strictEqual(res.reason, 'EXPIRED_GRACE_PERIOD');
  });
});

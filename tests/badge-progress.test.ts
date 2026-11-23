import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateBadgeProgress } from '../src/lib/gamification/badge-progress';

describe('calculateBadgeProgress', () => {
  it('starts at none with a zero count', () => {
    assert.deepStrictEqual(calculateBadgeProgress(0), {
      currentCount: 0,
      currentTier: 'none',
      nextTier: 'bronze',
      nextTierThreshold: 5,
      remainingCount: 5,
      progressPercentage: 0,
    });
  });

  it('unlocks bronze exactly at the bronze threshold', () => {
    assert.deepStrictEqual(calculateBadgeProgress(5), {
      currentCount: 5,
      currentTier: 'bronze',
      nextTier: 'silver',
      nextTierThreshold: 25,
      remainingCount: 20,
      progressPercentage: 0,
    });
  });

  it('calculates mid progress within bronze', () => {
    const result = calculateBadgeProgress(15);

    assert.strictEqual(result.currentTier, 'bronze');
    assert.strictEqual(result.nextTier, 'silver');
    assert.strictEqual(result.remainingCount, 10);
    assert.strictEqual(result.progressPercentage, 50);
  });

  it('is almost at silver right before the silver threshold', () => {
    const result = calculateBadgeProgress(24);

    assert.strictEqual(result.currentTier, 'bronze');
    assert.strictEqual(result.nextTier, 'silver');
    assert.strictEqual(result.remainingCount, 1);
    assert.strictEqual(result.progressPercentage, 95);
  });

  it('rounds progress to one decimal place', () => {
    const result = calculateBadgeProgress(6, { silver: 11 });

    assert.strictEqual(result.currentTier, 'bronze');
    assert.strictEqual(result.progressPercentage, 16.7);
  });

  it('unlocks silver exactly at the silver threshold', () => {
    assert.deepStrictEqual(calculateBadgeProgress(25), {
      currentCount: 25,
      currentTier: 'silver',
      nextTier: 'gold',
      nextTierThreshold: 50,
      remainingCount: 25,
      progressPercentage: 0,
    });
  });

  it('handles counts just below the gold and diamond milestones', () => {
    const beforeGold = calculateBadgeProgress(49);
    assert.strictEqual(beforeGold.currentTier, 'silver');
    assert.strictEqual(beforeGold.remainingCount, 1);

    const beforeDiamond = calculateBadgeProgress(99);
    assert.strictEqual(beforeDiamond.currentTier, 'gold');
    assert.strictEqual(beforeDiamond.remainingCount, 1);
  });

  it('unlocks gold exactly at the gold threshold', () => {
    assert.deepStrictEqual(calculateBadgeProgress(50), {
      currentCount: 50,
      currentTier: 'gold',
      nextTier: 'diamond',
      nextTierThreshold: 100,
      remainingCount: 50,
      progressPercentage: 0,
    });
  });

  it('calculates mid progress within gold', () => {
    const result = calculateBadgeProgress(75);

    assert.strictEqual(result.currentTier, 'gold');
    assert.strictEqual(result.nextTier, 'diamond');
    assert.strictEqual(result.remainingCount, 25);
    assert.strictEqual(result.progressPercentage, 50);
  });

  it('maxes out at diamond on the diamond threshold', () => {
    assert.deepStrictEqual(calculateBadgeProgress(100), {
      currentCount: 100,
      currentTier: 'diamond',
      nextTier: null,
      nextTierThreshold: null,
      remainingCount: 0,
      progressPercentage: 100,
    });
  });

  it('stays maxed out above the maximum threshold', () => {
    const result = calculateBadgeProgress(150);

    assert.strictEqual(result.currentTier, 'diamond');
    assert.strictEqual(result.nextTier, null);
    assert.strictEqual(result.nextTierThreshold, null);
    assert.strictEqual(result.remainingCount, 0);
    assert.strictEqual(result.progressPercentage, 100);
  });

  it('honors custom thresholds', () => {
    const result = calculateBadgeProgress(10, { bronze: 10, silver: 30 });

    assert.strictEqual(result.currentTier, 'bronze');
    assert.strictEqual(result.nextTier, 'silver');
    assert.strictEqual(result.nextTierThreshold, 30);
    assert.strictEqual(result.remainingCount, 20);
  });

  it('rejects a non-finite custom threshold with TypeError', () => {
    assert.throws(() => calculateBadgeProgress(0, { bronze: Number.NaN }), TypeError);
    assert.throws(() => calculateBadgeProgress(0, { silver: Infinity }), TypeError);
  });

  it('rejects a negative custom threshold with RangeError', () => {
    assert.throws(() => calculateBadgeProgress(0, { bronze: -1 }), RangeError);
  });

  it('rejects a negative count with RangeError', () => {
    assert.throws(() => calculateBadgeProgress(-1), RangeError);
  });

  it('rejects a non-finite count with TypeError', () => {
    assert.throws(() => calculateBadgeProgress(Number.NaN), TypeError);
    assert.throws(() => calculateBadgeProgress(Infinity), TypeError);
  });
});


import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateLevelProgression } from '../src/lib/gamification/xp-progression';

describe('calculateLevelProgression', () => {
  it('starts at level 1 with zero XP', () => {
    assert.deepStrictEqual(calculateLevelProgression(0), {
      level: 1,
      totalXp: 0,
      currentLevelXp: 0,
      requiredLevelXp: 100,
      progressPercentage: 0,
      xpUntilNextLevel: 100,
    });
  });

  it('calculates progress within the current level', () => {
    const result = calculateLevelProgression(50);

    assert.strictEqual(result.level, 1);
    assert.strictEqual(result.totalXp, 50);
    assert.strictEqual(result.currentLevelXp, 50);
    assert.strictEqual(result.requiredLevelXp, 100);
    assert.strictEqual(result.progressPercentage, 50);
    assert.strictEqual(result.xpUntilNextLevel, 50);
  });

  it('advances to the next level at the XP threshold', () => {
    const result = calculateLevelProgression(100);

    assert.strictEqual(result.level, 2);
    assert.strictEqual(result.currentLevelXp, 0);
    assert.strictEqual(result.requiredLevelXp, 282);
    assert.strictEqual(result.progressPercentage, 0);
    assert.strictEqual(result.xpUntilNextLevel, 282);
  });

  it('carries excess XP into the next level', () => {
    const result = calculateLevelProgression(150);

    assert.strictEqual(result.level, 2);
    assert.strictEqual(result.currentLevelXp, 50);
    assert.strictEqual(result.requiredLevelXp, 282);
    assert.strictEqual(result.xpUntilNextLevel, 232);
    assert.ok(result.progressPercentage > 0);
    assert.ok(result.progressPercentage < 100);
  });

  it('calculates progression across multiple levels', () => {
    const result = calculateLevelProgression(901);

    assert.strictEqual(result.level, 4);
    assert.strictEqual(result.totalXp, 901);
    assert.strictEqual(result.currentLevelXp, 0);
    assert.strictEqual(result.requiredLevelXp, 800);
    assert.strictEqual(result.progressPercentage, 0);
    assert.strictEqual(result.xpUntilNextLevel, 800);
  });

  it('supports custom base XP and exponent values', () => {
    const result = calculateLevelProgression(50, {
      baseXp: 50,
      exponent: 2,
    });

    assert.strictEqual(result.level, 2);
    assert.strictEqual(result.currentLevelXp, 0);
    assert.strictEqual(result.requiredLevelXp, 200);
  });

  it('rejects negative total XP', () => {
    assert.throws(() => calculateLevelProgression(-1), RangeError);
  });

  it('rejects non-finite total XP', () => {
    assert.throws(() => calculateLevelProgression(Number.NaN), RangeError);
    assert.throws(() => calculateLevelProgression(Infinity), RangeError);
  });

  it('rejects a non-positive base XP value', () => {
    assert.throws(
      () => calculateLevelProgression(0, { baseXp: 0 }),
      RangeError,
    );

    assert.throws(
      () => calculateLevelProgression(0, { baseXp: -10 }),
      RangeError,
    );
  });

  it('rejects a non-finite base XP value', () => {
    assert.throws(
      () => calculateLevelProgression(0, { baseXp: Infinity }),
      RangeError,
    );
  });

  it('rejects an exponent less than or equal to 1', () => {
    assert.throws(
      () => calculateLevelProgression(0, { exponent: 1 }),
      RangeError,
    );

    assert.throws(
      () => calculateLevelProgression(0, { exponent: 0.5 }),
      RangeError,
    );
  });

  it('rejects a non-finite exponent', () => {
    assert.throws(
      () => calculateLevelProgression(0, { exponent: Infinity }),
      RangeError,
    );
  });

  it('keeps progress percentage within the valid range', () => {
    const result = calculateLevelProgression(250);

    assert.ok(result.progressPercentage >= 0);
    assert.ok(result.progressPercentage <= 100);
  });

  it('returns consistent XP remaining and level progress', () => {
    const result = calculateLevelProgression(150);

    assert.strictEqual(
      result.xpUntilNextLevel,
      result.requiredLevelXp - result.currentLevelXp,
    );
  });
});

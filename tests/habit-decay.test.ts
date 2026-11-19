import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHabitStrengthDecay } from '../src/lib/habits/habit-decay';

describe('Habit Strength Decay & Half-Life Calculator (habit-decay.ts)', () => {
  describe('Zero Days Elapsed (100% Retention)', () => {
    it('retains 100% of initial strength when 0 days have elapsed', () => {
      const assessment = calculateHabitStrengthDecay(100, 0);

      assert.strictEqual(assessment.currentStrength, 100.0);
      assert.strictEqual(assessment.retentionFraction, 1.0);
      assert.strictEqual(assessment.status, 'solid');
      assert.strictEqual(
        assessment.recommendation,
        'Habit neural pathway is well-preserved.'
      );
    });

    it('handles moderate initial strength with 0 days elapsed', () => {
      const assessment = calculateHabitStrengthDecay(65, 0);

      assert.strictEqual(assessment.currentStrength, 65.0);
      assert.strictEqual(assessment.retentionFraction, 1.0);
      assert.strictEqual(assessment.status, 'fading');
      assert.strictEqual(
        assessment.recommendation,
        'Strength is fading. A quick check-in will restore momentum.'
      );
    });

    it('handles zero initial strength correctly', () => {
      const assessment = calculateHabitStrengthDecay(0, 0);

      assert.strictEqual(assessment.currentStrength, 0.0);
      assert.strictEqual(assessment.retentionFraction, 0.0);
      assert.strictEqual(assessment.status, 'dormant');
      assert.strictEqual(
        assessment.recommendation,
        'Habit has become dormant. Re-anchor with a tiny trigger.'
      );
    });

    it('preserves 100% retention on small fractional initial strengths with zero days elapsed', () => {
      const assessment06 = calculateHabitStrengthDecay(0.06, 0);
      assert.strictEqual(assessment06.currentStrength, 0.1);
      assert.strictEqual(assessment06.retentionFraction, 1.0);

      const assessment04 = calculateHabitStrengthDecay(0.04, 0);
      assert.strictEqual(assessment04.currentStrength, 0.0);
      assert.strictEqual(assessment04.retentionFraction, 1.0);
    });
  });

  describe('Exact Half-Life Boundary (50% Retention)', () => {
    it('decays to exactly 50% strength after default 7 days', () => {
      const assessment = calculateHabitStrengthDecay(100, 7);

      assert.strictEqual(assessment.currentStrength, 50.0);
      assert.strictEqual(assessment.retentionFraction, 0.5);
      assert.strictEqual(assessment.status, 'fading');
      assert.strictEqual(
        assessment.recommendation,
        'Strength is fading. A quick check-in will restore momentum.'
      );
    });

    it('decays to 50% with custom half-life (14 days)', () => {
      const assessment = calculateHabitStrengthDecay(80, 14, { halfLifeDays: 14 });

      assert.strictEqual(assessment.currentStrength, 40.0);
      assert.strictEqual(assessment.retentionFraction, 0.5);
      assert.strictEqual(assessment.status, 'at_risk');
      assert.strictEqual(
        assessment.recommendation,
        'High risk of habit drop-off. Initiate a two-minute comeback.'
      );
    });

    it('decays across multiple half-lives (e.g. 14 days with 7-day half-life -> 25%)', () => {
      const assessment = calculateHabitStrengthDecay(100, 14);

      assert.strictEqual(assessment.currentStrength, 25.0);
      assert.strictEqual(assessment.retentionFraction, 0.25);
      assert.strictEqual(assessment.status, 'at_risk');
    });

    it('decays across three half-lives (21 days -> 12.5% -> dormant)', () => {
      const assessment = calculateHabitStrengthDecay(100, 21);

      assert.strictEqual(assessment.currentStrength, 12.5);
      assert.strictEqual(assessment.retentionFraction, 0.125);
      assert.strictEqual(assessment.status, 'dormant');
      assert.strictEqual(
        assessment.recommendation,
        'Habit has become dormant. Re-anchor with a tiny trigger.'
      );
    });
  });

  describe('Long Periods & Near-Zero Retention', () => {
    it('approaches zero gracefully after prolonged absence (e.g. 60 days)', () => {
      const assessment = calculateHabitStrengthDecay(90, 60);

      // 90 * 2^(-60/7) ≈ 0.238 -> rounds to 0.2
      assert.strictEqual(assessment.currentStrength, 0.2);
      assert.ok(assessment.retentionFraction < 0.01);
      assert.strictEqual(assessment.status, 'dormant');
      assert.strictEqual(
        assessment.recommendation,
        'Habit has become dormant. Re-anchor with a tiny trigger.'
      );
    });

    it('rounds to 0.0 strength and near-zero retention after 100+ days without a floor', () => {
      const assessment100 = calculateHabitStrengthDecay(50, 100);
      assert.strictEqual(assessment100.currentStrength, 0.0);
      assert.strictEqual(assessment100.retentionFraction, 0.0001);
      assert.strictEqual(assessment100.status, 'dormant');

      const assessment150 = calculateHabitStrengthDecay(50, 150);
      assert.strictEqual(assessment150.currentStrength, 0.0);
      assert.strictEqual(assessment150.retentionFraction, 0.0);
      assert.strictEqual(assessment150.status, 'dormant');
    });
  });

  describe('Minimum Strength Floor Clamping', () => {
    it('clamps to minStrengthFloor when decayed value falls below floor', () => {
      const assessment = calculateHabitStrengthDecay(100, 30, {
        minStrengthFloor: 20,
      });

      // 100 * 2^(-30/7) ≈ 5.14, floor is 20
      assert.strictEqual(assessment.currentStrength, 20.0);
      assert.strictEqual(assessment.retentionFraction, 0.2);
      assert.strictEqual(assessment.status, 'at_risk');
    });

    it('does not artificially boost strength when raw decay is above floor', () => {
      const assessment = calculateHabitStrengthDecay(100, 3, {
        minStrengthFloor: 15,
      });

      // 100 * 2^(-3/7) ≈ 74.30
      assert.strictEqual(assessment.currentStrength, 74.3);
      assert.strictEqual(assessment.retentionFraction, 0.743);
      assert.strictEqual(assessment.status, 'fading');
    });

    it('does not allow minStrengthFloor to artificially raise strength above initialStrength', () => {
      const assessment = calculateHabitStrengthDecay(5, 0, {
        minStrengthFloor: 20,
      });

      // Starting strength is 5; minStrengthFloor 20 must not boost strength or produce retention > 1.0
      assert.strictEqual(assessment.currentStrength, 5.0);
      assert.strictEqual(assessment.retentionFraction, 1.0);
      assert.ok(assessment.retentionFraction <= 1.0);
      assert.strictEqual(assessment.status, 'dormant');
    });
  });

  describe('Status Tiers & Recommendations Boundary Checks', () => {
    it('classifies currentStrength >= 80 as "solid"', () => {
      const assessment80 = calculateHabitStrengthDecay(80, 0);
      assert.strictEqual(assessment80.status, 'solid');
      assert.strictEqual(
        assessment80.recommendation,
        'Habit neural pathway is well-preserved.'
      );
    });

    it('classifies 50 <= currentStrength < 80 as "fading"', () => {
      const assessment79 = calculateHabitStrengthDecay(79.9, 0);
      assert.strictEqual(assessment79.status, 'fading');
      assert.strictEqual(
        assessment79.recommendation,
        'Strength is fading. A quick check-in will restore momentum.'
      );

      const assessment50 = calculateHabitStrengthDecay(50, 0);
      assert.strictEqual(assessment50.status, 'fading');
    });

    it('classifies 20 <= currentStrength < 50 as "at_risk"', () => {
      const assessment49 = calculateHabitStrengthDecay(49.9, 0);
      assert.strictEqual(assessment49.status, 'at_risk');
      assert.strictEqual(
        assessment49.recommendation,
        'High risk of habit drop-off. Initiate a two-minute comeback.'
      );

      const assessment20 = calculateHabitStrengthDecay(20, 0);
      assert.strictEqual(assessment20.status, 'at_risk');
    });

    it('classifies currentStrength < 20 as "dormant"', () => {
      const assessment19 = calculateHabitStrengthDecay(19.9, 0);
      assert.strictEqual(assessment19.status, 'dormant');
      assert.strictEqual(
        assessment19.recommendation,
        'Habit has become dormant. Re-anchor with a tiny trigger.'
      );
    });
  });

  describe('Input Validation & Boundary Errors', () => {
    it('throws TypeError if initialStrength is not a finite number', () => {
      assert.throws(
        () => calculateHabitStrengthDecay('80' as unknown as number, 5),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(null as unknown as number, 5),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(Number.NaN, 5),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(Infinity, 5),
        TypeError
      );
    });

    it('throws TypeError if daysSinceLastCheckIn is not a finite number', () => {
      assert.throws(
        () => calculateHabitStrengthDecay(80, '5' as unknown as number),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, null as unknown as number),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, Number.NaN),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, -Infinity),
        TypeError
      );
    });

    it('throws RangeError if initialStrength < 0 or > 100', () => {
      assert.throws(() => calculateHabitStrengthDecay(-1, 5), RangeError);
      assert.throws(() => calculateHabitStrengthDecay(100.1, 5), RangeError);
      assert.throws(() => calculateHabitStrengthDecay(150, 5), RangeError);
    });

    it('throws RangeError if daysSinceLastCheckIn < 0', () => {
      assert.throws(() => calculateHabitStrengthDecay(80, -0.1), RangeError);
      assert.throws(() => calculateHabitStrengthDecay(80, -5), RangeError);
    });

    it('throws TypeError if halfLifeDays is not a finite number', () => {
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { halfLifeDays: '7' as unknown as number }),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { halfLifeDays: Number.NaN }),
        TypeError
      );
    });

    it('throws RangeError if halfLifeDays <= 0', () => {
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { halfLifeDays: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { halfLifeDays: -7 }),
        RangeError
      );
    });

    it('throws TypeError if minStrengthFloor is not a finite number', () => {
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { minStrengthFloor: '10' as unknown as number }),
        TypeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { minStrengthFloor: Number.NaN }),
        TypeError
      );
    });

    it('throws RangeError if minStrengthFloor < 0 or > 100', () => {
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { minStrengthFloor: -5 }),
        RangeError
      );
      assert.throws(
        () => calculateHabitStrengthDecay(80, 5, { minStrengthFloor: 101 }),
        RangeError
      );
    });
  });
});

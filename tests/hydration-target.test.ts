import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyHydrationTarget } from '../src/lib/health/hydration-target';

describe('calculateDailyHydrationTarget', () => {
  describe('target calculation', () => {
    it('uses 35 ml per kg with defaults for all optional fields', () => {
      assert.deepStrictEqual(calculateDailyHydrationTarget({ weightKg: 70 }), {
        totalTargetMl: 2450,
        glassCount: 10,
        glassVolumeMl: 250,
        breakdown: {
          baselineMl: 2450,
          exerciseAdjustmentMl: 0,
          climateAdjustmentMl: 0,
        },
      });
    });

    it('adds 12 ml per workout minute', () => {
      const result = calculateDailyHydrationTarget({ weightKg: 70, workoutMinutes: 30 });
      assert.strictEqual(result.breakdown.exerciseAdjustmentMl, 360);
      assert.strictEqual(result.totalTargetMl, 2800);
      assert.strictEqual(result.glassCount, 12);
    });

    it('adds 10% of the baseline in a warm climate', () => {
      const result = calculateDailyHydrationTarget({ weightKg: 70, isWarmClimate: true });
      assert.strictEqual(result.breakdown.climateAdjustmentMl, 245);
      assert.strictEqual(result.totalTargetMl, 2700);
      assert.strictEqual(result.glassCount, 11);
    });

    it('adds no climate adjustment when isWarmClimate is false', () => {
      const result = calculateDailyHydrationTarget({ weightKg: 70, isWarmClimate: false });
      assert.strictEqual(result.breakdown.climateAdjustmentMl, 0);
      assert.strictEqual(result.totalTargetMl, 2450);
    });

    it('bases the climate adjustment on the baseline only, not on exercise', () => {
      const result = calculateDailyHydrationTarget({
        weightKg: 70,
        workoutMinutes: 30,
        isWarmClimate: true,
      });
      assert.deepStrictEqual(result.breakdown, {
        baselineMl: 2450,
        exerciseAdjustmentMl: 360,
        climateAdjustmentMl: 245,
      });
      assert.strictEqual(result.totalTargetMl, 3050);
      assert.strictEqual(result.glassCount, 13);
    });
  });

  describe('rounding', () => {
    it('rounds up to the nearest 50 ml', () => {
      // 66 * 35 + 10 * 12 = 2430
      const result = calculateDailyHydrationTarget({ weightKg: 66, workoutMinutes: 10 });
      assert.strictEqual(result.totalTargetMl, 2450);
    });

    it('rounds down to the nearest 50 ml', () => {
      // 70 * 35 + 30 * 12 = 2810
      const result = calculateDailyHydrationTarget({ weightKg: 70, workoutMinutes: 30 });
      assert.strictEqual(result.totalTargetMl, 2800);
    });

    it('rounds a value exactly halfway between multiples up', () => {
      // 65 * 35 + 12.5 * 12 = 2425
      const result = calculateDailyHydrationTarget({ weightKg: 65, workoutMinutes: 12.5 });
      assert.strictEqual(result.totalTargetMl, 2450);
    });

    it('rounds only the total and leaves the breakdown unrounded', () => {
      const result = calculateDailyHydrationTarget({ weightKg: 70.5 });
      assert.strictEqual(result.breakdown.baselineMl, 2467.5);
      assert.strictEqual(result.totalTargetMl, 2450);
    });
  });

  describe('glass division', () => {
    it('rounds a partial glass up using a custom glass volume', () => {
      const result = calculateDailyHydrationTarget({ weightKg: 70, glassVolumeMl: 500 });
      assert.strictEqual(result.glassVolumeMl, 500);
      assert.strictEqual(result.glassCount, 5);
    });

    it('does not add a glass when the target divides exactly', () => {
      // 40 * 35 + 50 * 12 = 2000
      const result = calculateDailyHydrationTarget({ weightKg: 40, workoutMinutes: 50 });
      assert.strictEqual(result.totalTargetMl, 2000);
      assert.strictEqual(result.glassCount, 8);
    });
  });

  describe('validation', () => {
    it('throws a RangeError for an invalid weight', () => {
      for (const weightKg of [0, -70, Number.NaN, Number.POSITIVE_INFINITY]) {
        assert.throws(() => calculateDailyHydrationTarget({ weightKg }), RangeError);
      }
    });

    it('throws a RangeError for an invalid glass volume', () => {
      for (const glassVolumeMl of [0, -250, Number.NaN, Number.POSITIVE_INFINITY]) {
        assert.throws(
          () => calculateDailyHydrationTarget({ weightKg: 70, glassVolumeMl }),
          RangeError
        );
      }
    });

    it('throws a RangeError for invalid workout minutes', () => {
      for (const workoutMinutes of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
        assert.throws(
          () => calculateDailyHydrationTarget({ weightKg: 70, workoutMinutes }),
          RangeError
        );
      }
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateStepCalories } from '../src/lib/health/step-calorie';

describe('estimateStepCalories', () => {
  describe('typical step counts (default 70 kg)', () => {
    it('handles 0 steps', () => {
      assert.deepEqual(estimateStepCalories(0), {
        caloriesBurned: 0,
        distanceKm: 0,
        activityLevel: 'sedentary',
      });
    });

    it('handles 5,000 steps', () => {
      assert.deepEqual(estimateStepCalories(5000), {
        caloriesBurned: 200,
        distanceKm: 3.81,
        activityLevel: 'lightly_active',
      });
    });

    it('handles 8,000 steps', () => {
      assert.deepEqual(estimateStepCalories(8000), {
        caloriesBurned: 319,
        distanceKm: 6.1,
        activityLevel: 'moderately_active',
      });
    });

    it('handles 10,000 steps', () => {
      assert.deepEqual(estimateStepCalories(10000), {
        caloriesBurned: 399,
        distanceKm: 7.62,
        activityLevel: 'highly_active',
      });
    });
  });

  describe('custom weight', () => {
    it('scales calories with weight', () => {
      assert.equal(estimateStepCalories(10000, 50).caloriesBurned, 285);
      assert.equal(estimateStepCalories(10000, 100).caloriesBurned, 570);
    });

    it('does not change distance or activity level', () => {
      const light = estimateStepCalories(8000, 50);
      const heavy = estimateStepCalories(8000, 120);
      assert.equal(light.distanceKm, heavy.distanceKm);
      assert.equal(light.activityLevel, heavy.activityLevel);
    });

    it('accepts fractional weight', () => {
      assert.equal(estimateStepCalories(10000, 72.5).caloriesBurned, 413);
    });
  });

  describe('activity level boundaries', () => {
    it('4,999 is sedentary', () => {
      assert.equal(estimateStepCalories(4999).activityLevel, 'sedentary');
    });
    it('5,000 is lightly_active', () => {
      assert.equal(estimateStepCalories(5000).activityLevel, 'lightly_active');
    });
    it('7,499 is lightly_active', () => {
      assert.equal(estimateStepCalories(7499).activityLevel, 'lightly_active');
    });
    it('7,500 is moderately_active', () => {
      assert.equal(estimateStepCalories(7500).activityLevel, 'moderately_active');
    });
    it('9,999 is moderately_active', () => {
      assert.equal(estimateStepCalories(9999).activityLevel, 'moderately_active');
    });
    it('10,000 is highly_active', () => {
      assert.equal(estimateStepCalories(10000).activityLevel, 'highly_active');
    });
    it('very large step counts remain highly_active', () => {
      assert.equal(estimateStepCalories(50000).activityLevel, 'highly_active');
    });
  });

  describe('rounding', () => {
    it('rounds calories to the nearest integer', () => {
      const result = estimateStepCalories(1000, 70); // 39.9
      assert.equal(result.caloriesBurned, 40);
      assert.ok(Number.isInteger(result.caloriesBurned));
    });

    it('rounds distance to 2 decimals', () => {
      assert.equal(estimateStepCalories(1).distanceKm, 0);
      assert.equal(estimateStepCalories(7500).distanceKm, 5.72);
    });
  });

  describe('validation', () => {
    it('throws TypeError for non-finite or non-number steps', () => {
      assert.throws(() => estimateStepCalories(NaN), TypeError);
      assert.throws(() => estimateStepCalories(Infinity), TypeError);
      assert.throws(() => estimateStepCalories(-Infinity), TypeError);
      assert.throws(() => estimateStepCalories('5000' as unknown as number), TypeError);
      assert.throws(() => estimateStepCalories(undefined as unknown as number), TypeError);
    });

    it('throws TypeError for non-finite or non-number weightKg', () => {
      assert.throws(() => estimateStepCalories(5000, NaN), TypeError);
      assert.throws(() => estimateStepCalories(5000, Infinity), TypeError);
      assert.throws(() => estimateStepCalories(5000, '70' as unknown as number), TypeError);
      assert.throws(() => estimateStepCalories(5000, null as unknown as number), TypeError);
    });

    it('throws RangeError for negative steps', () => {
      assert.throws(() => estimateStepCalories(-1), RangeError);
    });

    it('throws RangeError for zero or negative weight', () => {
      assert.throws(() => estimateStepCalories(5000, 0), RangeError);
      assert.throws(() => estimateStepCalories(5000, -70), RangeError);
    });
  });
});

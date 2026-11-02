import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreHabitStackingViability,
  computeSpatialFriction,
  computeFrequencyPenalty,
  computeEnergyGradientPenalty,
  validateHabitAnchor,
  validateTargetHabit,
  type HabitAnchor,
  type TargetHabit,
} from '../src/lib/habits/habit-stacking.ts';

describe('Habit Stacking Anchor Compatibility & Transition Latency Scorer (habit-stacking.ts)', () => {
  const baseAnchor: HabitAnchor = {
    name: 'Morning Coffee Brew',
    isEstablishedAnchor: true,
    frequency: 'daily',
    location: 'kitchen',
    energyRequired: 'low',
    consistencyScorePercentage: 95,
  };

  const baseTarget: TargetHabit = {
    name: 'Take Vitamin D',
    frequency: 'daily',
    location: 'kitchen',
    energyRequired: 'low',
    estimatedDurationMinutes: 1,
  };

  describe('Validation & Boundary Invariants', () => {
    it('validates correct anchor and target objects without throwing', () => {
      assert.doesNotThrow(() => validateHabitAnchor(baseAnchor));
      assert.doesNotThrow(() => validateTargetHabit(baseTarget));
    });

    it('throws TypeError for null, undefined, or malformed anchor/target', () => {
      // @ts-expect-error Testing invalid input
      assert.throws(() => scoreHabitStackingViability(null, baseTarget), TypeError);
      // @ts-expect-error Testing invalid input
      assert.throws(() => scoreHabitStackingViability(baseAnchor, null), TypeError);
      // @ts-expect-error Testing invalid input
      assert.throws(() => scoreHabitStackingViability(undefined, baseTarget), TypeError);
    });

    it('throws RangeError for invalid frequency, location, or energy in anchor', () => {
      // @ts-expect-error Testing invalid frequency
      assert.throws(() => validateHabitAnchor({ ...baseAnchor, frequency: 'hourly' }), RangeError);
      // @ts-expect-error Testing invalid location
      assert.throws(() => validateHabitAnchor({ ...baseAnchor, location: 'mars' }), RangeError);
      // @ts-expect-error Testing invalid energy
      assert.throws(() => validateHabitAnchor({ ...baseAnchor, energyRequired: 'extreme' }), RangeError);
    });

    it('throws RangeError or TypeError for invalid consistency score (out of 0-100 or NaN)', () => {
      assert.throws(() => validateHabitAnchor({ ...baseAnchor, consistencyScorePercentage: -10 }), RangeError);
      assert.throws(() => validateHabitAnchor({ ...baseAnchor, consistencyScorePercentage: 110 }), RangeError);
      assert.throws(() => validateHabitAnchor({ ...baseAnchor, consistencyScorePercentage: Number.NaN }), TypeError);
    });

    it('throws RangeError for non-positive target estimated duration', () => {
      assert.throws(() => validateTargetHabit({ ...baseTarget, estimatedDurationMinutes: 0 }), RangeError);
      assert.throws(() => validateTargetHabit({ ...baseTarget, estimatedDurationMinutes: -5 }), RangeError);
    });
  });

  describe('Ideal Co-located Habit Stacks', () => {
    it('scores highly_compatible (>= 80) for co-located, same-frequency, low-energy habit stack', () => {
      const assessment = scoreHabitStackingViability(baseAnchor, baseTarget);

      assert.strictEqual(assessment.viabilityScore, 95);
      assert.strictEqual(assessment.viabilityTier, 'highly_compatible');
      assert.strictEqual(assessment.unestablishedAnchorPenalty, 0);
      assert.strictEqual(assessment.frequencyCompatibilityPenalty, 0);
      assert.strictEqual(assessment.spatialFrictionPenalty, 0);
      assert.strictEqual(assessment.energyGradientPenalty, 0);
      assert.strictEqual(assessment.warnings.length, 0);
      assert.ok(assessment.recommendations[0].includes('Optimal stack'));
    });
  });

  describe('Unestablished Anchor Penalty', () => {
    it('applies -30 penalty and emits stability warning when isEstablishedAnchor is false', () => {
      const unestablished: HabitAnchor = {
        ...baseAnchor,
        isEstablishedAnchor: false,
        consistencyScorePercentage: 90,
      };

      const assessment = scoreHabitStackingViability(unestablished, baseTarget);

      assert.strictEqual(assessment.unestablishedAnchorPenalty, 30);
      assert.strictEqual(assessment.viabilityScore, 60); // 90 - 30 = 60
      assert.strictEqual(assessment.viabilityTier, 'viable');
      assert.ok(assessment.warnings.some(w => w.includes('unproven')));
    });
  });

  describe('Frequency Mismatch & Hard Ceiling', () => {
    it('severely penalizes stacking daily target onto weekly anchor and caps at <= 40', () => {
      const weeklyAnchor: HabitAnchor = {
        ...baseAnchor,
        frequency: 'weekly',
        consistencyScorePercentage: 100,
      };

      const assessment = scoreHabitStackingViability(weeklyAnchor, baseTarget); // baseTarget is daily

      assert.strictEqual(assessment.frequencyCompatibilityPenalty, 45);
      assert.ok(assessment.viabilityScore <= 40);
      assert.strictEqual(assessment.viabilityTier, 'incompatible');
      assert.ok(assessment.warnings.some(w => w.includes('Anti-pattern')));
    });

    it('penalizes weekday anchor to weekend target mismatch', () => {
      const weekdayAnchor: HabitAnchor = { ...baseAnchor, frequency: 'weekdays' };
      const weekendTarget: TargetHabit = { ...baseTarget, frequency: 'weekends' };

      const assessment = scoreHabitStackingViability(weekdayAnchor, weekendTarget);
      assert.strictEqual(assessment.frequencyCompatibilityPenalty, 35);
      assert.ok(assessment.warnings.some(w => w.includes('Schedule collision')));
    });
  });

  describe('Spatial Friction & Environmental Transitions', () => {
    it('evaluates domestic room proximity with 10 penalty', () => {
      const res = computeSpatialFriction('bedroom', 'bathroom');
      assert.strictEqual(res.penalty, 10);
      assert.strictEqual(res.warning, undefined);
    });

    it('evaluates threshold crossing to gym/outdoors with 25 penalty and warning', () => {
      const res = computeSpatialFriction('office', 'gym_outdoors');
      assert.strictEqual(res.penalty, 25);
      assert.ok(res.warning?.includes('environmental transition'));
    });

    it('applies minimal 5 penalty for digital transitions', () => {
      const res = computeSpatialFriction('kitchen', 'digital');
      assert.strictEqual(res.penalty, 5);
    });
  });

  describe('Energy Gradient Transitions', () => {
    it('penalizes consecutive high energy tasks with 15 penalty', () => {
      const res = computeEnergyGradientPenalty('high', 'high');
      assert.strictEqual(res.penalty, 15);
      assert.ok(res.warning?.includes('cognitive burnout'));
    });

    it('penalizes sudden low to high energy transition with 10 penalty', () => {
      const res = computeEnergyGradientPenalty('low', 'high');
      assert.strictEqual(res.penalty, 10);
      assert.ok(res.warning?.includes('ramp-up'));
    });

    it('allows medium to medium or high to low transitions without penalty', () => {
      assert.strictEqual(computeEnergyGradientPenalty('medium', 'medium').penalty, 0);
      assert.strictEqual(computeEnergyGradientPenalty('high', 'low').penalty, 0);
    });
  });

  describe('Score Clamping & Strict Monotonicity', () => {
    it('strictly bounds viabilityScore between 0 and 100 under extreme penalties', () => {
      const terribleAnchor: HabitAnchor = {
        name: 'Occasional Sunday stroll',
        isEstablishedAnchor: false, // -30
        frequency: 'weekly',        // -45
        location: 'gym_outdoors',   // -25 to office
        energyRequired: 'low',      // -10 to high
        consistencyScorePercentage: 20, // base 20 - 110 penalties
      };

      const heavyTarget: TargetHabit = {
        name: 'Deep Work Coding',
        frequency: 'daily',
        location: 'office',
        energyRequired: 'high',
        estimatedDurationMinutes: 90,
      };

      const assessment = scoreHabitStackingViability(terribleAnchor, heavyTarget);
      assert.strictEqual(assessment.viabilityScore, 0);
      assert.strictEqual(assessment.viabilityTier, 'incompatible');
    });

    it('strictly increases viabilityScore monotonically as anchor consistency increases', () => {
      let previousScore = 0;

      for (let consistency = 10; consistency <= 100; consistency += 10) {
        const anchor: HabitAnchor = {
          ...baseAnchor,
          consistencyScorePercentage: consistency,
        };
        const assessment = scoreHabitStackingViability(anchor, baseTarget);

        assert.ok(
          assessment.viabilityScore >= previousScore,
          `Score at consistency ${consistency} (${assessment.viabilityScore}) must be >= previous (${previousScore})`
        );
        previousScore = assessment.viabilityScore;
      }
    });
  });
});

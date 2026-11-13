/**
 * Habit Elasticity & Slump Recovery Score Test Suite
 *
 * Validates the decay-discounted habit elasticity model, slump severity
 * classifications, prolonged absence credit policies, and edge-case handling.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHabitElasticity,
  type HabitElasticityOptions,
  type HabitElasticityReport,
} from '../src/lib/habits/habit-elasticity';

describe('Habit Elasticity & Slump Recovery Model (habit-elasticity.ts)', () => {
  describe('Momentum and Decay Dynamics', () => {
    it('returns zero score and zero credits for zero streak and zero missed days', () => {
      const report = calculateHabitElasticity({
        streakBeforeBreak: 0,
        daysMissed: 0,
      });

      assert.strictEqual(report.elasticityScore, 0);
      assert.strictEqual(report.retainedStreakCredits, 0);
      assert.strictEqual(report.slumpSeverity, 'minor_hiccup');
      assert.strictEqual(report.suggestedAction, 'immediate_one_rep_win');
      assert.ok(report.resilienceMessage.length > 0);
    });

    it('retains all accumulated momentum when zero days are missed', () => {
      // For a 50-day streak: M = 1 - exp(-0.06 * 50) = 1 - exp(-3) ≈ 0.9502
      // With daysMissed = 0, decay = 0.5^0 = 1.0 -> elasticityScore = round(95.02) = 95%
      const report = calculateHabitElasticity({
        streakBeforeBreak: 50,
        daysMissed: 0,
      });

      const expectedMomentum = 1 - Math.exp(-0.06 * 50);
      const expectedScore = Math.round(100 * expectedMomentum);

      assert.strictEqual(report.elasticityScore, expectedScore);
      assert.strictEqual(report.elasticityScore, 95);
      assert.strictEqual(report.retainedStreakCredits, Math.floor((50 * 95) / 100));
      assert.strictEqual(report.slumpSeverity, 'minor_hiccup');
      assert.strictEqual(report.suggestedAction, 'immediate_one_rep_win');
    });

    it('produces score > 75% and minor_hiccup for 1 missed day after a 60-day streak', () => {
      // 60-day streak: M = 1 - exp(-3.6) ≈ 0.97268
      // 1 missed day with default halfLife = 3: decay = 0.5^(1/3) ≈ 0.7937
      // Score = round(100 * 0.97268 * 0.7937) = 77
      const report = calculateHabitElasticity({
        streakBeforeBreak: 60,
        daysMissed: 1,
      });

      assert.ok(
        report.elasticityScore > 75,
        `Expected score > 75, got ${report.elasticityScore}`
      );
      assert.strictEqual(report.elasticityScore, 77);
      assert.strictEqual(report.slumpSeverity, 'minor_hiccup');
      assert.strictEqual(report.suggestedAction, 'immediate_one_rep_win');
      assert.strictEqual(report.retainedStreakCredits, Math.floor((60 * 77) / 100));
      assert.strictEqual(report.retainedStreakCredits, 46);
    });

    it('produces low initial momentum for 1 missed day after a 1-day streak', () => {
      // 1-day streak: M = 1 - exp(-0.06) ≈ 0.0582
      // 1 missed day: decay ≈ 0.7937
      // Score = round(100 * 0.0582 * 0.7937) = 5
      const report = calculateHabitElasticity({
        streakBeforeBreak: 1,
        daysMissed: 1,
      });

      assert.ok(
        report.elasticityScore < 10,
        `Expected low momentum score < 10, got ${report.elasticityScore}`
      );
      assert.strictEqual(report.elasticityScore, 5);
      assert.strictEqual(report.retainedStreakCredits, 0);
      assert.strictEqual(report.slumpSeverity, 'minor_hiccup');
      assert.strictEqual(report.suggestedAction, 'immediate_one_rep_win');
    });

    it('classifies 2 missed days as slippery_slope', () => {
      const report = calculateHabitElasticity({
        streakBeforeBreak: 40,
        daysMissed: 2,
      });

      assert.strictEqual(report.slumpSeverity, 'slippery_slope');
      assert.strictEqual(report.suggestedAction, 'half_volume_session');
    });

    it('classifies 3 and 7 missed days as habit_dormant', () => {
      const reportAt3 = calculateHabitElasticity({
        streakBeforeBreak: 40,
        daysMissed: 3,
      });
      assert.strictEqual(reportAt3.slumpSeverity, 'habit_dormant');
      assert.strictEqual(reportAt3.suggestedAction, 'half_volume_session');

      const reportAt5 = calculateHabitElasticity({
        streakBeforeBreak: 40,
        daysMissed: 5,
      });
      assert.strictEqual(reportAt5.slumpSeverity, 'habit_dormant');
      assert.strictEqual(reportAt5.suggestedAction, 'half_volume_session');

      const reportAt7 = calculateHabitElasticity({
        streakBeforeBreak: 40,
        daysMissed: 7,
      });
      assert.strictEqual(reportAt7.slumpSeverity, 'habit_dormant');
      assert.strictEqual(reportAt7.suggestedAction, 'half_volume_session');
    });

    it('classifies 8 or more missed days as full_extinction', () => {
      const reportAt8 = calculateHabitElasticity({
        streakBeforeBreak: 40,
        daysMissed: 8,
      });
      assert.strictEqual(reportAt8.slumpSeverity, 'full_extinction');
      assert.strictEqual(reportAt8.suggestedAction, 'full_ritual_restart');

      const reportAt14 = calculateHabitElasticity({
        streakBeforeBreak: 40,
        daysMissed: 14,
      });
      assert.strictEqual(reportAt14.slumpSeverity, 'full_extinction');
      assert.strictEqual(reportAt14.suggestedAction, 'full_ritual_restart');
    });

    it('expires retained streak credits to 0 for prolonged absence (> 14 days)', () => {
      // Exactly 14 days missed: still within credit eligibility window
      const reportAt14 = calculateHabitElasticity({
        streakBeforeBreak: 100,
        daysMissed: 14,
      });
      assert.strictEqual(reportAt14.slumpSeverity, 'full_extinction');
      assert.ok(reportAt14.elasticityScore > 0);
      assert.ok(reportAt14.retainedStreakCredits > 0);

      // 15 days missed: prolonged absence rule kicks in -> credits reset to 0
      const reportAt15 = calculateHabitElasticity({
        streakBeforeBreak: 100,
        daysMissed: 15,
      });
      assert.strictEqual(reportAt15.slumpSeverity, 'full_extinction');
      assert.strictEqual(reportAt15.retainedStreakCredits, 0);

      // Large streak with 30 days missed
      const reportAt30 = calculateHabitElasticity({
        streakBeforeBreak: 500,
        daysMissed: 30,
      });
      assert.strictEqual(reportAt30.retainedStreakCredits, 0);
      assert.strictEqual(reportAt30.slumpSeverity, 'full_extinction');
    });

    it('custom halfLifeDays modifies decay rate as expected', () => {
      const baselineReport = calculateHabitElasticity({
        streakBeforeBreak: 50,
        daysMissed: 6,
        halfLifeDays: 3, // 2 half-lives elapsed -> decay = 0.25
      });

      const resilientReport = calculateHabitElasticity({
        streakBeforeBreak: 50,
        daysMissed: 6,
        halfLifeDays: 6, // 1 half-life elapsed -> decay = 0.50
      });

      const fragileReport = calculateHabitElasticity({
        streakBeforeBreak: 50,
        daysMissed: 6,
        halfLifeDays: 1, // 6 half-lives elapsed -> decay = 0.015625
      });

      assert.ok(
        resilientReport.elasticityScore > baselineReport.elasticityScore,
        'Longer half-life should retain higher elasticity score'
      );
      assert.ok(
        baselineReport.elasticityScore > fragileReport.elasticityScore,
        'Shorter half-life should decay faster'
      );
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('throws TypeError when options argument is not an object or missing', () => {
      assert.throws(() => calculateHabitElasticity(null as any), TypeError);
      assert.throws(() => calculateHabitElasticity(undefined as any), TypeError);
      assert.throws(() => calculateHabitElasticity('options' as any), TypeError);
      assert.throws(() => calculateHabitElasticity(123 as any), TypeError);
    });

    it('throws RangeError for negative streakBeforeBreak', () => {
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: -1, daysMissed: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: -50, daysMissed: 2 }),
        RangeError
      );
    });

    it('throws RangeError for non-finite or NaN streakBeforeBreak', () => {
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: Number.NaN, daysMissed: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: Infinity, daysMissed: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: -Infinity, daysMissed: 0 }),
        RangeError
      );
    });

    it('throws TypeError for non-number streakBeforeBreak', () => {
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: '10' as any, daysMissed: 0 }),
        TypeError
      );
    });

    it('throws RangeError for negative daysMissed', () => {
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: 10, daysMissed: -1 }),
        RangeError
      );
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: 10, daysMissed: -10 }),
        RangeError
      );
    });

    it('throws RangeError for non-finite or NaN daysMissed', () => {
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: 10, daysMissed: Number.NaN }),
        RangeError
      );
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: 10, daysMissed: Infinity }),
        RangeError
      );
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: 10, daysMissed: -Infinity }),
        RangeError
      );
    });

    it('throws TypeError for non-number daysMissed', () => {
      assert.throws(
        () => calculateHabitElasticity({ streakBeforeBreak: 10, daysMissed: '3' as any }),
        TypeError
      );
    });

    it('rejects invalid halfLifeDays values with RangeError or TypeError', () => {
      // Non-positive values
      assert.throws(
        () =>
          calculateHabitElasticity({
            streakBeforeBreak: 10,
            daysMissed: 1,
            halfLifeDays: 0,
          }),
        RangeError
      );
      assert.throws(
        () =>
          calculateHabitElasticity({
            streakBeforeBreak: 10,
            daysMissed: 1,
            halfLifeDays: -3,
          }),
        RangeError
      );

      // Non-finite values
      assert.throws(
        () =>
          calculateHabitElasticity({
            streakBeforeBreak: 10,
            daysMissed: 1,
            halfLifeDays: Number.NaN,
          }),
        RangeError
      );
      assert.throws(
        () =>
          calculateHabitElasticity({
            streakBeforeBreak: 10,
            daysMissed: 1,
            halfLifeDays: Infinity,
          }),
        RangeError
      );

      // Non-number value
      assert.throws(
        () =>
          calculateHabitElasticity({
            streakBeforeBreak: 10,
            daysMissed: 1,
            halfLifeDays: '5' as any,
          }),
        TypeError
      );
    });
  });

  describe('Report Invariants & Integrity', () => {
    it('always produces an integer elasticity score between 0 and 100', () => {
      const testCases: [number, number, number?][] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [5, 2],
        [10, 3],
        [30, 5],
        [60, 1],
        [100, 10],
        [365, 14],
        [1000, 30],
        [50, 4, 7],
      ];

      for (const [streak, missed, halfLife] of testCases) {
        const report = calculateHabitElasticity({
          streakBeforeBreak: streak,
          daysMissed: missed,
          ...(halfLife ? { halfLifeDays: halfLife } : {}),
        });

        assert.ok(
          Number.isInteger(report.elasticityScore),
          `Score ${report.elasticityScore} must be an integer`
        );
        assert.ok(
          report.elasticityScore >= 0 && report.elasticityScore <= 100,
          `Score ${report.elasticityScore} must be in [0, 100]`
        );
      }
    });

    it('always produces non-negative integer retainedStreakCredits bounded by streakBeforeBreak', () => {
      const testCases: [number, number][] = [
        [0, 0],
        [1, 1],
        [10, 2],
        [50, 3],
        [100, 14],
        [100, 15],
      ];

      for (const [streak, missed] of testCases) {
        const report = calculateHabitElasticity({
          streakBeforeBreak: streak,
          daysMissed: missed,
        });

        assert.ok(
          Number.isInteger(report.retainedStreakCredits),
          `Retained credits ${report.retainedStreakCredits} must be an integer`
        );
        assert.ok(
          report.retainedStreakCredits >= 0,
          `Retained credits ${report.retainedStreakCredits} must be >= 0`
        );
        assert.ok(
          report.retainedStreakCredits <= streak,
          `Retained credits ${report.retainedStreakCredits} cannot exceed streak ${streak}`
        );
      }
    });

    it('correctly classifies severity at all boundary conditions', () => {
      const boundaryChecks: [number, HabitElasticityReport['slumpSeverity']][] = [
        [0, 'minor_hiccup'],
        [1, 'minor_hiccup'],
        [1.5, 'slippery_slope'],
        [2, 'slippery_slope'],
        [2.5, 'habit_dormant'],
        [3, 'habit_dormant'],
        [7, 'habit_dormant'],
        [7.1, 'full_extinction'],
        [8, 'full_extinction'],
        [15, 'full_extinction'],
      ];

      for (const [daysMissed, expectedSeverity] of boundaryChecks) {
        const report = calculateHabitElasticity({
          streakBeforeBreak: 20,
          daysMissed,
        });
        assert.strictEqual(
          report.slumpSeverity,
          expectedSeverity,
          `daysMissed ${daysMissed} should be ${expectedSeverity}`
        );
      }
    });

    it('populates supportive non-empty messages and valid suggested actions for every severity', () => {
      const cases: HabitElasticityOptions[] = [
        { streakBeforeBreak: 30, daysMissed: 0 },
        { streakBeforeBreak: 30, daysMissed: 1 },
        { streakBeforeBreak: 30, daysMissed: 2 },
        { streakBeforeBreak: 30, daysMissed: 5 },
        { streakBeforeBreak: 30, daysMissed: 10 },
      ];

      const validActions = new Set([
        'immediate_one_rep_win',
        'half_volume_session',
        'full_ritual_restart',
      ]);

      for (const opt of cases) {
        const report = calculateHabitElasticity(opt);
        assert.ok(typeof report.resilienceMessage === 'string');
        assert.ok(report.resilienceMessage.trim().length > 10);
        assert.ok(validActions.has(report.suggestedAction));
      }
    });

    it('produces deterministic output on repeated invocations', () => {
      const options: HabitElasticityOptions = {
        streakBeforeBreak: 45,
        daysMissed: 3,
        halfLifeDays: 4,
      };

      const run1 = calculateHabitElasticity(options);
      const run2 = calculateHabitElasticity(options);

      assert.deepStrictEqual(run1, run2);
    });
  });
});

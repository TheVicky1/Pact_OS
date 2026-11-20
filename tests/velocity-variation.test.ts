import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVelocityStability,
  type ExecutionStabilityTier,
} from '../src/lib/analytics/velocity-variation';

describe('Task Completion Velocity Coefficient of Variation (velocity-variation.ts)', () => {
  describe('Identical Throughput (Zero Variance)', () => {
    it('produces 0 variance, 0 CV, 100 stability score, and hyper-stable tier for identical velocities', () => {
      const metrics = calculateVelocityStability([10, 10, 10, 10]);

      assert.strictEqual(metrics.periodCount, 4);
      assert.strictEqual(metrics.meanVelocity, 10.0);
      assert.strictEqual(metrics.variance, 0.0);
      assert.strictEqual(metrics.standardDeviation, 0.0);
      assert.strictEqual(metrics.coefficientOfVariation, 0.0);
      assert.strictEqual(metrics.stabilityScore, 100);
      assert.strictEqual(metrics.stabilityTier, 'hyper-stable');
    });
  });

  describe('Steady Variance', () => {
    it('calculates steady tier for low, controlled throughput variance', () => {
      // Data: [10, 12, 9, 11, 10]
      // mean = 52 / 5 = 10.4
      // diffs: -0.4, 1.6, -1.4, 0.6, -0.4
      // sq diffs: 0.16 + 2.56 + 1.96 + 0.36 + 0.16 = 5.2
      // variance = 5.2 / 4 = 1.3
      // SD = sqrt(1.3) ≈ 1.1402
      // CV = 1.1402 / 10.4 ≈ 0.1096 -> < 0.15 -> hyper-stable
      const metricsHyper = calculateVelocityStability([10, 12, 9, 11, 10]);
      assert.strictEqual(metricsHyper.meanVelocity, 10.4);
      assert.strictEqual(metricsHyper.variance, 1.3);
      assert.strictEqual(metricsHyper.standardDeviation, 1.1402);
      assert.strictEqual(metricsHyper.coefficientOfVariation, 0.1096);
      assert.strictEqual(metricsHyper.stabilityTier, 'hyper-stable');

      // Controlled test for steady tier (0.15 <= CV < 0.35):
      // Data: [10, 14, 8, 12, 10] -> mean = 10.8, variance = 5.2, SD = 2.2804, CV = 0.2111
      const metricsSteady = calculateVelocityStability([10, 14, 8, 12, 10]);
      assert.strictEqual(metricsSteady.meanVelocity, 10.8);
      assert.strictEqual(metricsSteady.variance, 5.2);
      assert.strictEqual(metricsSteady.standardDeviation, 2.2804);
      assert.strictEqual(metricsSteady.coefficientOfVariation, 0.2111);
      assert.strictEqual(metricsSteady.stabilityScore, 79);
      assert.strictEqual(metricsSteady.stabilityTier, 'steady');
    });
  });

  describe('Volatile and Erratic High-Variance Tiers', () => {
    it('classifies moderate dispersion in the volatile tier (0.35 <= CV < 0.60)', () => {
      // Data: [10, 20]
      // mean = 15, variance = 50, SD = 7.0711, CV = 7.0711 / 15 = 0.4714
      const metrics = calculateVelocityStability([10, 20]);
      assert.strictEqual(metrics.periodCount, 2);
      assert.strictEqual(metrics.meanVelocity, 15.0);
      assert.strictEqual(metrics.variance, 50.0);
      assert.strictEqual(metrics.standardDeviation, 7.0711);
      assert.strictEqual(metrics.coefficientOfVariation, 0.4714);
      assert.strictEqual(metrics.stabilityScore, 53); // round((1 - 0.4714) * 100) = 53
      assert.strictEqual(metrics.stabilityTier, 'volatile');
    });

    it('classifies erratic burnout cycles (CV >= 0.60) with 0 stability score', () => {
      // Context from issue: "completing 0 tasks for 6 days and 70 tasks on Sunday"
      const burnout = [0, 0, 0, 0, 0, 0, 70];
      const metrics = calculateVelocityStability(burnout);

      assert.strictEqual(metrics.periodCount, 7);
      assert.strictEqual(metrics.meanVelocity, 10.0);
      // variance = (6 * (-10)^2 + 60^2) / 6 = (600 + 3600) / 6 = 700
      assert.strictEqual(metrics.variance, 700.0);
      assert.strictEqual(metrics.standardDeviation, 26.4575);
      assert.strictEqual(metrics.coefficientOfVariation, 2.6458);
      // Since CV = 2.6458 > 1, Math.min(1, CV) = 1 -> score = (1 - 1) * 100 = 0
      assert.strictEqual(metrics.stabilityScore, 0);
      assert.strictEqual(metrics.stabilityTier, 'erratic');
    });
  });

  describe('Zero Velocity Handling', () => {
    it('returns CV=0 and stabilityScore=0 when mean velocity is 0', () => {
      const metrics = calculateVelocityStability([0, 0, 0, 0]);

      assert.strictEqual(metrics.periodCount, 4);
      assert.strictEqual(metrics.meanVelocity, 0.0);
      assert.strictEqual(metrics.variance, 0.0);
      assert.strictEqual(metrics.standardDeviation, 0.0);
      assert.strictEqual(metrics.coefficientOfVariation, 0.0);
      assert.strictEqual(metrics.stabilityScore, 0);
      assert.strictEqual(metrics.stabilityTier, 'hyper-stable');
    });
  });

  describe('Bessel\'s Correction & Float Precision', () => {
    it('uses N-1 denominator for sample variance and rounds float metrics to 4 decimal places', () => {
      const metrics = calculateVelocityStability([3, 7]);
      // mean = 5. diffs: -2, 2. sum sq = 8.
      // Bessel's variance = 8 / (2 - 1) = 8.0
      // SD = sqrt(8) ≈ 2.8284
      // CV = 2.8284 / 5 = 0.5657
      assert.strictEqual(metrics.variance, 8.0);
      assert.strictEqual(metrics.standardDeviation, 2.8284);
      assert.strictEqual(metrics.coefficientOfVariation, 0.5657);
      assert.strictEqual(metrics.stabilityTier, 'volatile');
    });
  });

  describe('Validation & Error Boundaries', () => {
    it('throws RangeError if velocities array has fewer than 2 periods', () => {
      assert.throws(() => calculateVelocityStability([]), RangeError);
      assert.throws(() => calculateVelocityStability([10]), RangeError);
    });

    it('throws TypeError if velocities is not an array', () => {
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateVelocityStability(null), TypeError);
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateVelocityStability(undefined), TypeError);
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateVelocityStability('10,20'), TypeError);
    });

    it('throws TypeError if any velocity is not a finite number', () => {
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateVelocityStability([10, '20']), TypeError);
      assert.throws(() => calculateVelocityStability([10, Number.NaN]), TypeError);
      assert.throws(() => calculateVelocityStability([10, Infinity]), TypeError);
    });

    it('throws RangeError if any velocity value is negative', () => {
      assert.throws(() => calculateVelocityStability([10, -1]), RangeError);
      assert.throws(() => calculateVelocityStability([-5, 10, 15]), RangeError);
    });
  });
});

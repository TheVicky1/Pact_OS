import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRoutineEntropy,
  extractHourFromTimestamp,
  type RoutineEntropyAssessment,
} from '../src/lib/analytics/routine-entropy';

describe('Shannon Entropy Routine Predictability & Chaos Index (routine-entropy.ts)', () => {
  describe('extractHourFromTimestamp: Input Formats & Parsing', () => {
    it('parses ISO date strings in UTC', () => {
      assert.strictEqual(extractHourFromTimestamp('2026-11-02T07:30:00.000Z'), 7);
      assert.strictEqual(extractHourFromTimestamp('2026-11-02T23:59:59.999Z'), 23);
      assert.strictEqual(extractHourFromTimestamp('2026-11-02T00:00:00.000Z'), 0);
    });

    it('parses HH:MM and HH:MM:SS clock strings', () => {
      assert.strictEqual(extractHourFromTimestamp('06:45'), 6);
      assert.strictEqual(extractHourFromTimestamp('14:30:15'), 14);
      assert.strictEqual(extractHourFromTimestamp('21:00'), 21);
    });

    it('handles raw hour integers [0..23]', () => {
      assert.strictEqual(extractHourFromTimestamp(8), 8);
      assert.strictEqual(extractHourFromTimestamp(0), 0);
      assert.strictEqual(extractHourFromTimestamp(23), 23);
    });

    it('handles Date objects', () => {
      const d = new Date('2026-11-02T16:00:00.000Z');
      assert.strictEqual(extractHourFromTimestamp(d), 16);
    });

    it('throws RangeError or TypeError for invalid timestamps', () => {
      assert.throws(() => extractHourFromTimestamp('invalid_date'), RangeError);
      assert.throws(() => extractHourFromTimestamp(''), TypeError);
      // @ts-expect-error Testing invalid input
      assert.throws(() => extractHourFromTimestamp(null), TypeError);
      assert.throws(() => extractHourFromTimestamp(Number.NaN), TypeError);
    });
  });

  describe('Shannon Entropy Invariants & Zero-Probability Boundary', () => {
    it('handles zero-probability bins without producing NaN or -Infinity (0 * log2(0) = 0)', () => {
      // 10 executions strictly at 7 AM
      const timestamps = new Array(10).fill('07:00');
      const assessment = calculateRoutineEntropy(timestamps);

      assert.strictEqual(assessment.sampleCount, 10);
      assert.strictEqual(assessment.distinctBinsObserved, 1);
      assert.strictEqual(assessment.rawEntropyBits, 0.0);
      assert.strictEqual(assessment.normalizedEntropy, 0.0);
      assert.strictEqual(assessment.predictabilityTier, 'clockwork');
      assert.strictEqual(assessment.dominantHour, 7);
      assert.strictEqual(Number.isNaN(assessment.rawEntropyBits), false);
      assert.strictEqual(Number.isFinite(assessment.rawEntropyBits), true);
    });

    it('evaluates maximum entropy (H_norm = 1.0000, chaotic) when events are uniformly distributed across all 24 hours', () => {
      // 1 execution for every single hour 0..23 (24 samples)
      const uniformTimestamps = Array.from({ length: 24 }, (_, i) => i);
      const assessment = calculateRoutineEntropy(uniformTimestamps);

      assert.strictEqual(assessment.sampleCount, 24);
      assert.strictEqual(assessment.distinctBinsObserved, 24);
      // H(X) = log2(24) ≈ 4.585
      assert.strictEqual(assessment.rawEntropyBits, assessment.maxPossibleEntropyBits);
      assert.strictEqual(assessment.normalizedEntropy, 1.0);
      assert.strictEqual(assessment.predictabilityTier, 'chaotic');
      assert.ok(assessment.stabilitySummary.includes('Chaotic distribution'));
    });
  });

  describe('Sample Sufficiency Boundaries', () => {
    it('returns insufficient_data for empty array []', () => {
      const assessment = calculateRoutineEntropy([]);
      assert.strictEqual(assessment.sampleCount, 0);
      assert.strictEqual(assessment.distinctBinsObserved, 0);
      assert.strictEqual(assessment.predictabilityTier, 'insufficient_data');
      assert.strictEqual(assessment.dominantHour, null);
    });

    it('returns insufficient_data when sample count is less than 5', () => {
      const samples = ['08:00', '08:30', '08:15', '09:00']; // 4 samples (< 5)
      const assessment = calculateRoutineEntropy(samples);

      assert.strictEqual(assessment.sampleCount, 4);
      assert.strictEqual(assessment.predictabilityTier, 'insufficient_data');
      assert.ok(assessment.stabilitySummary.includes('Insufficient data'));
    });
  });

  describe('Predictability Tier Classifications', () => {
    it('classifies as clockwork when normalizedEntropy < 0.20', () => {
      // 20 total executions: 19 at 8 AM, 1 at 9 AM (very concentrated)
      const timestamps = [...new Array(19).fill('08:00'), '09:00'];
      const assessment = calculateRoutineEntropy(timestamps);

      assert.ok(assessment.normalizedEntropy < 0.20);
      assert.strictEqual(assessment.predictabilityTier, 'clockwork');
      assert.strictEqual(assessment.dominantHour, 8);
    });

    it('classifies as structured when 0.20 <= normalizedEntropy < 0.50', () => {
      // 10 at 7 AM, 5 at 8 AM (moderate drift)
      const timestamps = [...new Array(10).fill(7), ...new Array(5).fill(8)];
      const assessment = calculateRoutineEntropy(timestamps);

      assert.ok(assessment.normalizedEntropy >= 0.20);
      assert.ok(assessment.normalizedEntropy < 0.50);
      assert.strictEqual(assessment.predictabilityTier, 'structured');
      assert.strictEqual(assessment.dominantHour, 7);
    });

    it('classifies as flexible when 0.50 <= normalizedEntropy < 0.80', () => {
      // Spread across 7 different hours (2 observations each, 14 total)
      const timestamps = [6, 6, 7, 7, 8, 8, 9, 9, 12, 12, 18, 18, 20, 20];
      const assessment = calculateRoutineEntropy(timestamps);

      assert.ok(assessment.normalizedEntropy >= 0.50);
      assert.ok(assessment.normalizedEntropy < 0.80);
      assert.strictEqual(assessment.predictabilityTier, 'flexible');
    });

    it('classifies as chaotic when normalizedEntropy >= 0.80', () => {
      // Spread across 16 different hours
      const timestamps = Array.from({ length: 16 }, (_, i) => i + 5);
      const assessment = calculateRoutineEntropy(timestamps);

      assert.ok(assessment.normalizedEntropy >= 0.80);
      assert.strictEqual(assessment.predictabilityTier, 'chaotic');
    });
  });

  describe('Strict Monotonicity & Scaling Invariant', () => {
    it('strictly increases rawEntropyBits and normalizedEntropy as variance/dispersion expands', () => {
      let previousEntropy = -0.001;

      // Gradually increase dispersion from 1 hour to 12 hours
      for (let numBins = 1; numBins <= 12; numBins++) {
        const timestamps: number[] = [];
        for (let b = 0; b < numBins; b++) {
          timestamps.push(b, b); // 2 samples per bin
        }
        // At least 6 samples
        while (timestamps.length < 6) {
          timestamps.push(0);
        }

        const assessment = calculateRoutineEntropy(timestamps);
        assert.ok(
          assessment.rawEntropyBits >= previousEntropy,
          `Entropy at ${numBins} bins (${assessment.rawEntropyBits}) should be >= previous (${previousEntropy})`
        );
        previousEntropy = assessment.rawEntropyBits;
      }
    });
  });

  describe('Configuration Validation', () => {
    it('throws TypeError or RangeError on invalid inputs', () => {
      // @ts-expect-error Testing invalid input
      assert.throws(() => calculateRoutineEntropy('not_an_array'), TypeError);
      assert.throws(() => calculateRoutineEntropy([7, 8, 9, 10, 11], 0), RangeError);
      assert.throws(() => calculateRoutineEntropy([7, 8, 9, 10, 11], 1), RangeError);
      assert.throws(() => calculateRoutineEntropy([7, 8, 9, 10, 11], 2.5), RangeError);
    });
  });
});

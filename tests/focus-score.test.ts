import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyFocusScore,
  DailyFocusMetrics,
  DailyFocusAssessment,
  FocusTier,
} from '../src/lib/analytics/focus-score';

describe('Daily Focus Score & Work Allocation Analytics (focus-score.ts)', () => {
  describe('1. Baseline Calculations & Invariants', () => {
    it('returns score 0 and tier "unfocused" when there is zero work tracked', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 0,
        shallowWorkMinutes: 0,
        interruptionCount: 0,
      });

      assert.strictEqual(assessment.score, 0);
      assert.strictEqual(assessment.deepWorkRatio, 0.0);
      assert.strictEqual(assessment.interruptionPenalty, 0);
      assert.strictEqual(assessment.tier, 'unfocused');
      assert.ok(assessment.summary.length > 0);
    });

    it('returns perfect 100 score and tier "optimal" for full target deep work without interruptions', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 0,
        interruptionCount: 0,
      });

      assert.strictEqual(assessment.score, 100);
      assert.strictEqual(assessment.deepWorkRatio, 1.0);
      assert.strictEqual(assessment.interruptionPenalty, 0);
      assert.strictEqual(assessment.tier, 'optimal');
    });

    it('clamps volume score to 70 when deep work exceeds the target', () => {
      // 360m deep work against 240m default target: (360/240)*70 = 105, capped at 70
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 360,
        shallowWorkMinutes: 0,
        interruptionCount: 0,
      });

      assert.strictEqual(assessment.score, 100);
      assert.strictEqual(assessment.deepWorkRatio, 1.0);
      assert.strictEqual(assessment.tier, 'optimal');
    });

    it('respects a custom targetDeepWorkMinutes', () => {
      // Custom target of 120 minutes (2 hours)
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 120,
        shallowWorkMinutes: 0,
        interruptionCount: 0,
        targetDeepWorkMinutes: 120,
      });

      assert.strictEqual(assessment.score, 100);
      assert.strictEqual(assessment.deepWorkRatio, 1.0);
      assert.strictEqual(assessment.tier, 'optimal');
    });

    it('rounds deepWorkRatio to exactly 2 decimal places without IEEE 754 precision artifacts', () => {
      // 100 deep / 300 total = 0.333333... -> 0.33
      const assessment1 = calculateDailyFocusScore({
        deepWorkMinutes: 100,
        shallowWorkMinutes: 200,
        interruptionCount: 0,
      });
      assert.strictEqual(assessment1.deepWorkRatio, 0.33);

      // 200 deep / 300 total = 0.666666... -> 0.67
      const assessment2 = calculateDailyFocusScore({
        deepWorkMinutes: 200,
        shallowWorkMinutes: 100,
        interruptionCount: 0,
      });
      assert.strictEqual(assessment2.deepWorkRatio, 0.67);
    });

    it('correctly rounds decimal ties using decimal exponent shifting (e.g. 0.145 -> 0.15)', () => {
      // 145 deep / 1000 total = 0.145 -> rounds to 0.15
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 145,
        shallowWorkMinutes: 855,
        interruptionCount: 0,
        targetDeepWorkMinutes: 156,
      });

      assert.strictEqual(assessment.deepWorkRatio, 0.15);
      // Volume = (145/156)*70 = 65.064, Quality = 0.15 * 30 = 4.5 -> sum = 69.564 -> rounds to 70
      assert.strictEqual(assessment.score, 70);
      assert.strictEqual(assessment.tier, 'productive');
    });

    it('always produces an integer composite score', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 147,
        shallowWorkMinutes: 53,
        interruptionCount: 3,
      });

      assert.strictEqual(Number.isInteger(assessment.score), true);
    });
  });

  describe('2. Interruption Penalty Invariants', () => {
    it('applies 3 penalty points per interruption', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 0,
        interruptionCount: 4,
      });

      assert.strictEqual(assessment.interruptionPenalty, 12);
      // 70 (vol) + 30 (quality) - 12 (penalty) = 88
      assert.strictEqual(assessment.score, 88);
      assert.strictEqual(assessment.tier, 'optimal');
    });

    it('caps the interruption penalty strictly at 25 points', () => {
      // 9 interruptions * 3 = 27 -> capped at 25
      const assessment9 = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 0,
        interruptionCount: 9,
      });
      assert.strictEqual(assessment9.interruptionPenalty, 25);
      // 70 + 30 - 25 = 75
      assert.strictEqual(assessment9.score, 75);
      assert.strictEqual(assessment9.tier, 'productive');

      // 50 interruptions -> still capped at 25
      const assessment50 = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 0,
        interruptionCount: 50,
      });
      assert.strictEqual(assessment50.interruptionPenalty, 25);
    });

    it('does not describe capped high interruptions as manageable in takeaway summary', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 0,
        interruptionCount: 50,
      });

      assert.strictEqual(assessment.score, 75);
      assert.strictEqual(assessment.tier, 'productive');
      assert.strictEqual(assessment.summary.includes('manageable'), false);
      assert.ok(assessment.summary.includes('50 interruptions'));
    });

    it('clamps the composite score to a minimum of 0 when penalties exceed accumulated score', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 10,
        shallowWorkMinutes: 120,
        interruptionCount: 20,
      });

      // Volume = (10/240)*70 = 2.916, Quality = (10/130)*30 = 0.08 * 30 = 2.4, Penalty = 25
      // Raw ~ -19.68 -> Clamped to 0
      assert.strictEqual(assessment.score, 0);
      assert.strictEqual(assessment.interruptionPenalty, 25);
      assert.strictEqual(assessment.tier, 'unfocused');
    });

    it('clamps the composite score to a maximum of 100', () => {
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 480,
        shallowWorkMinutes: 0,
        interruptionCount: 0,
      });

      assert.strictEqual(assessment.score, 100);
    });
  });

  describe('3. Focus Tier Classifications', () => {
    it('classifies score >= 85 as "optimal"', () => {
      // 240 deep, 240 target, 30 shallow, 1 interruption
      // total = 270, ratio = 240/270 = 0.89
      // vol = 70, quality = 0.89 * 30 = 26.7, penalty = 3
      // sum = 93.7 -> round 94 -> 'optimal'
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 30,
        interruptionCount: 1,
      });
      assert.strictEqual(assessment.tier, 'optimal');
      assert.ok(assessment.score >= 85);
    });

    it('classifies 70 <= score < 85 as "productive"', () => {
      // 200 deep, 240 target, 60 shallow, 2 interruptions
      // total = 260, ratio = 200/260 = 0.77
      // vol = (200/240)*70 = 58.333, quality = 0.77 * 30 = 23.1, penalty = 6
      // sum = 58.333 + 23.1 - 6 = 75.433 -> round 75 -> 'productive'
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 200,
        shallowWorkMinutes: 60,
        interruptionCount: 2,
      });
      assert.strictEqual(assessment.tier, 'productive');
      assert.ok(assessment.score >= 70 && assessment.score < 85);
    });

    it('classifies 50 <= score < 70 as "fragmented"', () => {
      // 150 deep, 240 target, 120 shallow, 4 interruptions
      // total = 270, ratio = 150/270 = 0.56
      // vol = (150/240)*70 = 43.75, quality = 0.56 * 30 = 16.8, penalty = 12
      // sum = 43.75 + 16.8 - 12 = 48.55 -> wait, let's adjust to be in 50..69
      // with 2 interruptions: sum = 43.75 + 16.8 - 6 = 54.55 -> round 55
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 150,
        shallowWorkMinutes: 120,
        interruptionCount: 2,
      });
      assert.strictEqual(assessment.tier, 'fragmented');
      assert.ok(assessment.score >= 50 && assessment.score < 70);
    });

    it('classifies score < 50 as "unfocused"', () => {
      // 60 deep, 240 target, 180 shallow, 5 interruptions
      // total = 240, ratio = 60/240 = 0.25
      // vol = (60/240)*70 = 17.5, quality = 0.25 * 30 = 7.5, penalty = 15
      // sum = 17.5 + 7.5 - 15 = 10 -> 'unfocused'
      const assessment = calculateDailyFocusScore({
        deepWorkMinutes: 60,
        shallowWorkMinutes: 180,
        interruptionCount: 5,
      });
      assert.strictEqual(assessment.tier, 'unfocused');
      assert.ok(assessment.score < 50);
    });

    it('generates informative takeaway summary for each tier', () => {
      const optimal = calculateDailyFocusScore({
        deepWorkMinutes: 240,
        shallowWorkMinutes: 0,
        interruptionCount: 0,
      });
      assert.ok(optimal.summary.includes('Optimal focus'));

      const productive = calculateDailyFocusScore({
        deepWorkMinutes: 200,
        shallowWorkMinutes: 60,
        interruptionCount: 2,
      });
      assert.ok(productive.summary.includes('Productive session'));

      const fragmented = calculateDailyFocusScore({
        deepWorkMinutes: 150,
        shallowWorkMinutes: 120,
        interruptionCount: 2,
      });
      assert.ok(fragmented.summary.includes('Fragmented focus'));

      const unfocused = calculateDailyFocusScore({
        deepWorkMinutes: 30,
        shallowWorkMinutes: 180,
        interruptionCount: 6,
      });
      assert.ok(unfocused.summary.includes('Unfocused session'));
    });
  });

  describe('4. Input Validation & Error Boundaries', () => {
    it('throws TypeError if metrics is not an object', () => {
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore(null), TypeError);
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore(undefined), TypeError);
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore('invalid'), TypeError);
    });

    it('throws TypeError if any metric is not a finite number', () => {
      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: '120', shallowWorkMinutes: 0, interruptionCount: 0 }), TypeError);
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: NaN, shallowWorkMinutes: 0, interruptionCount: 0 }), TypeError);
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: Infinity, shallowWorkMinutes: 0, interruptionCount: 0 }), TypeError);

      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: null, interruptionCount: 0 }), TypeError);
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: NaN, interruptionCount: 0 }), TypeError);

      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: undefined }), TypeError);
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: NaN }), TypeError);

      // @ts-expect-error Testing invalid runtime input
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 0, targetDeepWorkMinutes: '240' }), TypeError);
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 0, targetDeepWorkMinutes: NaN }), TypeError);
      assert.throws(() => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 0, targetDeepWorkMinutes: Infinity }), TypeError);
    });

    it('throws TypeError if interruptionCount is a fractional number', () => {
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 0.5 }),
        TypeError
      );
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 2.7 }),
        TypeError
      );
    });

    it('throws RangeError if any metric is negative', () => {
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: -1, shallowWorkMinutes: 0, interruptionCount: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: 0, shallowWorkMinutes: -10, interruptionCount: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: 0, shallowWorkMinutes: 0, interruptionCount: -5 }),
        RangeError
      );
    });

    it('throws RangeError if targetDeepWorkMinutes is <= 0', () => {
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 0, targetDeepWorkMinutes: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateDailyFocusScore({ deepWorkMinutes: 120, shallowWorkMinutes: 0, interruptionCount: 0, targetDeepWorkMinutes: -60 }),
        RangeError
      );
    });
  });
});


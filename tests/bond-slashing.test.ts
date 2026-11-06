import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSlashingPenalty,
  evaluateComebackStrikeReduction,
  DEFAULT_SLASHING_POLICY,
  type SlashingPolicy,
} from '../src/lib/finance/bond-slashing';

describe('Bond Slashing & Strike Reduction Engine', () => {
  describe('DEFAULT_SLASHING_POLICY', () => {
    it('defines expected default policy values', () => {
      assert.deepEqual(DEFAULT_SLASHING_POLICY.penaltyTiersPercentage, [0, 10, 25, 50, 100]);
      assert.equal(DEFAULT_SLASHING_POLICY.charitySplitFraction, 0.8);
      assert.equal(DEFAULT_SLASHING_POLICY.comebackStreakForReset, 7);
    });
  });

  describe('calculateSlashingPenalty', () => {
    it('handles 0 consecutive breaches with zero penalty and intact bond', () => {
      const staked = 10000;
      const result = calculateSlashingPenalty(staked, 0);

      assert.equal(result.currentStrikeCount, 0);
      assert.equal(result.penaltyPercentage, 0);
      assert.equal(result.slashedAmountCents, 0);
      assert.equal(result.remainingBondCents, staked);
      assert.equal(result.charityDisbursementCents, 0);
      assert.equal(result.partnerDisbursementCents, 0);
      assert.equal(result.isFullyLiquidated, false);
      assert.equal(typeof result.consequenceSummary, 'string');
      assert.ok(result.consequenceSummary.length > 0);
    });

    it('handles Strike 1 (0% grace tier in default policy)', () => {
      const staked = 10000;
      const result = calculateSlashingPenalty(staked, 1);

      assert.equal(result.currentStrikeCount, 1);
      assert.equal(result.penaltyPercentage, 0);
      assert.equal(result.slashedAmountCents, 0);
      assert.equal(result.remainingBondCents, 10000);
      assert.equal(result.charityDisbursementCents, 0);
      assert.equal(result.partnerDisbursementCents, 0);
      assert.equal(result.isFullyLiquidated, false);
      assert.ok(result.consequenceSummary.length > 0);
    });

    it('handles Strike 2 (10% tier in default policy)', () => {
      const staked = 10000;
      const result = calculateSlashingPenalty(staked, 2);

      assert.equal(result.currentStrikeCount, 2);
      assert.equal(result.penaltyPercentage, 10);
      assert.equal(result.slashedAmountCents, 1000);
      assert.equal(result.remainingBondCents, 9000);
      assert.equal(result.charityDisbursementCents, 800);
      assert.equal(result.partnerDisbursementCents, 200);
      assert.equal(result.isFullyLiquidated, false);
    });

    it('handles Strike 3 (25% tier in default policy)', () => {
      const staked = 10000;
      const result = calculateSlashingPenalty(staked, 3);

      assert.equal(result.currentStrikeCount, 3);
      assert.equal(result.penaltyPercentage, 25);
      assert.equal(result.slashedAmountCents, 2500);
      assert.equal(result.remainingBondCents, 7500);
      assert.equal(result.charityDisbursementCents, 2000);
      assert.equal(result.partnerDisbursementCents, 500);
      assert.equal(result.isFullyLiquidated, false);
    });

    it('handles Strike 4 (50% tier in default policy)', () => {
      const staked = 10000;
      const result = calculateSlashingPenalty(staked, 4);

      assert.equal(result.currentStrikeCount, 4);
      assert.equal(result.penaltyPercentage, 50);
      assert.equal(result.slashedAmountCents, 5000);
      assert.equal(result.remainingBondCents, 5000);
      assert.equal(result.charityDisbursementCents, 4000);
      assert.equal(result.partnerDisbursementCents, 1000);
      assert.equal(result.isFullyLiquidated, false);
    });

    it('handles Strike 5 (100% tier, full liquidation)', () => {
      const staked = 10000;
      const result = calculateSlashingPenalty(staked, 5);

      assert.equal(result.currentStrikeCount, 5);
      assert.equal(result.penaltyPercentage, 100);
      assert.equal(result.slashedAmountCents, 10000);
      assert.equal(result.remainingBondCents, 0);
      assert.equal(result.charityDisbursementCents, 8000);
      assert.equal(result.partnerDisbursementCents, 2000);
      assert.equal(result.isFullyLiquidated, true);
    });

    it('clamps breaches beyond max tiers (Strike 6 and Strike 10) to the final tier', () => {
      const staked = 15000;
      const strike6 = calculateSlashingPenalty(staked, 6);
      const strike10 = calculateSlashingPenalty(staked, 10);

      assert.equal(strike6.currentStrikeCount, 6);
      assert.equal(strike6.penaltyPercentage, 100);
      assert.equal(strike6.slashedAmountCents, 15000);
      assert.equal(strike6.remainingBondCents, 0);
      assert.equal(strike6.isFullyLiquidated, true);

      assert.equal(strike10.currentStrikeCount, 10);
      assert.equal(strike10.penaltyPercentage, 100);
      assert.equal(strike10.slashedAmountCents, 15000);
      assert.equal(strike10.remainingBondCents, 0);
      assert.equal(strike10.isFullyLiquidated, true);
    });

    it('preserves exact cent conservation invariants across odd amounts and fractions', () => {
      const oddStakes = [0, 1, 3, 7, 99, 101, 333, 9999, 1234567];
      const splits = [0, 0.123, 0.333333, 0.5, 0.666667, 0.8, 1];

      for (const staked of oddStakes) {
        for (let strikes = 0; strikes <= 6; strikes++) {
          for (const charitySplitFraction of splits) {
            const res = calculateSlashingPenalty(staked, strikes, {
              charitySplitFraction,
            });

            // Invariant 1: charity + partner === slashed
            assert.equal(
              res.charityDisbursementCents + res.partnerDisbursementCents,
              res.slashedAmountCents,
              `Disbursement sum mismatch for staked=${staked}, strikes=${strikes}, split=${charitySplitFraction}`
            );

            // Invariant 2: remaining + slashed === staked
            assert.equal(
              res.remainingBondCents + res.slashedAmountCents,
              staked,
              `Bond sum mismatch for staked=${staked}, strikes=${strikes}, split=${charitySplitFraction}`
            );

            // Ensure all cent values are safe integers
            assert.equal(Number.isSafeInteger(res.slashedAmountCents), true);
            assert.equal(Number.isSafeInteger(res.remainingBondCents), true);
            assert.equal(Number.isSafeInteger(res.charityDisbursementCents), true);
            assert.equal(Number.isSafeInteger(res.partnerDisbursementCents), true);
          }
        }
      }
    });

    it('supports custom SlashingPolicy with custom tiers and charitySplitFraction', () => {
      const customPolicy: Partial<SlashingPolicy> = {
        penaltyTiersPercentage: [15, 40, 100],
        charitySplitFraction: 0.75,
      };

      const strike1 = calculateSlashingPenalty(20000, 1, customPolicy);
      assert.equal(strike1.penaltyPercentage, 15);
      assert.equal(strike1.slashedAmountCents, 3000);
      assert.equal(strike1.remainingBondCents, 17000);
      assert.equal(strike1.charityDisbursementCents, 2250);
      assert.equal(strike1.partnerDisbursementCents, 750);
      assert.equal(strike1.isFullyLiquidated, false);

      const strike2 = calculateSlashingPenalty(20000, 2, customPolicy);
      assert.equal(strike2.penaltyPercentage, 40);
      assert.equal(strike2.slashedAmountCents, 8000);
      assert.equal(strike2.remainingBondCents, 12000);
      assert.equal(strike2.charityDisbursementCents, 6000);
      assert.equal(strike2.partnerDisbursementCents, 2000);
      assert.equal(strike2.isFullyLiquidated, false);

      const strike3 = calculateSlashingPenalty(20000, 3, customPolicy);
      assert.equal(strike3.penaltyPercentage, 100);
      assert.equal(strike3.slashedAmountCents, 20000);
      assert.equal(strike3.remainingBondCents, 0);
      assert.equal(strike3.isFullyLiquidated, true);
    });
  });

  describe('evaluateComebackStrikeReduction', () => {
    it('returns 0 strikes forgiven and 7 days until next forgiveness at 0 days', () => {
      const result = evaluateComebackStrikeReduction(3, 0);
      assert.deepEqual(result, {
        updatedStrikes: 3,
        strikesForgiven: 0,
        daysUntilNextForgiveness: 7,
      });
    });

    it('returns 0 strikes forgiven and 1 day until next forgiveness at 6 days', () => {
      const result = evaluateComebackStrikeReduction(3, 6);
      assert.deepEqual(result, {
        updatedStrikes: 3,
        strikesForgiven: 0,
        daysUntilNextForgiveness: 1,
      });
    });

    it('returns 1 strike forgiven and 7 days until next forgiveness at 7 days', () => {
      const result = evaluateComebackStrikeReduction(3, 7);
      assert.deepEqual(result, {
        updatedStrikes: 2,
        strikesForgiven: 1,
        daysUntilNextForgiveness: 7,
      });
    });

    it('forgives 2 strikes at 14 consecutive successful days when holding 3 strikes', () => {
      const result = evaluateComebackStrikeReduction(3, 14);
      assert.deepEqual(result, {
        updatedStrikes: 1,
        strikesForgiven: 2,
        daysUntilNextForgiveness: 7,
      });
    });

    it('clamps strikesForgiven to currentStrikes when raw forgiven exceeds currentStrikes', () => {
      const result = evaluateComebackStrikeReduction(2, 25); // 25 days = 3 raw forgiven, but only 2 strikes active
      assert.equal(result.updatedStrikes, 0);
      assert.equal(result.strikesForgiven, 2);

      const zeroStrikesResult = evaluateComebackStrikeReduction(0, 10);
      assert.equal(zeroStrikesResult.updatedStrikes, 0);
      assert.equal(zeroStrikesResult.strikesForgiven, 0);
    });

    it('respects custom comebackStreakForReset in policy', () => {
      const result = evaluateComebackStrikeReduction(4, 11, { comebackStreakForReset: 5 });
      assert.deepEqual(result, {
        updatedStrikes: 2,
        strikesForgiven: 2,
        daysUntilNextForgiveness: 4,
      });
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('throws TypeError on non-safe-integer inputs', () => {
      const invalidNumbers = [1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1];

      for (const bad of invalidNumbers) {
        assert.throws(
          () => calculateSlashingPenalty(bad, 1),
          TypeError,
          `Expected TypeError for stakedAmountCents=${bad}`
        );
        assert.throws(
          () => calculateSlashingPenalty(1000, bad),
          TypeError,
          `Expected TypeError for consecutiveBreaches=${bad}`
        );
        assert.throws(
          () => evaluateComebackStrikeReduction(bad, 5),
          TypeError,
          `Expected TypeError for currentStrikes=${bad}`
        );
        assert.throws(
          () => evaluateComebackStrikeReduction(2, bad),
          TypeError,
          `Expected TypeError for consecutiveSuccessfulDays=${bad}`
        );
      }

      // Also verify runtime string coercion defense
      assert.throws(
        () => calculateSlashingPenalty('1000' as unknown as number, 1),
        TypeError
      );
      assert.throws(
        () => evaluateComebackStrikeReduction('2' as unknown as number, 7),
        TypeError
      );
    });

    it('throws RangeError on negative numerical inputs', () => {
      assert.throws(() => calculateSlashingPenalty(-100, 1), RangeError);
      assert.throws(() => calculateSlashingPenalty(1000, -1), RangeError);
      assert.throws(() => evaluateComebackStrikeReduction(-1, 5), RangeError);
      assert.throws(() => evaluateComebackStrikeReduction(2, -5), RangeError);
    });

    it('throws RangeError on invalid charitySplitFraction (< 0 or > 1)', () => {
      assert.throws(
        () => calculateSlashingPenalty(10000, 2, { charitySplitFraction: -0.1 }),
        RangeError
      );
      assert.throws(
        () => calculateSlashingPenalty(10000, 2, { charitySplitFraction: 1.01 }),
        RangeError
      );
    });

    it('throws RangeError or TypeError on invalid comebackStreakForReset (<= 0 or non-integer)', () => {
      assert.throws(
        () => evaluateComebackStrikeReduction(2, 7, { comebackStreakForReset: 0 }),
        RangeError
      );
      assert.throws(
        () => evaluateComebackStrikeReduction(2, 7, { comebackStreakForReset: -3 }),
        RangeError
      );
      assert.throws(
        () => calculateSlashingPenalty(10000, 1, { comebackStreakForReset: 0 }),
        RangeError
      );
      assert.throws(
        () => calculateSlashingPenalty(10000, 1, { comebackStreakForReset: -5 }),
        RangeError
      );
    });
  });
});
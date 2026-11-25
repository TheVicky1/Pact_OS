import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateHeartRateRecovery, type HeartRateRecoveryInput } from "../src/lib/health/heart-rate-recovery";

describe("calculateHeartRateRecovery", () => {
  describe("recovery tiers and vagal reactivation score", () => {
    it("classifies compromised tier when drop at 60s is less than 12 bpm", () => {
      const input: HeartRateRecoveryInput = {
        peakHeartRateBpm: 180,
        heartRateAt60SecondsBpm: 169, // drop = 11 bpm -> score = Math.round((11 / 40) * 100) = 28
      };

      const result = calculateHeartRateRecovery(input);

      assert.equal(result.dropAt60sBpm, 11);
      assert.equal(result.dropAt120sBpm, null);
      assert.equal(result.vagalReactivationScore, 28);
      assert.equal(result.recoveryTier, "compromised");
      assert.match(result.trainingReadinessRecommendation, /compromised|autonomic fatigue/i);
    });

    it("classifies fair tier when drop at 60s is between 12 and 20 bpm inclusive", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 180,
        heartRateAt60SecondsBpm: 164, // drop = 16 bpm -> score = 40
      });

      assert.equal(result.dropAt60sBpm, 16);
      assert.equal(result.dropAt120sBpm, null);
      assert.equal(result.vagalReactivationScore, 40);
      assert.equal(result.recoveryTier, "fair");
    });

    it("classifies good tier when drop at 60s is between 21 and 35 bpm inclusive", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 185,
        heartRateAt60SecondsBpm: 157, // drop = 28 bpm -> score = 70
      });

      assert.equal(result.dropAt60sBpm, 28);
      assert.equal(result.dropAt120sBpm, null);
      assert.equal(result.vagalReactivationScore, 70);
      assert.equal(result.recoveryTier, "good");
    });

    it("classifies exceptional tier when drop at 60s is greater than 35 bpm and caps score at 100", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 190,
        heartRateAt60SecondsBpm: 140, // drop = 50 bpm -> capped at 100
      });

      assert.equal(result.dropAt60sBpm, 50);
      assert.equal(result.dropAt120sBpm, null);
      assert.equal(result.vagalReactivationScore, 100);
      assert.equal(result.recoveryTier, "exceptional");
    });
  });

  describe("boundary values for 60s drop", () => {
    it("handles boundary drop of 12 bpm as fair", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 170,
        heartRateAt60SecondsBpm: 158, // drop = 12 -> score = 30
      });

      assert.equal(result.dropAt60sBpm, 12);
      assert.equal(result.recoveryTier, "fair");
      assert.equal(result.vagalReactivationScore, 30);
    });

    it("handles boundary drop of 20 bpm as fair and 21 bpm as good", () => {
      const fairBoundary = calculateHeartRateRecovery({
        peakHeartRateBpm: 170,
        heartRateAt60SecondsBpm: 150, // drop = 20 -> score = 50
      });
      const goodBoundary = calculateHeartRateRecovery({
        peakHeartRateBpm: 170,
        heartRateAt60SecondsBpm: 149, // drop = 21 -> score = 53
      });

      assert.equal(fairBoundary.dropAt60sBpm, 20);
      assert.equal(fairBoundary.recoveryTier, "fair");
      assert.equal(fairBoundary.vagalReactivationScore, 50);

      assert.equal(goodBoundary.dropAt60sBpm, 21);
      assert.equal(goodBoundary.recoveryTier, "good");
      assert.equal(goodBoundary.vagalReactivationScore, 53);
    });

    it("handles boundary drop of 35 bpm as good and 36 bpm as exceptional", () => {
      const goodBoundary = calculateHeartRateRecovery({
        peakHeartRateBpm: 180,
        heartRateAt60SecondsBpm: 145, // drop = 35 -> score = 88
      });
      const exceptionalBoundary = calculateHeartRateRecovery({
        peakHeartRateBpm: 180,
        heartRateAt60SecondsBpm: 144, // drop = 36 -> score = 90
      });

      assert.equal(goodBoundary.dropAt60sBpm, 35);
      assert.equal(goodBoundary.recoveryTier, "good");
      assert.equal(goodBoundary.vagalReactivationScore, 88);

      assert.equal(exceptionalBoundary.dropAt60sBpm, 36);
      assert.equal(exceptionalBoundary.recoveryTier, "exceptional");
      assert.equal(exceptionalBoundary.vagalReactivationScore, 90);
    });

    it("handles 0 bpm drop with score clamped to 0", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 165,
        heartRateAt60SecondsBpm: 165, // drop = 0 -> score = 0
      });

      assert.equal(result.dropAt60sBpm, 0);
      assert.equal(result.vagalReactivationScore, 0);
      assert.equal(result.recoveryTier, "compromised");
    });
  });

  describe("optional heartRateAt120SecondsBpm", () => {
    it("calculates dropAt120sBpm and includes it in the recommendation when provided", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 182,
        heartRateAt60SecondsBpm: 155, // drop = 27
        heartRateAt120SecondsBpm: 132, // drop = 50
      });

      assert.equal(result.dropAt60sBpm, 27);
      assert.equal(result.dropAt120sBpm, 50);
      assert.match(result.trainingReadinessRecommendation, /120s drop: 50 bpm/);
    });

    it("returns null for dropAt120sBpm when omitted", () => {
      const result = calculateHeartRateRecovery({
        peakHeartRateBpm: 175,
        heartRateAt60SecondsBpm: 150,
      });

      assert.equal(result.dropAt120sBpm, null);
      assert.doesNotMatch(result.trainingReadinessRecommendation, /120s drop/);
    });
  });

  describe("input validation", () => {
    it("throws TypeError on non-finite numbers", () => {
      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: Number.NaN,
            heartRateAt60SecondsBpm: 150,
          }),
        TypeError,
      );

      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 180,
            heartRateAt60SecondsBpm: Number.POSITIVE_INFINITY,
          }),
        TypeError,
      );

      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 180,
            heartRateAt60SecondsBpm: 150,
            heartRateAt120SecondsBpm: Number.NaN,
          }),
        TypeError,
      );
    });

    it("throws RangeError when heart rates are outside 60 to 240 bpm", () => {
      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 59,
            heartRateAt60SecondsBpm: 50,
          }),
        RangeError,
      );

      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 245,
            heartRateAt60SecondsBpm: 180,
          }),
        RangeError,
      );

      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 180,
            heartRateAt60SecondsBpm: 59,
          }),
        RangeError,
      );

      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 180,
            heartRateAt60SecondsBpm: 150,
            heartRateAt120SecondsBpm: 55,
          }),
        RangeError,
      );
    });

    it("throws RangeError when 60s or 120s heart rate exceeds peak heart rate", () => {
      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 160,
            heartRateAt60SecondsBpm: 165,
          }),
        RangeError,
      );

      assert.throws(
        () =>
          calculateHeartRateRecovery({
            peakHeartRateBpm: 175,
            heartRateAt60SecondsBpm: 150,
            heartRateAt120SecondsBpm: 180,
          }),
        RangeError,
      );
    });
  });
});

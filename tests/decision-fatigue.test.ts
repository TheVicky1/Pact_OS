import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDecisionFatigue,
  assessNextDecisionCapacity,
  resolveDecisionBudgetConfig,
  determineFatigueZone,
  DEFAULT_DECISION_BUDGET_CONFIG,
  DEFAULT_COMPLEXITY_WEIGHTS,
  type DecisionRecord,
} from '../src/lib/discipline/decision-fatigue.ts';

describe('Decision Fatigue Index & Daily Choice Budget Allocator (decision-fatigue.ts)', () => {
  describe('resolveDecisionBudgetConfig: Invariants & Boundaries', () => {
    it('returns default 100 daily points when no config provided', () => {
      const config = resolveDecisionBudgetConfig();
      assert.strictEqual(config.dailyBudgetPoints, DEFAULT_DECISION_BUDGET_CONFIG.dailyBudgetPoints);
      assert.deepStrictEqual(config.complexityWeights, DEFAULT_COMPLEXITY_WEIGHTS);
    });

    it('merges custom daily budget and weight overrides', () => {
      const config = resolveDecisionBudgetConfig({
        dailyBudgetPoints: 150,
        complexityWeights: {
          ...DEFAULT_COMPLEXITY_WEIGHTS,
          high_stakes_tradeoff: 30,
        },
      });
      assert.strictEqual(config.dailyBudgetPoints, 150);
      assert.strictEqual(config.complexityWeights?.high_stakes_tradeoff, 30);
      assert.strictEqual(config.complexityWeights?.trivial, 1);
    });

    it('throws RangeError for non-positive, zero, or fractional budget points', () => {
      assert.throws(() => resolveDecisionBudgetConfig({ dailyBudgetPoints: 0 }), RangeError);
      assert.throws(() => resolveDecisionBudgetConfig({ dailyBudgetPoints: -50 }), RangeError);
      assert.throws(() => resolveDecisionBudgetConfig({ dailyBudgetPoints: 99.5 }), RangeError);
    });

    it('throws TypeError for non-number or NaN budget points', () => {
      // @ts-expect-error Testing invalid input
      assert.throws(() => resolveDecisionBudgetConfig({ dailyBudgetPoints: '100' }), TypeError);
      assert.throws(() => resolveDecisionBudgetConfig({ dailyBudgetPoints: Number.NaN }), TypeError);
      // @ts-expect-error Testing invalid input
      assert.throws(() => resolveDecisionBudgetConfig({ dailyBudgetPoints: null }), TypeError);
    });
  });

  describe('determineFatigueZone: Threshold Mapping', () => {
    it('maps >= 70% to optimal', () => {
      const res = determineFatigueZone(70);
      assert.strictEqual(res.zone, 'optimal');
      assert.strictEqual(res.canTakeHighStakesTask, true);
      assert.strictEqual(res.recommendedAction, 'tackle_hard_pact');
    });

    it('maps 40% to 69% to moderate_load', () => {
      const res69 = determineFatigueZone(69);
      assert.strictEqual(res69.zone, 'moderate_load');
      assert.strictEqual(res69.canTakeHighStakesTask, true);

      const res40 = determineFatigueZone(40);
      assert.strictEqual(res40.zone, 'moderate_load');
    });

    it('maps 15% to 39% to elevated_fatigue and restricts high stakes', () => {
      const res = determineFatigueZone(25);
      assert.strictEqual(res.zone, 'elevated_fatigue');
      assert.strictEqual(res.canTakeHighStakesTask, false);
      assert.strictEqual(res.recommendedAction, 'defer_critical_decisions');
    });

    it('maps < 15% to vulnerability_danger_zone', () => {
      const res = determineFatigueZone(14);
      assert.strictEqual(res.zone, 'vulnerability_danger_zone');
      assert.strictEqual(res.canTakeHighStakesTask, false);
      assert.strictEqual(res.recommendedAction, 'defer_critical_decisions');
    });
  });

  describe('calculateDecisionFatigue: Input Validation & Edge Cases', () => {
    it('returns 100% optimal capacity for empty decisions array', () => {
      const res = calculateDecisionFatigue([]);
      assert.strictEqual(res.totalDecisionsCount, 0);
      assert.strictEqual(res.consumedPoints, 0);
      assert.strictEqual(res.dailyBudgetPoints, 100);
      assert.strictEqual(res.budgetRemainingPoints, 100);
      assert.strictEqual(res.budgetRemainingPercentage, 100);
      assert.strictEqual(res.fatigueZone, 'optimal');
      assert.strictEqual(res.canTakeHighStakesTask, true);
      assert.strictEqual(res.recommendedAction, 'tackle_hard_pact');
    });

    it('throws TypeError when decisions parameter is not an array', () => {
      // @ts-expect-error Testing invalid input
      assert.throws(() => calculateDecisionFatigue(null), TypeError);
      // @ts-expect-error Testing invalid input
      assert.throws(() => calculateDecisionFatigue(undefined), TypeError);
      // @ts-expect-error Testing invalid input
      assert.throws(() => calculateDecisionFatigue({}), TypeError);
    });

    it('throws TypeError or RangeError for malformed decision records', () => {
      // @ts-expect-error Testing invalid input
      assert.throws(() => calculateDecisionFatigue([null]), TypeError);
      assert.throws(() => calculateDecisionFatigue([{ description: '', complexity: 'trivial' }]), TypeError);
      // @ts-expect-error Testing invalid complexity
      assert.throws(() => calculateDecisionFatigue([{ description: 'test', complexity: 'impossible' }]), RangeError);
    });
  });

  describe('calculateDecisionFatigue: Complex Scenarios & Point Depletion', () => {
    it('accurately aggregates weights across all 5 complexity tiers', () => {
      const decisions: DecisionRecord[] = [
        { description: 'Select shirt', complexity: 'trivial' },             // 1
        { description: 'Order lunch', complexity: 'routine' },              // 3
        { description: 'Plan sprints', complexity: 'moderate' },            // 7
        { description: 'Design architecture', complexity: 'complex' },       // 15
        { description: 'Sign investor pact', complexity: 'high_stakes_tradeoff' }, // 25
      ];

      const res = calculateDecisionFatigue(decisions);
      // Total consumed = 1 + 3 + 7 + 15 + 25 = 51 points
      assert.strictEqual(res.totalDecisionsCount, 5);
      assert.strictEqual(res.consumedPoints, 51);
      assert.strictEqual(res.budgetRemainingPoints, 49);
      assert.strictEqual(res.budgetRemainingPercentage, 49);
      assert.strictEqual(res.fatigueZone, 'moderate_load');
      assert.strictEqual(res.breakdownByComplexity.trivial, 1);
      assert.strictEqual(res.breakdownByComplexity.routine, 1);
      assert.strictEqual(res.breakdownByComplexity.moderate, 1);
      assert.strictEqual(res.breakdownByComplexity.complex, 1);
      assert.strictEqual(res.breakdownByComplexity.high_stakes_tradeoff, 1);
    });

    it('transitions to elevated_fatigue when consumed exceeds 60 points', () => {
      const decisions: DecisionRecord[] = [
        { description: 'High stakes 1', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'High stakes 2', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'Complex task', complexity: 'complex' },               // 15
      ];
      // Total = 65 points -> 35% remaining
      const res = calculateDecisionFatigue(decisions);
      assert.strictEqual(res.consumedPoints, 65);
      assert.strictEqual(res.budgetRemainingPercentage, 35);
      assert.strictEqual(res.fatigueZone, 'elevated_fatigue');
      assert.strictEqual(res.canTakeHighStakesTask, false);
    });

    it('clamps remaining percentage to 0% and vulnerability zone when budget exceeded', () => {
      const decisions: DecisionRecord[] = [
        { description: 'High stakes 1', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'High stakes 2', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'High stakes 3', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'High stakes 4', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'Extra decision', complexity: 'routine' },              // 3
      ];
      // Total = 103 points -> consumed > 100
      const res = calculateDecisionFatigue(decisions);
      assert.strictEqual(res.consumedPoints, 103);
      assert.strictEqual(res.budgetRemainingPoints, 0);
      assert.strictEqual(res.budgetRemainingPercentage, 0);
      assert.strictEqual(res.fatigueZone, 'vulnerability_danger_zone');
      assert.strictEqual(res.canTakeHighStakesTask, false);
    });
  });

  describe('Strict Monotonicity Invariant (Budget Consumption)', () => {
    it('strictly increases consumedPoints and decreases remainingPercentage monotonically', () => {
      const decisionsList: DecisionRecord[] = [
        { description: 'D1', complexity: 'trivial' },
        { description: 'D2', complexity: 'routine' },
        { description: 'D3', complexity: 'moderate' },
        { description: 'D4', complexity: 'complex' },
        { description: 'D5', complexity: 'high_stakes_tradeoff' },
        { description: 'D6', complexity: 'high_stakes_tradeoff' },
        { description: 'D7', complexity: 'high_stakes_tradeoff' },
      ];

      let previousConsumed = 0;
      let previousRemainingPct = 100;

      for (let i = 1; i <= decisionsList.length; i++) {
        const slice = decisionsList.slice(0, i);
        const res = calculateDecisionFatigue(slice);

        assert.ok(
          res.consumedPoints >= previousConsumed,
          `Consumed points at step ${i} (${res.consumedPoints}) must be >= previous (${previousConsumed})`
        );
        assert.ok(
          res.budgetRemainingPercentage <= previousRemainingPct,
          `Remaining percentage at step ${i} (${res.budgetRemainingPercentage}) must be <= previous (${previousRemainingPct})`
        );

        previousConsumed = res.consumedPoints;
        previousRemainingPct = res.budgetRemainingPercentage;
      }
    });
  });

  describe('assessNextDecisionCapacity: Predictive Capacity Checker', () => {
    it('permits complex tasks when ample cognitive capacity remains', () => {
      const assessment = calculateDecisionFatigue([
        { description: 'Coffee choice', complexity: 'trivial' },
      ]); // 1 pt consumed, 99% remaining

      const result = assessNextDecisionCapacity(assessment, 'high_stakes_tradeoff');
      assert.strictEqual(result.canProceed, true);
      assert.strictEqual(result.projectedConsumedPoints, 26);
      assert.strictEqual(result.projectedRemainingPercentage, 74);
      assert.strictEqual(result.projectedZone, 'optimal');
      assert.strictEqual(result.warning, undefined);
    });

    it('blocks high-stakes tasks when projected into fatigue zones', () => {
      const assessment = calculateDecisionFatigue([
        { description: 'P1', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'P2', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'P3', complexity: 'complex' },               // 15 -> 65 consumed (35% remaining)
      ]);

      const result = assessNextDecisionCapacity(assessment, 'high_stakes_tradeoff');
      // 65 + 25 = 90 -> 10% remaining (vulnerability zone)
      assert.strictEqual(result.canProceed, false);
      assert.ok(result.warning?.includes('restricts'));
    });

    it('rejects candidate decision when projected points exceed budget', () => {
      const assessment = calculateDecisionFatigue([
        { description: 'A1', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'A2', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'A3', complexity: 'high_stakes_tradeoff' }, // 25
        { description: 'A4', complexity: 'complex' },               // 15 -> 90 consumed (10% left)
      ]);

      const result = assessNextDecisionCapacity(assessment, 'complex'); // 90 + 15 = 105 (> 100)
      assert.strictEqual(result.canProceed, false);
      assert.ok(result.warning?.includes('Exceeds daily decision budget'));
    });

    it('throws TypeError or RangeError on invalid parameters', () => {
      // @ts-expect-error Testing invalid input
      assert.throws(() => assessNextDecisionCapacity(null, 'routine'), TypeError);
      const assessment = calculateDecisionFatigue([]);
      // @ts-expect-error Testing invalid complexity
      assert.throws(() => assessNextDecisionCapacity(assessment, 'invalid_choice'), RangeError);
    });
  });
});

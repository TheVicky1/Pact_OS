import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCognitiveRamping,
  MAX_ELAPSED_SECONDS,
} from '../src/lib/focus/cognitive-ramping';

describe('evaluateCognitiveRamping (Heuristic Verification Suite)', () => {
  it('evaluates initial baseline state at t = 0', () => {
    const state = evaluateCognitiveRamping(0);
    assert.equal(state.elapsedSeconds, 0);
    assert.ok(state.flowProbabilityFraction <= 0.05, 'Baseline probability should be <= 0.05');
    assert.ok(state.resistanceScore >= 95, 'Baseline resistance should be >= 95');
    assert.equal(state.activeStage, 'initial_resistance');
    assert.equal(state.isFragileRampingWindow, true);
    assert.equal(state.shieldingRecommendation, 'strict_dnd_shield');
    assert.ok(state.encouragementCue.length > 0, 'Should provide an encouragement cue');
  });

  it('safely normalizes negative, NaN, and extreme non-finite elapsed times', () => {
    // Negative values and NaN normalize to 0
    assert.equal(evaluateCognitiveRamping(-120).elapsedSeconds, 0);
    assert.equal(evaluateCognitiveRamping(NaN).elapsedSeconds, 0);
    assert.equal(evaluateCognitiveRamping(-Infinity).elapsedSeconds, 0);

    // Positive Infinity and values exceeding MAX_ELAPSED_SECONDS clamp to 86400
    assert.equal(evaluateCognitiveRamping(Infinity).elapsedSeconds, MAX_ELAPSED_SECONDS);
    assert.equal(evaluateCognitiveRamping(100000).elapsedSeconds, MAX_ELAPSED_SECONDS);
  });

  it('correctly identifies the default inflection point at exactly 10 minutes (600s)', () => {
    const state = evaluateCognitiveRamping(600);
    assert.equal(state.elapsedSeconds, 600);
    assert.equal(state.flowProbabilityFraction, 0.50);
    assert.equal(state.resistanceScore, 50);
    assert.equal(state.activeStage, 'ramping_transition');
    assert.equal(state.isFragileRampingWindow, true);
  });

  it('strictly validates stage interval boundaries and shielding recommendations', () => {
    // Boundary 1: 4m59s -> initial_resistance (< 300s)
    const s299 = evaluateCognitiveRamping(299);
    assert.equal(s299.activeStage, 'initial_resistance');
    assert.equal(s299.isFragileRampingWindow, true);
    assert.equal(s299.shieldingRecommendation, 'strict_dnd_shield');

    // Boundary 2: 5m00s -> ramping_transition (>= 300s)
    const s300 = evaluateCognitiveRamping(300);
    assert.equal(s300.activeStage, 'ramping_transition');
    assert.equal(s300.isFragileRampingWindow, true);
    assert.equal(s300.shieldingRecommendation, 'strict_dnd_shield');

    // Boundary 3: 11m59s -> ramping_transition (< 720s)
    const s719 = evaluateCognitiveRamping(719);
    assert.equal(s719.activeStage, 'ramping_transition');
    assert.equal(s719.isFragileRampingWindow, true);

    // Boundary 4: 12m00s -> flow_state_engaged (>= 720s, fragile window false)
    const s720 = evaluateCognitiveRamping(720);
    assert.equal(s720.activeStage, 'flow_state_engaged');
    assert.equal(s720.isFragileRampingWindow, false);
    assert.equal(s720.shieldingRecommendation, 'ambient_hold');

    // Boundary 5: 25m00s -> flow_state_engaged (<= 1500s)
    const s1500 = evaluateCognitiveRamping(1500);
    assert.equal(s1500.activeStage, 'flow_state_engaged');
    assert.equal(s1500.isFragileRampingWindow, false);

    // Boundary 6: 25m01s -> deep_immersion (> 1500s)
    const s1501 = evaluateCognitiveRamping(1501);
    assert.equal(s1501.activeStage, 'deep_immersion');
    assert.equal(s1501.isFragileRampingWindow, false);
    assert.equal(s1501.shieldingRecommendation, 'steady_flow');
  });

  it('maintains strict monotonic increase of probability and decrease of resistance', () => {
    const checkpoints = [0, 60, 180, 300, 450, 600, 750, 900, 1200, 1500, 1800, 3600];
    let prevProb = -1;
    let prevResistance = 101;

    for (const t of checkpoints) {
      const { flowProbabilityFraction, resistanceScore } = evaluateCognitiveRamping(t);
      assert.ok(flowProbabilityFraction >= prevProb, `Probability decreased at t=${t}`);
      assert.ok(resistanceScore <= prevResistance, `Resistance increased at t=${t}`);
      prevProb = flowProbabilityFraction;
      prevResistance = resistanceScore;
    }
  });

  it('falls back to safe defaults when options contain invalid, zero, or negative numbers', () => {
    // Negative or zero steepness should fallback to 0.35 and remain stable
    const invalidK = evaluateCognitiveRamping(600, { steepnessK: -1 });
    assert.equal(invalidK.flowProbabilityFraction, 0.50);

    const zeroK = evaluateCognitiveRamping(600, { steepnessK: 0 });
    assert.equal(zeroK.flowProbabilityFraction, 0.50);

    const nanK = evaluateCognitiveRamping(600, { steepnessK: NaN });
    assert.equal(nanK.flowProbabilityFraction, 0.50);

    // Negative or zero inflection should fallback to 10 minutes
    const negativeInflection = evaluateCognitiveRamping(600, { inflectionMinutes: -5 });
    assert.equal(negativeInflection.flowProbabilityFraction, 0.50);

    const zeroInflection = evaluateCognitiveRamping(600, { inflectionMinutes: 0 });
    assert.equal(zeroInflection.flowProbabilityFraction, 0.50);
  });

  it('handles extreme custom options gracefully without arithmetic overflow or NaN', () => {
    // Extreme steepness: should clamp and evaluate without throwing
    const extremeK = evaluateCognitiveRamping(600, { steepnessK: 10000 });
    assert.equal(Number.isFinite(extremeK.flowProbabilityFraction), true);
    assert.equal(extremeK.flowProbabilityFraction, 0.50);

    // Extreme inflection: should clamp to 1440 minutes safely
    const extremeInflection = evaluateCognitiveRamping(600, { inflectionMinutes: 50000 });
    assert.equal(Number.isFinite(extremeInflection.flowProbabilityFraction), true);
    assert.ok(extremeInflection.flowProbabilityFraction <= 0.05);

    // Very gentle steepness
    const gentleK = evaluateCognitiveRamping(600, { steepnessK: 0.001 });
    assert.equal(gentleK.flowProbabilityFraction, 0.50);
  });

  it('honors valid custom inflection and steepness parameters accurately', () => {
    // Custom inflection at 5 minutes (300s) with steepness 0.5
    const custom = evaluateCognitiveRamping(300, { inflectionMinutes: 5, steepnessK: 0.5 });
    assert.equal(custom.flowProbabilityFraction, 0.50);
    assert.equal(custom.resistanceScore, 50);
  });
});

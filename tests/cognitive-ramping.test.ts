import { describe, it, expect } from 'vitest';
import {
  evaluateCognitiveRamping,
  FlowStage,
} from '../src/lib/focus/cognitive-ramping';

describe('Cognitive Warm-up Sigmoid Ramping Curve & Flow Onset Estimator', () => {
  it('correctly models initial cognitive resistance at session start (t = 0)', () => {
    const state = evaluateCognitiveRamping(0);

    expect(state.elapsedSeconds).toBe(0);
    expect(state.activeStage).toBe('initial_resistance');
    expect(state.isFragileRampingWindow).toBe(true);
    expect(state.shieldingRecommendation).toBe('strict_dnd_shield');

    // Between 0.01 and 0.05 as per Acceptance Criteria
    expect(state.flowProbabilityFraction).toBeGreaterThanOrEqual(0.01);
    expect(state.flowProbabilityFraction).toBeLessThanOrEqual(0.05);

    // Resistance score between 95 and 100
    expect(state.resistanceScore).toBeGreaterThanOrEqual(95);
    expect(state.resistanceScore).toBeLessThanOrEqual(100);
    expect(state.encouragementCue).toContain('Initial friction is biological');
  });

  it('accurately hits the 0.50 inflection point at t = 10 minutes (600 seconds)', () => {
    const state = evaluateCognitiveRamping(600);

    expect(state.elapsedSeconds).toBe(600);
    // At exactly t0, sigmoid R(t) = 1 / (1 + e^0) = 0.50
    expect(state.flowProbabilityFraction).toBe(0.5);
    expect(state.resistanceScore).toBe(50.0);
    expect(state.activeStage).toBe('ramping_transition');
    expect(state.isFragileRampingWindow).toBe(true);
    expect(state.shieldingRecommendation).toBe('strict_dnd_shield');
  });

  it('exceeds 0.95 flow probability at t >= 20 minutes (1200 seconds)', () => {
    const state = evaluateCognitiveRamping(1200);

    expect(state.elapsedSeconds).toBe(1200);
    expect(state.flowProbabilityFraction).toBeGreaterThanOrEqual(0.95);
    expect(state.resistanceScore).toBeLessThanOrEqual(5.0);
    expect(state.activeStage).toBe('flow_state_engaged');
    expect(state.isFragileRampingWindow).toBe(false);
    expect(state.shieldingRecommendation).toBe('ambient_hold');
  });

  it('reaches deep immersion stage after 25 minutes (> 1500 seconds)', () => {
    const state = evaluateCognitiveRamping(1800); // 30 minutes

    expect(state.activeStage).toBe('deep_immersion');
    expect(state.isFragileRampingWindow).toBe(false);
    expect(state.shieldingRecommendation).toBe('steady_flow');
    expect(state.flowProbabilityFraction).toBeGreaterThan(0.99);
    expect(state.resistanceScore).toBeLessThan(1.0);
    expect(state.encouragementCue).toContain('Deep immersion achieved');
  });

  it('verifies strict monotonicity of the sigmoid curve over time', () => {
    const checkSeconds = [0, 60, 180, 300, 480, 600, 720, 900, 1200, 1500, 2000];
    const probabilities = checkSeconds.map((sec) => evaluateCognitiveRamping(sec).flowProbabilityFraction);

    for (let i = 1; i < probabilities.length; i++) {
      expect(probabilities[i]).toBeGreaterThanOrEqual(probabilities[i - 1]);
    }

    const resistances = checkSeconds.map((sec) => evaluateCognitiveRamping(sec).resistanceScore);
    for (let i = 1; i < resistances.length; i++) {
      expect(resistances[i]).toBeLessThanOrEqual(resistances[i - 1]);
    }
  });

  it('accurately transitions through all four discrete Flow Stages', () => {
    const stageCases: Array<{ seconds: number; expectedStage: FlowStage; expectedFragile: boolean }> = [
      { seconds: 120, expectedStage: 'initial_resistance', expectedFragile: true },    // 2m (< 5m)
      { seconds: 299, expectedStage: 'initial_resistance', expectedFragile: true },    // edge just under 5m
      { seconds: 300, expectedStage: 'ramping_transition', expectedFragile: true },    // exactly 5m
      { seconds: 600, expectedStage: 'ramping_transition', expectedFragile: true },    // 10m
      { seconds: 719, expectedStage: 'ramping_transition', expectedFragile: true },    // edge just under 12m
      { seconds: 720, expectedStage: 'flow_state_engaged', expectedFragile: false },   // exactly 12m
      { seconds: 1400, expectedStage: 'flow_state_engaged', expectedFragile: false },  // ~23m
      { seconds: 1500, expectedStage: 'flow_state_engaged', expectedFragile: false },  // exactly 25m boundary
      { seconds: 1501, expectedStage: 'deep_immersion', expectedFragile: false },     // just over 25m
      { seconds: 3600, expectedStage: 'deep_immersion', expectedFragile: false },     // 60m
    ];

    stageCases.forEach(({ seconds, expectedStage, expectedFragile }) => {
      const state = evaluateCognitiveRamping(seconds);
      expect(state.activeStage).toBe(expectedStage);
      expect(state.isFragileRampingWindow).toBe(expectedFragile);
    });
  });

  it('resiliently handles edge cases: negative duration, NaN, and infinity', () => {
    // Negative seconds should clamp to 0
    const negState = evaluateCognitiveRamping(-150);
    expect(negState.elapsedSeconds).toBe(0);
    expect(negState.activeStage).toBe('initial_resistance');
    expect(negState.flowProbabilityFraction).toBeGreaterThan(0);

    // NaN should clamp to 0
    const nanState = evaluateCognitiveRamping(NaN);
    expect(nanState.elapsedSeconds).toBe(0);
    expect(nanState.activeStage).toBe('initial_resistance');

    // Infinity should clamp to 0
    const infState = evaluateCognitiveRamping(Infinity);
    expect(infState.elapsedSeconds).toBe(0);
  });

  it('supports custom inflectionMinutes and steepnessK options', () => {
    // Custom inflection point at 15 minutes (900 seconds)
    const customState = evaluateCognitiveRamping(900, {
      inflectionMinutes: 15,
      steepnessK: 0.5,
    });

    expect(customState.flowProbabilityFraction).toBe(0.5);
    expect(customState.resistanceScore).toBe(50.0);
  });
});

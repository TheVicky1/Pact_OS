import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRitualProgress,
  type RitualStep,
  type RitualProgressSummary,
} from '../src/lib/rituals/progress-calculator';

describe('calculateRitualProgress utility', () => {
  it('returns default zero summary for an empty array', () => {
    const emptySteps: RitualStep[] = [];
    const expected: RitualProgressSummary = {
      totalSteps: 0,
      completedSteps: 0,
      percentage: 0,
      isComplete: false,
      nextStepIndex: -1,
    };

    assert.deepStrictEqual(calculateRitualProgress(emptySteps), expected);
  });

  it('safely handles non-array or null/undefined inputs', () => {
    const expected: RitualProgressSummary = {
      totalSteps: 0,
      completedSteps: 0,
      percentage: 0,
      isComplete: false,
      nextStepIndex: -1,
    };

    assert.deepStrictEqual(calculateRitualProgress(null as unknown as RitualStep[]), expected);
    assert.deepStrictEqual(calculateRitualProgress(undefined as unknown as RitualStep[]), expected);
  });

  it('handles all steps incomplete', () => {
    const steps: RitualStep[] = [
      { id: 'step-1', completed: false },
      { id: 'step-2', completed: false },
      { id: 'step-3', completed: false },
    ];

    const result = calculateRitualProgress(steps);
    assert.deepStrictEqual(result, {
      totalSteps: 3,
      completedSteps: 0,
      percentage: 0,
      isComplete: false,
      nextStepIndex: 0,
    });
  });

  it('handles all steps complete', () => {
    const steps: RitualStep[] = [
      { id: 'step-1', completed: true },
      { id: 'step-2', completed: true },
      { id: 'step-3', completed: true },
    ];

    const result = calculateRitualProgress(steps);
    assert.deepStrictEqual(result, {
      totalSteps: 3,
      completedSteps: 3,
      percentage: 100,
      isComplete: true,
      nextStepIndex: -1,
    });
  });

  it('handles partially completed steps correctly', () => {
    const steps: RitualStep[] = [
      { id: 'step-1', completed: true },
      { id: 'step-2', completed: false },
      { id: 'step-3', completed: true },
      { id: 'step-4', completed: false },
    ];

    const result = calculateRitualProgress(steps);
    assert.deepStrictEqual(result, {
      totalSteps: 4,
      completedSteps: 2,
      percentage: 50,
      isComplete: false,
      nextStepIndex: 1,
    });
  });

  it('identifies first incomplete step at index zero', () => {
    const steps: RitualStep[] = [
      { id: 'step-1', completed: false },
      { id: 'step-2', completed: true },
      { id: 'step-3', completed: true },
    ];

    const result = calculateRitualProgress(steps);
    assert.strictEqual(result.nextStepIndex, 0);
    assert.strictEqual(result.isComplete, false);
    assert.strictEqual(result.completedSteps, 2);
    assert.strictEqual(result.totalSteps, 3);
  });

  it('identifies first incomplete step in the middle', () => {
    const steps: RitualStep[] = [
      { id: 'step-1', completed: true },
      { id: 'step-2', completed: false },
      { id: 'step-3', completed: false },
    ];

    const result = calculateRitualProgress(steps);
    assert.strictEqual(result.nextStepIndex, 1);
    assert.strictEqual(result.isComplete, false);
    assert.strictEqual(result.completedSteps, 1);
  });

  it('identifies first incomplete step at the last index', () => {
    const steps: RitualStep[] = [
      { id: 'step-1', completed: true },
      { id: 'step-2', completed: true },
      { id: 'step-3', completed: false },
    ];

    const result = calculateRitualProgress(steps);
    assert.strictEqual(result.nextStepIndex, 2);
    assert.strictEqual(result.isComplete, false);
    assert.strictEqual(result.completedSteps, 2);
    assert.strictEqual(result.percentage, 67);
  });

  it('calculates correct rounded percentages across various ratios', () => {
    // 1 of 3 = 33.333% -> rounds to 33
    const oneOfThree: RitualStep[] = [
      { id: 's1', completed: true },
      { id: 's2', completed: false },
      { id: 's3', completed: false },
    ];
    assert.strictEqual(calculateRitualProgress(oneOfThree).percentage, 33);

    // 2 of 3 = 66.666% -> rounds to 67
    const twoOfThree: RitualStep[] = [
      { id: 's1', completed: true },
      { id: 's2', completed: true },
      { id: 's3', completed: false },
    ];
    assert.strictEqual(calculateRitualProgress(twoOfThree).percentage, 67);

    // 1 of 6 = 16.666% -> rounds to 17
    const oneOfSix: RitualStep[] = [
      { id: 's1', completed: true },
      { id: 's2', completed: false },
      { id: 's3', completed: false },
      { id: 's4', completed: false },
      { id: 's5', completed: false },
      { id: 's6', completed: false },
    ];
    assert.strictEqual(calculateRitualProgress(oneOfSix).percentage, 17);

    // 5 of 6 = 83.333% -> rounds to 83
    const fiveOfSix: RitualStep[] = [
      { id: 's1', completed: true },
      { id: 's2', completed: true },
      { id: 's3', completed: true },
      { id: 's4', completed: true },
      { id: 's5', completed: true },
      { id: 's6', completed: false },
    ];
    assert.strictEqual(calculateRitualProgress(fiveOfSix).percentage, 83);
  });

  it('handles single step when incomplete', () => {
    const singleIncomplete: RitualStep[] = [{ id: 'solo', completed: false }];
    const result = calculateRitualProgress(singleIncomplete);

    assert.deepStrictEqual(result, {
      totalSteps: 1,
      completedSteps: 0,
      percentage: 0,
      isComplete: false,
      nextStepIndex: 0,
    });
  });

  it('handles single step when complete', () => {
    const singleComplete: RitualStep[] = [{ id: 'solo', completed: true }];
    const result = calculateRitualProgress(singleComplete);

    assert.deepStrictEqual(result, {
      totalSteps: 1,
      completedSteps: 1,
      percentage: 100,
      isComplete: true,
      nextStepIndex: -1,
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  evaluateZipfPriorityDistribution,
  TaskFocusAllocation,
} from '../src/lib/analytics/zipf-distribution';

describe('Zipf’s Law Priority Power-Law Distribution Validator', () => {
  it('correctly assesses an ideal Zipf power-law focus distribution (strong_focus)', () => {
    // 4 tasks closely tracking ideal 1/k shares: ~[0.48, 0.24, 0.16, 0.12]
    const tasks: TaskFocusAllocation[] = [
      { taskId: '1', taskTitle: 'Core Engine Refactoring', focusMinutes: 120 },
      { taskId: '2', taskTitle: 'Review & Debugging', focusMinutes: 60 },
      { taskId: '3', taskTitle: 'Documentation & Specs', focusMinutes: 40 },
      { taskId: '4', taskTitle: 'Triage & Inbox', focusMinutes: 30 },
    ];

    const result = evaluateZipfPriorityDistribution(tasks, 1.0);

    expect(result.isPowerLawDistributed).toBe(true);
    expect(result.diagnosis).toBe('strong_focus');
    expect(result.rootMeanSquareError).toBeLessThanOrEqual(0.08);
    expect(result.topPriorityFocusRatio).toBeGreaterThan(0.4);
    expect(result.idealShares).toHaveLength(4);
    expect(result.actualShares).toHaveLength(4);
    // Sum of ideal shares should equal ~1.0
    const sumIdeal = result.idealShares.reduce((a, b) => a + b, 0);
    expect(sumIdeal).toBeCloseTo(1.0, 1);
  });

  it('detects diffuse attention warning when focus is spread evenly across many tasks', () => {
    // Flat distribution: 5 tasks with 20 minutes each (20% each vs ideal ~44%, 22%, 15%, 11%, 9%)
    const tasks: TaskFocusAllocation[] = [
      { taskId: '1', taskTitle: 'Task A', focusMinutes: 20 },
      { taskId: '2', taskTitle: 'Task B', focusMinutes: 20 },
      { taskId: '3', taskTitle: 'Task C', focusMinutes: 20 },
      { taskId: '4', taskTitle: 'Task D', focusMinutes: 20 },
      { taskId: '5', taskTitle: 'Task E', focusMinutes: 20 },
    ];

    const result = evaluateZipfPriorityDistribution(tasks, 1.0);

    expect(result.isPowerLawDistributed).toBe(false);
    expect(result.diagnosis).toBe('diffuse_attention_warning');
    expect(result.rootMeanSquareError).toBeGreaterThan(0.08);
    expect(result.actionableInsight).toContain('High priority diffusion detected');
  });

  it('classifies moderate hierarchy when focus slopes downward but has long-tail leakage', () => {
    const tasks: TaskFocusAllocation[] = [
      { taskId: '1', taskTitle: 'Feature Implementation', focusMinutes: 100 },
      { taskId: '2', taskTitle: 'Architecture Plan', focusMinutes: 80 },
      { taskId: '3', taskTitle: 'Customer Feedback', focusMinutes: 50 },
      { taskId: '4', taskTitle: 'Quick fixes', focusMinutes: 40 },
    ];

    const result = evaluateZipfPriorityDistribution(tasks, 1.0);

    expect(result.diagnosis).toBe('moderate_hierarchy');
    expect(result.isPowerLawDistributed).toBe(true);
  });

  it('handles edge cases: empty array, single task, all zero minutes without NaN', () => {
    // Empty
    const emptyResult = evaluateZipfPriorityDistribution([]);
    expect(emptyResult.diagnosis).toBe('diffuse_attention_warning');
    expect(emptyResult.rootMeanSquareError).toBe(0);
    expect(emptyResult.idealShares).toEqual([]);

    // Single task
    const singleResult = evaluateZipfPriorityDistribution([
      { taskId: 'solo', taskTitle: 'Lone Wolf Project', focusMinutes: 180 },
    ]);
    expect(singleResult.diagnosis).toBe('strong_focus');
    expect(singleResult.isPowerLawDistributed).toBe(true);
    expect(singleResult.topPriorityFocusRatio).toBe(1.0);

    // All zero minutes
    const zeroResult = evaluateZipfPriorityDistribution([
      { taskId: '1', taskTitle: 'Empty Task 1', focusMinutes: 0 },
      { taskId: '2', taskTitle: 'Empty Task 2', focusMinutes: 0 },
    ]);
    expect(zeroResult.diagnosis).toBe('diffuse_attention_warning');
    expect(zeroResult.topPriorityFocusRatio).toBe(0);
    expect(Number.isNaN(zeroResult.rootMeanSquareError)).toBe(false);
  });

  it('automatically sorts unsorted task inputs descending by focusMinutes', () => {
    const unsortedTasks: TaskFocusAllocation[] = [
      { taskId: 'small', taskTitle: 'Small Task', focusMinutes: 10 },
      { taskId: 'big', taskTitle: 'Big Lever Task', focusMinutes: 100 },
      { taskId: 'med', taskTitle: 'Medium Task', focusMinutes: 50 },
    ];

    const result = evaluateZipfPriorityDistribution(unsortedTasks);

    // First actual share should correspond to the 100-minute task (100 / 160 ≈ 0.625)
    expect(result.actualShares[0]).toBeCloseTo(0.625, 2);
    expect(result.actualShares[1]).toBeCloseTo(0.3125, 2);
    expect(result.actualShares[2]).toBeCloseTo(0.0625, 2);
  });
});

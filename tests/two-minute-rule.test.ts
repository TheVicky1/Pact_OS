import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTwoMinuteRule,
  filterImmediateActionableTasks,
  HabitTaskInput,
} from '../src/lib/habits/two-minute-rule';

function task(estimatedSeconds: number, ignitionSubstepTitle?: string): HabitTaskInput {
  return { id: 'task-1', title: 'Run 5 miles', estimatedSeconds, ignitionSubstepTitle };
}

describe('evaluateTwoMinuteRule', () => {
  describe('strategies', () => {
    it('executes a task of two minutes or less immediately', () => {
      assert.deepStrictEqual(evaluateTwoMinuteRule(task(60)), {
        taskId: 'task-1',
        estimatedSeconds: 60,
        strategy: 'execute_immediately',
        isTwoMinuteEligible: true,
        recommendedAction: 'Do "Run 5 miles" now.',
      });
    });

    it('scales a longer task to its ignition step', () => {
      assert.deepStrictEqual(evaluateTwoMinuteRule(task(3000, 'Put on running shoes')), {
        taskId: 'task-1',
        estimatedSeconds: 3000,
        strategy: 'scale_to_ignition',
        isTwoMinuteEligible: true,
        recommendedAction: 'Start "Run 5 miles" with this step: "Put on running shoes".',
      });
    });

    it('schedules a longer task with no ignition step', () => {
      assert.deepStrictEqual(evaluateTwoMinuteRule(task(3000)), {
        taskId: 'task-1',
        estimatedSeconds: 3000,
        strategy: 'standard_schedule',
        isTwoMinuteEligible: false,
        recommendedAction: 'Schedule "Run 5 miles" for a dedicated time.',
      });
    });

    it('prefers immediate execution over an ignition step for a short task', () => {
      const result = evaluateTwoMinuteRule(task(60, 'Put on running shoes'));
      assert.strictEqual(result.strategy, 'execute_immediately');
    });
  });

  describe('120-second boundary', () => {
    it('executes immediately at exactly 120 seconds', () => {
      const result = evaluateTwoMinuteRule(task(120));
      assert.strictEqual(result.strategy, 'execute_immediately');
      assert.strictEqual(result.isTwoMinuteEligible, true);
    });

    it('does not execute immediately just above 120 seconds', () => {
      const result = evaluateTwoMinuteRule(task(120.5));
      assert.strictEqual(result.strategy, 'standard_schedule');
      assert.strictEqual(result.isTwoMinuteEligible, false);
    });

    it('uses the ignition step at 121 seconds', () => {
      const result = evaluateTwoMinuteRule(task(121, 'Open the app'));
      assert.strictEqual(result.strategy, 'scale_to_ignition');
    });
  });

  describe('input sanitization', () => {
    it('falls back to 0 for negative or NaN estimates', () => {
      for (const estimatedSeconds of [-1, -500, Number.NaN]) {
        const result = evaluateTwoMinuteRule(task(estimatedSeconds));
        assert.strictEqual(result.estimatedSeconds, 0);
        assert.strictEqual(result.strategy, 'execute_immediately');
      }
    });

    it('treats an empty or whitespace ignition step as absent', () => {
      for (const ignitionStep of ['', '   ']) {
        const result = evaluateTwoMinuteRule(task(3000, ignitionStep));
        assert.strictEqual(result.strategy, 'standard_schedule');
      }
    });

    it('trims the ignition step in the recommended action', () => {
      const result = evaluateTwoMinuteRule(task(3000, '  Open the app  '));
      assert.strictEqual(
        result.recommendedAction,
        'Start "Run 5 miles" with this step: "Open the app".'
      );
    });
  });
});

describe('filterImmediateActionableTasks', () => {
  const immediate: HabitTaskInput = { id: 'a', title: 'Reply to email', estimatedSeconds: 60 };
  const ignition: HabitTaskInput = {
    id: 'b',
    title: 'Run 5 miles',
    estimatedSeconds: 3000,
    ignitionSubstepTitle: 'Put on running shoes',
  };
  const scheduled: HabitTaskInput = { id: 'c', title: 'Write report', estimatedSeconds: 7200 };

  it('keeps eligible tasks in their original order and removes the rest', () => {
    assert.deepStrictEqual(filterImmediateActionableTasks([ignition, scheduled, immediate]), [
      ignition,
      immediate,
    ]);
  });

  it('returns an empty array for an empty array', () => {
    assert.deepStrictEqual(filterImmediateActionableTasks([]), []);
  });

  it('returns an empty array for non-array input', () => {
    for (const input of [null, undefined, 'tasks', 42, {}]) {
      assert.deepStrictEqual(
        filterImmediateActionableTasks(input as unknown as HabitTaskInput[]),
        []
      );
    }
  });

  it('does not mutate the input array', () => {
    const tasks = [scheduled, immediate];
    filterImmediateActionableTasks(tasks);
    assert.deepStrictEqual(tasks, [scheduled, immediate]);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

async function loadClassifier() {
  try {
    return (await import('../src/lib/tasks/eisenhower-matrix'))
      .classifyEisenhowerQuadrant;
  } catch {
    return undefined;
  }
}

describe('classifyEisenhowerQuadrant', () => {
  const cases = [
    {
      task: { isUrgent: true, isImportant: true },
      expected: {
        quadrant: 1,
        name: 'DO_FIRST',
        label: 'Urgent & Important',
        action: 'Do immediately',
        colorToken: 'amber',
      },
    },
    {
      task: { isUrgent: false, isImportant: true },
      expected: {
        quadrant: 2,
        name: 'SCHEDULE',
        label: 'Important, Not Urgent',
        action: 'Schedule time-block',
        colorToken: 'emerald',
      },
    },
    {
      task: { isUrgent: true, isImportant: false },
      expected: {
        quadrant: 3,
        name: 'DELEGATE',
        label: 'Urgent, Not Important',
        action: 'Automate or minimize',
        colorToken: 'sky',
      },
    },
    {
      task: { isUrgent: false, isImportant: false },
      expected: {
        quadrant: 4,
        name: 'ELIMINATE',
        label: 'Neither Urgent nor Important',
        action: 'Consider dropping',
        colorToken: 'zinc',
      },
    },
  ] as const;

  for (const { task, expected } of cases) {
    it(`classifies urgent=${task.isUrgent}, important=${task.isImportant}`, async () => {
      const classifyEisenhowerQuadrant = await loadClassifier();
      if (!classifyEisenhowerQuadrant) {
        assert.fail('Eisenhower quadrant classifier must be implemented');
      }

      assert.deepEqual(classifyEisenhowerQuadrant(task), expected);
    });
  }

  it('returns a fresh object so caller mutation does not leak into later results', async () => {
    const classifyEisenhowerQuadrant = await loadClassifier();
    if (!classifyEisenhowerQuadrant) {
      assert.fail('Eisenhower quadrant classifier must be implemented');
    }

    const first = classifyEisenhowerQuadrant({ isUrgent: true, isImportant: true });
    first.quadrant = 4;

    assert.deepEqual(
      classifyEisenhowerQuadrant({ isUrgent: true, isImportant: true }),
      cases[0].expected,
    );
  });
});

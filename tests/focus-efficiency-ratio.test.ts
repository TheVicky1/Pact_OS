
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateFocusEfficiency } from '../src/lib/focus/efficiency-ratio';

describe('calculateFocusEfficiency', () => {
  it('returns optimal efficiency for a completed session', () => {
    assert.deepEqual(
      calculateFocusEfficiency({
        plannedMinutes: 25,
        actualSeconds: 1500,
      }),
      {
        efficiencyPercent: 100,
        scoreBand: 'optimal',
        pausePenalty: 0,
      },
    );
  });

  it('caps efficiency at 100 percent', () => {
    const result = calculateFocusEfficiency({
      plannedMinutes: 25,
      actualSeconds: 1800,
    });

    assert.equal(result.efficiencyPercent, 100);
    assert.equal(result.scoreBand, 'optimal');
  });

  it('applies a penalty for pauses beyond the first', () => {
    const result = calculateFocusEfficiency({
      plannedMinutes: 25,
      actualSeconds: 1500,
      pauseCount: 3,
    });

    assert.equal(result.pausePenalty, 4);
    assert.equal(result.efficiencyPercent, 96);
    assert.equal(result.scoreBand, 'optimal');
  });

  it('classifies a score of 70 as adequate', () => {
    const result = calculateFocusEfficiency({
      plannedMinutes: 100,
      actualSeconds: 4200,
    });

    assert.equal(result.efficiencyPercent, 70);
    assert.equal(result.scoreBand, 'adequate');
  });

  it('classifies a score of 30 as under-target', () => {
    const result = calculateFocusEfficiency({
      plannedMinutes: 100,
      actualSeconds: 1800,
    });

    assert.equal(result.efficiencyPercent, 30);
    assert.equal(result.scoreBand, 'under-target');
  });

  it('classifies scores below 30 as abandoned', () => {
    const result = calculateFocusEfficiency({
      plannedMinutes: 100,
      actualSeconds: 1740,
    });

    assert.equal(result.efficiencyPercent, 29);
    assert.equal(result.scoreBand, 'abandoned');
  });

  it('returns abandoned for invalid planned or actual durations', () => {
    assert.deepEqual(
      calculateFocusEfficiency({
        plannedMinutes: 0,
        actualSeconds: 1500,
      }),
      {
        efficiencyPercent: 0,
        scoreBand: 'abandoned',
        pausePenalty: 0,
      },
    );

    assert.equal(
      calculateFocusEfficiency({
        plannedMinutes: 25,
        actualSeconds: 0,
      }).scoreBand,
      'abandoned',
    );
  });

  it('never returns a negative efficiency percentage', () => {
    const result = calculateFocusEfficiency({
      plannedMinutes: 100,
      actualSeconds: 1800,
      pauseCount: 100,
    });

    assert.equal(result.efficiencyPercent, 0);
    assert.equal(result.scoreBand, 'abandoned');
  });
});

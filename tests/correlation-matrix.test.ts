import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculatePearsonCorrelation,
  buildHabitCorrelationMatrix,
  classifyHabitRelationship,
  HabitCheckinVector,
} from '../src/lib/analytics/correlation-matrix';

describe('calculatePearsonCorrelation', () => {
  it('returns +1.0 for perfectly synchronized habits', () => {
    const habitA = [1, 0, 1, 1, 0, 1, 0, 1];
    const habitB = [1, 0, 1, 1, 0, 1, 0, 1];

    const r = calculatePearsonCorrelation(habitA, habitB);
    assert.equal(r, 1.0);
  });

  it('returns -1.0 for strictly mutually exclusive habits', () => {
    const habitA = [1, 0, 1, 0, 1, 0];
    const habitB = [0, 1, 0, 1, 0, 1];

    const r = calculatePearsonCorrelation(habitA, habitB);
    assert.equal(r, -1.0);
  });

  it('returns approximately 0.0 for orthogonal uncorrelated habits', () => {
    // 4 days with orthogonal completions
    const habitA = [1, 1, 0, 0];
    const habitB = [1, 0, 1, 0];

    const r = calculatePearsonCorrelation(habitA, habitB);
    assert.equal(r, 0.0);
  });

  it('safely handles zero-variance constant vectors without NaN or div-by-zero', () => {
    // 100% completion rate (zero variance)
    const alwaysDone = [1, 1, 1, 1, 1];
    const normalHabit = [1, 0, 1, 0, 1];
    assert.equal(calculatePearsonCorrelation(alwaysDone, normalHabit), 0.0);

    // 0% completion rate (zero variance)
    const neverDone = [0, 0, 0, 0, 0];
    assert.equal(calculatePearsonCorrelation(neverDone, normalHabit), 0.0);

    // Both constant
    assert.equal(calculatePearsonCorrelation(alwaysDone, neverDone), 0.0);
  });

  it('safely guards against sample size < 3 and non-array or invalid inputs', () => {
    assert.equal(calculatePearsonCorrelation([], []), 0.0);
    assert.equal(calculatePearsonCorrelation([1], [1]), 0.0);
    assert.equal(calculatePearsonCorrelation([1, 0], [0, 1]), 0.0);
    assert.equal(calculatePearsonCorrelation(null as unknown as number[], [1, 0, 1]), 0.0);
    assert.equal(calculatePearsonCorrelation([1, 0, 1], undefined as unknown as number[]), 0.0);
  });

  it('safely handles mismatched vector lengths by truncating to common prefix', () => {
    const shortVector = [1, 0, 1, 0];
    const longVector = [1, 0, 1, 0, 1, 1, 1, 1, 1];

    const r = calculatePearsonCorrelation(shortVector, longVector);
    assert.equal(r, 1.0);
  });

  it('normalizes non-finite values (NaN / Infinity) without crashing', () => {
    const dirtyA = [1, NaN, 1, 0, 1];
    const cleanB = [1, 0, 1, 0, 1];

    const r = calculatePearsonCorrelation(dirtyA, cleanB);
    assert.equal(Number.isFinite(r), true);
    assert.ok(r >= -1.0 && r <= 1.0);
  });
});

describe('classifyHabitRelationship', () => {
  it('correctly maps correlation coefficients across all defined thresholds and exact boundaries', () => {
    // Upper boundary (+0.60): strong_synergy vs moderate_synergy
    assert.equal(classifyHabitRelationship(1.0), 'strong_synergy');
    assert.equal(classifyHabitRelationship(0.85), 'strong_synergy');
    assert.equal(classifyHabitRelationship(0.6), 'strong_synergy');
    assert.equal(classifyHabitRelationship(0.5999), 'moderate_synergy');

    // Middle-positive boundary (+0.20): moderate_synergy vs independent
    assert.equal(classifyHabitRelationship(0.55), 'moderate_synergy');
    assert.equal(classifyHabitRelationship(0.2), 'moderate_synergy');
    assert.equal(classifyHabitRelationship(0.1999), 'independent');

    // Neutral baseline: independent
    assert.equal(classifyHabitRelationship(0.15), 'independent');
    assert.equal(classifyHabitRelationship(0.0), 'independent');
    assert.equal(classifyHabitRelationship(-0.15), 'independent');
    assert.equal(classifyHabitRelationship(-0.1999), 'independent');

    // Middle-negative boundary (-0.20): moderate_conflict vs independent
    assert.equal(classifyHabitRelationship(-0.2), 'moderate_conflict');
    assert.equal(classifyHabitRelationship(-0.45), 'moderate_conflict');
    assert.equal(classifyHabitRelationship(-0.5999), 'moderate_conflict');

    // Lower boundary (-0.60): strong_conflict vs moderate_conflict
    assert.equal(classifyHabitRelationship(-0.6), 'strong_conflict');
    assert.equal(classifyHabitRelationship(-0.95), 'strong_conflict');
    assert.equal(classifyHabitRelationship(-1.0), 'strong_conflict');
  });
});

describe('buildHabitCorrelationMatrix', () => {
  it('returns empty matrix result for empty or nullish habit list', () => {
    const emptyResult = {
      habitIds: [],
      matrix: [],
      topSynergies: [],
      topConflicts: [],
    };
    assert.deepEqual(buildHabitCorrelationMatrix([]), emptyResult);
    assert.deepEqual(
      buildHabitCorrelationMatrix(null as unknown as HabitCheckinVector[]),
      emptyResult
    );
    assert.deepEqual(
      buildHabitCorrelationMatrix(undefined as unknown as HabitCheckinVector[]),
      emptyResult
    );
  });

  it('returns 1x1 matrix with 1.0 on diagonal for single habit vector', () => {
    const result = buildHabitCorrelationMatrix([
      { habitId: 'h1', habitName: 'Meditation', checkins: [1, 1, 0, 1, 0] },
    ]);

    assert.deepEqual(result.habitIds, ['h1']);
    assert.deepEqual(result.matrix, [[1.0]]);
    assert.equal(result.topSynergies.length, 0);
    assert.equal(result.topConflicts.length, 0);
  });

  it('preserves strict matrix symmetry and diagonal identity for multi-habit vectors', () => {
    const habitVectors: HabitCheckinVector[] = [
      { habitId: 'h1', habitName: 'Morning Workout', checkins: [1, 0, 1, 1, 0, 1, 0] },
      { habitId: 'h2', habitName: 'Cold Shower', checkins: [1, 0, 1, 1, 0, 1, 0] }, // Perfect synergy with h1
      { habitId: 'h3', habitName: 'Late Binging', checkins: [0, 1, 0, 0, 1, 0, 1] }, // Perfect conflict with h1 & h2
      { habitId: 'h4', habitName: 'Random Audio Book', checkins: [1, 1, 0, 0, 1, 0, 1] },
    ];

    const result = buildHabitCorrelationMatrix(habitVectors);

    // Verify matrix size
    assert.equal(result.matrix.length, 4);
    assert.equal(result.matrix[0].length, 4);

    // Verify diagonal invariant: M[i][i] === 1.0
    for (let i = 0; i < 4; i++) {
      assert.equal(result.matrix[i][i], 1.0);
    }

    // Verify symmetry invariant: M[i][j] === M[j][i]
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        assert.equal(result.matrix[i][j], result.matrix[j][i]);
      }
    }

    // Verify top synergy detection (h1 and h2)
    assert.ok(result.topSynergies.length >= 1);
    const topSynergy = result.topSynergies[0];
    assert.equal(topSynergy.pearsonR, 1.0);
    assert.equal(topSynergy.relationship, 'strong_synergy');

    // Verify top conflict detection (h1/h2 with h3)
    assert.ok(result.topConflicts.length >= 1);
    const topConflict = result.topConflicts[0];
    assert.equal(topConflict.pearsonR, -1.0);
    assert.equal(topConflict.relationship, 'strong_conflict');
  });

  it('correctly sorts topSynergies descending and topConflicts ascending', () => {
    const habitVectors: HabitCheckinVector[] = [
      { habitId: 'a', habitName: 'Habit A', checkins: [1, 0, 1, 0, 1, 0, 1] },
      { habitId: 'b', habitName: 'Habit B', checkins: [1, 0, 1, 0, 1, 0, 1] }, // r = 1.0
      { habitId: 'c', habitName: 'Habit C', checkins: [1, 1, 1, 0, 1, 0, 0] }, // moderate r
      { habitId: 'd', habitName: 'Habit D', checkins: [0, 1, 0, 1, 0, 1, 0] }, // r = -1.0
    ];

    const { topSynergies, topConflicts } = buildHabitCorrelationMatrix(habitVectors);

    // Assert topSynergies descending order
    for (let i = 1; i < topSynergies.length; i++) {
      assert.ok(topSynergies[i - 1].pearsonR >= topSynergies[i].pearsonR);
    }

    // Assert topConflicts ascending order (strongest negative first)
    for (let i = 1; i < topConflicts.length; i++) {
      assert.ok(topConflicts[i - 1].pearsonR <= topConflicts[i].pearsonR);
    }
  });
});


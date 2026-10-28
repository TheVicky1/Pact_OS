import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateGiniCoefficient,
  evaluateTimeBalance,
  DomainAllocation,
} from '../src/lib/analytics/gini-coefficient';

describe('calculateGiniCoefficient', () => {
  it('returns 0 for empty array', () => {
    assert.equal(calculateGiniCoefficient([]), 0);
  });

  it('returns 0 for single-element array', () => {
    assert.equal(calculateGiniCoefficient([120]), 0);
    assert.equal(calculateGiniCoefficient([0]), 0);
  });

  it('returns 0 when all values are zero', () => {
    assert.equal(calculateGiniCoefficient([0, 0, 0, 0]), 0);
  });

  it('returns 0.00 for perfectly equal distribution across domains', () => {
    const values = [60, 60, 60, 60];
    const gini = calculateGiniCoefficient(values);
    assert.equal(gini, 0);
  });

  it('rejects negative values with RangeError', () => {
    assert.throws(
      () => calculateGiniCoefficient([-10]),
      RangeError,
      'Should throw RangeError for negative value',
    );
    assert.throws(
      () => calculateGiniCoefficient([50, -5, 20]),
      RangeError,
      'Should throw RangeError for negative value in array',
    );
  });

  it('calculates high Gini (> 0.65) for extreme concentration in 1 domain', () => {
    // 300m in Work, 0 in Health, 0 in Sleep
    const gini = calculateGiniCoefficient([300, 0, 0]);
    assert.equal(gini, 0.67);
    assert.ok(gini > 0.65, `Expected Gini > 0.65, got ${gini}`);
  });

  it('calculates accurate discrete absolute difference for intermediate distributions', () => {
    // values = [10, 20, 30]
    // sum = 60, mean = 20, n = 3
    // diffSum = (|10-20| + |10-30| + |20-10| + |20-30| + |30-10| + |30-20|) = 10+20+10+10+20+10 = 80
    // denominator = 2 * 3 * 60 = 360
    // raw = 80 / 360 = 0.222... -> rounded to 2 decimal places = 0.22
    assert.equal(calculateGiniCoefficient([10, 20, 30]), 0.22);
  });

  it('handles floating point values accurately', () => {
    const gini = calculateGiniCoefficient([15.5, 30.5, 45.0]);
    assert.equal(typeof gini, 'number');
    assert.ok(gini >= 0 && gini <= 1);
  });

  it('clamps output to range [0, 1]', () => {
    const extreme = [10000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const gini = calculateGiniCoefficient(extreme);
    assert.ok(gini <= 1);
    assert.ok(gini >= 0);
    assert.equal(gini, 0.9);
  });
});

describe('evaluateTimeBalance', () => {
  it('safely handles empty allocations without crashing', () => {
    const report = evaluateTimeBalance([]);
    assert.deepEqual(report, {
      giniCoefficient: 0,
      balanceRating: 'equitable_harmony',
      dominantDomain: null,
      neglectedDomains: [],
      totalTrackedMinutes: 0,
    });
  });

  it('safely handles allocations with all zeros', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 0 },
      { domain: 'Health', minutesSpent: 0 },
      { domain: 'Relationships', minutesSpent: 0 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.deepEqual(report, {
      giniCoefficient: 0,
      balanceRating: 'equitable_harmony',
      dominantDomain: null,
      neglectedDomains: [],
      totalTrackedMinutes: 0,
    });
  });

  it('rejects negative minutesSpent with RangeError', () => {
    const invalid: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 120 },
      { domain: 'Health', minutesSpent: -30 },
    ];
    assert.throws(
      () => evaluateTimeBalance(invalid),
      RangeError,
      'Should reject negative minutesSpent with RangeError',
    );
  });

  it('evaluates equitable_harmony (G < 0.20) for equal distribution', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 60 },
      { domain: 'Health', minutesSpent: 60 },
      { domain: 'Relationships', minutesSpent: 60 },
      { domain: 'Learning', minutesSpent: 60 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.giniCoefficient, 0);
    assert.equal(report.balanceRating, 'equitable_harmony');
    assert.equal(report.dominantDomain, 'Deep Work');
    assert.deepEqual(report.neglectedDomains, []);
    assert.equal(report.totalTrackedMinutes, 240);
  });

  it('evaluates balanced_portfolio (0.20 <= G < 0.35)', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Admin', minutesSpent: 10 },
      { domain: 'Health', minutesSpent: 20 },
      { domain: 'Deep Work', minutesSpent: 30 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.giniCoefficient, 0.22);
    assert.equal(report.balanceRating, 'balanced_portfolio');
    assert.equal(report.dominantDomain, 'Deep Work');
    assert.equal(report.totalTrackedMinutes, 60);
  });

  it('evaluates moderate_skew (0.35 <= G < 0.55)', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Admin', minutesSpent: 5 },
      { domain: 'Health', minutesSpent: 15 },
      { domain: 'Deep Work', minutesSpent: 40 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.giniCoefficient, 0.39);
    assert.equal(report.balanceRating, 'moderate_skew');
    assert.equal(report.dominantDomain, 'Deep Work');
    assert.equal(report.totalTrackedMinutes, 60);
  });

  it('evaluates hyper_skewed_obsession (G >= 0.55)', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 300 },
      { domain: 'Health', minutesSpent: 0 },
      { domain: 'Sleep', minutesSpent: 0 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.giniCoefficient, 0.67);
    assert.equal(report.balanceRating, 'hyper_skewed_obsession');
    assert.equal(report.dominantDomain, 'Deep Work');
    assert.deepEqual(report.neglectedDomains, ['Health', 'Sleep']);
    assert.equal(report.totalTrackedMinutes, 300);
  });

  it('identifies dominantDomain in case of a tie by selecting the first occurrence', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 100 },
      { domain: 'Health', minutesSpent: 100 },
      { domain: 'Relationships', minutesSpent: 50 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.dominantDomain, 'Deep Work');
  });

  it('correctly flags neglected domains receiving strictly less than 5% of total time', () => {
    // Total = 1000 minutes
    // Threshold = 5% = 50 minutes
    const allocations: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 800 }, // 80% (>= 5%)
      { domain: 'Learning', minutesSpent: 100 },  // 10% (>= 5%)
      { domain: 'Health', minutesSpent: 50 },     // 5% (boundary: exactly 5%, not neglected)
      { domain: 'Finance', minutesSpent: 49 },    // 4.9% (< 5%, neglected)
      { domain: 'Admin', minutesSpent: 1 },       // 0.1% (< 5%, neglected)
      { domain: 'Leisure', minutesSpent: 0 },     // 0% (< 5%, neglected)
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.totalTrackedMinutes, 1000);
    assert.deepEqual(report.neglectedDomains, ['Finance', 'Admin', 'Leisure']);
  });

  it('handles single domain allocation', () => {
    const allocations: DomainAllocation[] = [
      { domain: 'Deep Work', minutesSpent: 120 },
    ];
    const report = evaluateTimeBalance(allocations);
    assert.equal(report.giniCoefficient, 0);
    assert.equal(report.balanceRating, 'equitable_harmony');
    assert.equal(report.dominantDomain, 'Deep Work');
    assert.deepEqual(report.neglectedDomains, []);
    assert.equal(report.totalTrackedMinutes, 120);
  });
});

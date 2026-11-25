import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateHickDecisionTime,
  evaluateMenuClutter,
} from '../src/lib/focus/hicks-law';

describe('calculateHickDecisionTime', () => {
  it('returns the base reaction time and no clutter for zero choices', () => {
    const result = calculateHickDecisionTime(0);

    assert.equal(result.optionCount, 0);
    assert.equal(result.entropyBits, 0);
    assert.equal(result.estimatedDecisionTimeMs, 200);
    assert.equal(result.clutterScore, 0);
    assert.equal(result.severity, 'minimal');
  });

  it('clamps negative and non-numeric choice counts to zero', () => {
    assert.equal(calculateHickDecisionTime(-10).optionCount, 0);
    assert.equal(calculateHickDecisionTime(NaN).optionCount, 0);
    assert.equal(calculateHickDecisionTime(-Infinity).optionCount, 0);
  });

  it('rounds entropy to three decimal places and applies the default formula', () => {
    const result = calculateHickDecisionTime(4);

    assert.equal(result.entropyBits, 2.322);
    assert.equal(result.estimatedDecisionTimeMs, 548);
    assert.equal(result.clutterScore, 47);
  });

  it('classifies every severity boundary', () => {
    assert.equal(calculateHickDecisionTime(4).severity, 'minimal');
    assert.equal(calculateHickDecisionTime(5).severity, 'moderate');
    assert.equal(calculateHickDecisionTime(9).severity, 'moderate');
    assert.equal(calculateHickDecisionTime(10).severity, 'high');
    assert.equal(calculateHickDecisionTime(19).severity, 'high');
    assert.equal(calculateHickDecisionTime(20).severity, 'paralyzing');
  });

  it('keeps the clutter score within zero and one hundred', () => {
    assert.equal(calculateHickDecisionTime(29).clutterScore, 100);
    assert.equal(calculateHickDecisionTime(1_000_000).clutterScore, 100);
    assert.equal(calculateHickDecisionTime(-1_000).clutterScore, 0);
  });

  it('honors custom processing, reaction, and familiarity values', () => {
    const result = calculateHickDecisionTime(3, {
      processingConstantMs: 100,
      baseReactionTimeMs: 50,
      familiarityFactor: 0.5,
    });

    assert.equal(result.entropyBits, 2);
    assert.equal(result.estimatedDecisionTimeMs, 150);
  });

  it('uses safe defaults and bounds invalid option values', () => {
    const defaults = calculateHickDecisionTime(1);
    const invalid = calculateHickDecisionTime(1, {
      processingConstantMs: NaN,
      baseReactionTimeMs: -1,
      familiarityFactor: Infinity,
    });

    assert.equal(invalid.estimatedDecisionTimeMs, defaults.estimatedDecisionTimeMs);
    assert.equal(
      calculateHickDecisionTime(1, { familiarityFactor: 100 }).estimatedDecisionTimeMs,
      425,
    );
  });
});

describe('evaluateMenuClutter', () => {
  it('evaluates all rendered items as choices', () => {
    const result = evaluateMenuClutter([
      { id: 'start', isHighlighted: true, category: 'primary' },
      { id: 'pause', category: 'session' },
      { id: 'stop', category: 'session' },
      { id: 'settings' },
      { id: 'history' },
    ]);

    assert.equal(result.optionCount, 5);
    assert.equal(result.severity, 'moderate');
    assert.match(result.recommendation, /categor/i);
  });
});

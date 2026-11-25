import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  amplitudeToDecibels,
  decibelsToAmplitude,
  MIN_DECIBELS,
} from '../src/lib/audio/decibel-scale';

describe('amplitudeToDecibels', () => {
  it('converts the documented reference amplitudes', () => {
    assert.equal(amplitudeToDecibels(1), 0);
    assert.equal(amplitudeToDecibels(0.5), -6);
    assert.equal(amplitudeToDecibels(0.1), -20);
  });

  it('maps silence to the configured noise floor', () => {
    assert.equal(amplitudeToDecibels(0), MIN_DECIBELS);
    assert.equal(amplitudeToDecibels(0, -80), -80);
  });

  it('clamps amplitudes below the noise floor and above full scale', () => {
    assert.equal(amplitudeToDecibels(0.0001), MIN_DECIBELS);
    assert.equal(amplitudeToDecibels(2), 0);
    assert.equal(amplitudeToDecibels(Infinity), 0);
  });

  it('preserves fractional noise floors after rounding', () => {
    assert.equal(amplitudeToDecibels(0.0001, -60.06), -60.06);
    assert.equal(amplitudeToDecibels(0.0001, -60), -60);
    assert.equal(amplitudeToDecibels(0.0001, -80), -80);
  });

  it('rounds decibels to one decimal place', () => {
    assert.equal(amplitudeToDecibels(0.333), -9.6);
  });

  it('rejects negative amplitudes', () => {
    assert.throws(() => amplitudeToDecibels(-0.1), RangeError);
  });

  it('rejects non-numeric and NaN amplitude values', () => {
    const convert = amplitudeToDecibels as (value: unknown) => number;

    for (const value of ['0.5', null, undefined, NaN]) {
      assert.throws(() => convert(value), TypeError);
    }
  });
});

describe('decibelsToAmplitude', () => {
  it('converts the documented reference decibel values', () => {
    assert.equal(decibelsToAmplitude(0), 1);
    assert.equal(decibelsToAmplitude(-6), 0.5012);
    assert.equal(decibelsToAmplitude(-20), 0.1);
  });

  it('maps the noise floor and lower values to silence', () => {
    assert.equal(decibelsToAmplitude(MIN_DECIBELS), 0);
    assert.equal(decibelsToAmplitude(-80), 0);
    assert.equal(decibelsToAmplitude(-80, -80), 0);
    assert.equal(decibelsToAmplitude(-Infinity), 0);
  });

  it('maps the coincident zero-decibel floor to full scale', () => {
    assert.equal(decibelsToAmplitude(0, 0), 1);
    assert.equal(decibelsToAmplitude(amplitudeToDecibels(1, 0), 0), 1);
    assert.equal(decibelsToAmplitude(-0.1, 0), 0);
  });

  it('clamps positive decibels to full scale', () => {
    assert.equal(decibelsToAmplitude(3), 1);
    assert.equal(decibelsToAmplitude(Infinity), 1);
  });

  it('rounds amplitudes to four decimal places', () => {
    assert.equal(decibelsToAmplitude(-3), 0.7079);
  });

  it('supports round-trip conversions within the documented precision', () => {
    for (const amplitude of [0.05, 0.1, 0.25, 0.5, 0.75, 1]) {
      const roundTrip = decibelsToAmplitude(amplitudeToDecibels(amplitude));
      assert.ok(Math.abs(roundTrip - amplitude) <= 0.0013);
    }
  });

  it('rejects non-numeric and NaN decibel values', () => {
    const convert = decibelsToAmplitude as (value: unknown) => number;

    for (const value of ['-6', null, undefined, NaN]) {
      assert.throws(() => convert(value), TypeError);
    }
  });
});

describe('minimum decibel validation', () => {
  it('rejects non-numeric and NaN minimum values', () => {
    const amplitudeConverter = amplitudeToDecibels as (amplitude: number, min: unknown) => number;
    const decibelConverter = decibelsToAmplitude as (decibels: number, min: unknown) => number;

    for (const value of ['-60', null, NaN]) {
      assert.throws(() => amplitudeConverter(0.5, value), TypeError);
      assert.throws(() => decibelConverter(-6, value), TypeError);
    }
  });

  it('rejects positive minimum decibel thresholds', () => {
    assert.throws(() => amplitudeToDecibels(0.5, 1), RangeError);
    assert.throws(() => decibelsToAmplitude(-6, 1), RangeError);
  });
});

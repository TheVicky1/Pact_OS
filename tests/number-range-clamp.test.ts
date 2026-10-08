import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clamp } from '../src/lib/math';

describe('number range clamp helper', () => {
  describe('In Range', () => {
    it('returns the value unchanged when within the range', () => {
      assert.equal(clamp(5, 0, 10), 5);
      assert.equal(clamp(0.5, 0, 1), 0.5);
      assert.equal(clamp(-5, -10, 0), -5);
    });
  });

  describe('Below Min', () => {
    it('clamps to min when value is strictly less than min', () => {
      assert.equal(clamp(-3, 0, 10), 0);
      assert.equal(clamp(-100, -50, 50), -50);
      assert.equal(clamp(-0.1, 0, 1), 0);
    });
  });

  describe('Above Max', () => {
    it('clamps to max when value is strictly greater than max', () => {
      assert.equal(clamp(15, 0, 10), 10);
      assert.equal(clamp(100, -50, 50), 50);
      assert.equal(clamp(1.1, 0, 1), 1);
    });
  });

  describe('At Boundaries', () => {
    it('returns exact boundary values when value equals min or max', () => {
      assert.equal(clamp(0, 0, 10), 0);
      assert.equal(clamp(10, 0, 10), 10);
      assert.equal(clamp(-5, -5, 5), -5);
      assert.equal(clamp(5, -5, 5), 5);
      assert.equal(clamp(42, 42, 42), 42);
    });
  });

  describe('Inverted Bounds', () => {
    it('safely normalizes bounds when min > max', () => {
      // Inverted bounds (min=10, max=0) should behave like (0, 10)
      assert.equal(clamp(5, 10, 0), 5);
      assert.equal(clamp(-3, 10, 0), 0);
      assert.equal(clamp(15, 10, 0), 10);
      assert.equal(clamp(0, 10, 0), 0);
      assert.equal(clamp(10, 10, 0), 10);
    });
  });

  describe('Edge Cases', () => {
    it('returns NaN when value, min, or max is NaN', () => {
      assert.ok(Number.isNaN(clamp(NaN, 0, 10)));
      assert.ok(Number.isNaN(clamp(5, NaN, 10)));
      assert.ok(Number.isNaN(clamp(5, 0, NaN)));
      assert.ok(Number.isNaN(clamp(NaN, NaN, NaN)));
    });

    it('handles positive and negative Infinity', () => {
      assert.equal(clamp(Infinity, 0, 10), 10);
      assert.equal(clamp(-Infinity, 0, 10), 0);
      assert.equal(clamp(5, -Infinity, Infinity), 5);
      assert.equal(clamp(-100, -Infinity, 0), -100);
      assert.equal(clamp(100, 0, Infinity), 100);
    });

    it('handles non-integer floating point numbers with precision', () => {
      assert.equal(clamp(2.718, 1.414, 3.14159), 2.718);
      assert.equal(clamp(0.5, 1.414, 3.14159), 1.414);
      assert.equal(clamp(4.2, 1.414, 3.14159), 3.14159);
      assert.equal(clamp(0.00001, 0.0001, 0.9999), 0.0001);
    });

    it('handles negative zero gracefully', () => {
      assert.equal(clamp(-0, 0, 10), 0);
    });
  });
});

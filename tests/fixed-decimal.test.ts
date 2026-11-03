import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addFixed,
  subFixed,
  mulFixed,
  divFixed,
  roundFixed,
  formatFixed,
} from '../src/lib/data/fixed-decimal';

// Baseline inline checks
assert.equal(addFixed(0.1, 0.2, 2), 0.3);
assert.equal(addFixed('12.345', '0.005', 2), 12.35);
assert.equal(subFixed('1.0', '0.9', 2), 0.1);
assert.equal(subFixed('-1.25', '-2.50', 2), 1.25);
assert.equal(mulFixed('19.99', 3, 2), 59.97);
assert.equal(mulFixed('1.25', '2.5', 3), 3.125);
assert.equal(divFixed(1, 3, 2), 0.33);
assert.equal(divFixed(10, 4, 3), 2.5);
assert.throws(() => divFixed(1, 0), RangeError);
assert.equal(roundFixed('2.5', 0, 'half-even'), 2);
assert.equal(roundFixed('3.5', 0, 'half-even'), 4);
assert.equal(roundFixed('-2.5', 0, 'half-even'), -2);
assert.equal(roundFixed('2.5', 0, 'half-up'), 3);
assert.equal(roundFixed('-2.5', 0, 'half-up'), -3);
assert.equal(roundFixed('2.99', 0, 'truncate'), 2);
assert.equal(roundFixed('-2.99', 0, 'truncate'), -2);
assert.equal(formatFixed('1250.5', { currencyPrefix: '$' }), '$1,250.50');
assert.equal(formatFixed('12', { precision: 4 }), '12.0000');
assert.equal(formatFixed('-1234.567'), '-1,234.57');
assert.equal(formatFixed('1234.5', { commaSeparated: false }), '1234.50');
assert.equal(formatFixed('42', { precision: 0 }), '42');

describe('Fixed-Point Decimal Arithmetic (fixed-decimal.ts)', () => {
  describe('addFixed', () => {
    it('corrects classic floating point addition drift (0.1 + 0.2 === 0.3)', () => {
      assert.strictEqual(addFixed(0.1, 0.2), 0.3);
      assert.strictEqual(addFixed('0.1', '0.2'), 0.3);
      assert.strictEqual(addFixed(0.07, 0.01), 0.08);
    });

    it('handles negative operands and zeroes', () => {
      assert.strictEqual(addFixed(-10.5, 5.25), -5.25);
      assert.strictEqual(addFixed(0, 0), 0);
      assert.strictEqual(addFixed(100.5, -100.5), 0);
    });

    it('supports custom precision', () => {
      assert.strictEqual(addFixed(0.0001, 0.0002, 4), 0.0003);
    });

    it('rejects invalid inputs', () => {
      assert.throws(() => addFixed('invalid', 5), TypeError);
      assert.throws(() => addFixed(5, 5, -1), RangeError);
    });
  });

  describe('subFixed', () => {
    it('corrects floating point subtraction drift (1.0 - 0.9 === 0.1)', () => {
      assert.strictEqual(subFixed(1.0, 0.9), 0.1);
      assert.strictEqual(subFixed('100.05', '0.05'), 100);
    });

    it('handles negative results', () => {
      assert.strictEqual(subFixed(50, 100), -50);
    });
  });

  describe('mulFixed', () => {
    it('corrects floating point multiplication drift (19.99 * 3 === 59.97)', () => {
      assert.strictEqual(mulFixed(19.99, 3), 59.97);
      assert.strictEqual(mulFixed('19.99', '3'), 59.97);
    });

    it('applies default banker rounding on fractional results', () => {
      assert.strictEqual(mulFixed(10.55, 0.1, 2), 1.06);
    });
  });

  describe('divFixed', () => {
    it('computes division and rounds properly', () => {
      assert.strictEqual(divFixed(100, 3, 2), 33.33);
      assert.strictEqual(divFixed(10, 2), 5);
    });

    it('throws RangeError on division by zero', () => {
      assert.throws(() => divFixed(100, 0), RangeError);
      assert.throws(() => divFixed(100, '0'), RangeError);
    });
  });

  describe('roundFixed (Banker\'s Rounding / half-even)', () => {
    it('implements half-even rounding correctly', () => {
      assert.strictEqual(roundFixed(2.5, 0, 'half-even'), 2);
      assert.strictEqual(roundFixed(3.5, 0, 'half-even'), 4);
      assert.strictEqual(roundFixed(-2.5, 0, 'half-even'), -2);
      assert.strictEqual(roundFixed(-3.5, 0, 'half-even'), -4);
    });

    it('supports half-up mode', () => {
      assert.strictEqual(roundFixed(2.5, 0, 'half-up'), 3);
      assert.strictEqual(roundFixed(3.5, 0, 'half-up'), 4);
    });

    it('supports truncate mode', () => {
      assert.strictEqual(roundFixed(2.99, 0, 'truncate'), 2);
      assert.strictEqual(roundFixed(-2.99, 0, 'truncate'), -2);
    });
  });

  describe('formatFixed', () => {
    it('formats with thousands commas and currency prefix', () => {
      assert.strictEqual(
        formatFixed(1250.5, { currencyPrefix: '$' }),
        '$1,250.50'
      );
      assert.strictEqual(
        formatFixed('1250000.75', { currencyPrefix: '€' }),
        '€1,250,000.75'
      );
    });

    it('supports disabling commas', () => {
      assert.strictEqual(
        formatFixed(1250.5, { commaSeparated: false }),
        '1250.50'
      );
    });

    it('formats negative balances correctly', () => {
      assert.strictEqual(
        formatFixed(-45.2, { currencyPrefix: '$' }),
        '-$45.20'
      );
    });

    it('supports custom precision formatting', () => {
      assert.strictEqual(
        formatFixed(0.123456, { precision: 4 }),
        '0.1235'
      );
    });
  });
});

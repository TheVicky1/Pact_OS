import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitBillAmount } from '../src/lib/finance/split-bill';

describe('splitBillAmount', () => {
  for (const { total, count, base, remainder, shares } of [
    { total: 1000, count: 2, base: 500, remainder: 0, shares: [500, 500] },
    { total: 1000, count: 3, base: 333, remainder: 1, shares: [334, 333, 333] },
    { total: 1001, count: 3, base: 333, remainder: 2, shares: [334, 334, 333] },
    { total: 1000, count: 1, base: 1000, remainder: 0, shares: [1000] },
    { total: 0, count: 3, base: 0, remainder: 0, shares: [0, 0, 0] },
    { total: 0, count: 1, base: 0, remainder: 0, shares: [0] },
    { total: 2, count: 4, base: 0, remainder: 2, shares: [1, 1, 0, 0] },
  ]) {
    it(`splits ${total} cents among ${count} participants`, () => {
      const result = splitBillAmount(total, count);
      assert.deepStrictEqual(result, {
        totalAmountCents: total,
        participantCount: count,
        baseShareCents: base,
        remainderCents: remainder,
        sharesCents: shares,
      });
      assert.strictEqual(result.sharesCents.reduce((sum, share) => sum + share, 0), total);
    });
  }

  it('conserves the maximum safe integer amount', () => {
    for (const count of [1, 2, 3, 7]) {
      const result = splitBillAmount(Number.MAX_SAFE_INTEGER, count);
      assert.strictEqual(result.sharesCents.length, count);
      assert.strictEqual(result.sharesCents.reduce((sum, share) => sum + share, 0), Number.MAX_SAFE_INTEGER);
      assert.ok(result.sharesCents.every(Number.isSafeInteger));
      assert.strictEqual(result.sharesCents[0] - result.sharesCents[count - 1], count === 1 ? 0 : 1);
    }
  });

  it('rejects non-safe-integer inputs with TypeError', () => {
    for (const value of [NaN, Infinity, -Infinity, 1.5, -1.5, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1]) {
      assert.throws(() => splitBillAmount(value, 3), TypeError);
      assert.throws(() => splitBillAmount(1000, value), TypeError);
    }
  });

  it('rejects negative amounts and participant counts below 1 with RangeError', () => {
    assert.throws(() => splitBillAmount(-1, 3), RangeError);
    assert.throws(() => splitBillAmount(1000, 0), RangeError);
    assert.throws(() => splitBillAmount(1000, -1), RangeError);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBondSlashing } from '../src/lib/discipline/bond-slashing';

describe('Commitment bond forfeiture slashing curves', () => {
  it('returns an intact bond with zero penalty at 0 minutes of lateness', () => {
    const result = calculateBondSlashing(0, { stakedBondCents: 10000 });
    assert.deepEqual(result, {
      stakedBondCents: 10000,
      latenessMinutes: 0,
      slashedAmountCents: 0,
      refundAmountCents: 10000,
      slashedPercentage: 0,
      status: 'intact',
    });
  });

  it('applies a 100% refund for lateness within the grace period (including the boundary)', () => {
    for (const late of [1, 7, 14, 15]) {
      for (const model of ['linear', 'quadratic', 'grace_cliff'] as const) {
        const result = calculateBondSlashing(late, { stakedBondCents: 10000, model });
        assert.equal(result.slashedAmountCents, 0, `late=${late} model=${model}`);
        assert.equal(result.refundAmountCents, 10000);
        assert.equal(result.status, 'intact');
      }
    }
  });

  it('linear model scales proportionally past grace (floored integer cents)', () => {
    // 82 minutes past a 15-minute grace, over a 165-minute span: 10000 * 82 / 165 = 4969.69
    const result = calculateBondSlashing(97, { stakedBondCents: 10000, model: 'linear' });
    assert.equal(result.slashedAmountCents, 4969);
    assert.equal(result.refundAmountCents, 5031);
    assert.equal(result.status, 'partially_slashed');
  });

  it('quadratic model ramps slower than linear at the same lateness', () => {
    // 10000 * 82^2 / 165^2 = 2469.7 -> 2469
    const quadratic = calculateBondSlashing(97, { stakedBondCents: 10000, model: 'quadratic' });
    const linear = calculateBondSlashing(97, { stakedBondCents: 10000, model: 'linear' });
    assert.equal(quadratic.slashedAmountCents, 2469);
    assert.ok(quadratic.slashedAmountCents < linear.slashedAmountCents);
  });

  it('defaults to the quadratic model when no model is given', () => {
    const implicit = calculateBondSlashing(97, { stakedBondCents: 10000 });
    const explicit = calculateBondSlashing(97, { stakedBondCents: 10000, model: 'quadratic' });
    assert.deepEqual(implicit, explicit);
  });

  it('grace_cliff model applies an instant 25% slash, then ramps linearly to 100%', () => {
    // 25% of 10000 = 2500 cliff, plus 75% ramp over 82/165 of the span:
    // 10000 * (25*165 + 75*82) / (100*165) = 6227.27 -> 6227
    const result = calculateBondSlashing(97, { stakedBondCents: 10000, model: 'grace_cliff' });
    assert.equal(result.slashedAmountCents, 6227);
    assert.ok(result.slashedAmountCents >= 2500);
  });

  it('grace_cliff is exactly 25% immediately after the grace period ends', () => {
    // Just past grace, the ramp contributes a negligible amount (1 minute of 165).
    const result = calculateBondSlashing(16, { stakedBondCents: 16500, model: 'grace_cliff' });
    // 16500 * (25*165 + 75*1) / (100*165) = 16500 * 4200 / 16500 = 4200
    assert.equal(result.slashedAmountCents, 4200);
  });

  it('forfeits 100% of the bond at and beyond the maximum lateness', () => {
    for (const late of [180, 181, 10000]) {
      for (const model of ['linear', 'quadratic', 'grace_cliff'] as const) {
        const result = calculateBondSlashing(late, { stakedBondCents: 5000, model });
        assert.equal(result.slashedAmountCents, 5000, `late=${late} model=${model}`);
        assert.equal(result.refundAmountCents, 0);
        assert.equal(result.slashedPercentage, 100);
        assert.equal(result.status, 'total_forfeiture');
      }
    }
  });

  it('honours custom grace and maximum lateness values', () => {
    // grace 0, max 100: at 50 minutes linear is exactly 50%
    const result = calculateBondSlashing(50, {
      stakedBondCents: 1000,
      gracePeriodMinutes: 0,
      maximumLatenessMinutes: 100,
      model: 'linear',
    });
    assert.equal(result.slashedAmountCents, 500);
    assert.equal(result.slashedPercentage, 50);
  });

  it('rounds penalties down to whole cents (no fractional or over-slashed amounts)', () => {
    // 3 cents * 82 / 165 = 1.49 -> 1 cent slashed, 2 refunded
    const result = calculateBondSlashing(97, { stakedBondCents: 3, model: 'linear' });
    assert.equal(result.slashedAmountCents, 1);
    assert.equal(result.refundAmountCents, 2);
    assert.equal(Number.isInteger(result.slashedAmountCents), true);
    assert.equal(result.slashedAmountCents + result.refundAmountCents, 3);
  });

  it('throws RangeError for a non-positive bond or negative lateness', () => {
    assert.throws(() => calculateBondSlashing(10, { stakedBondCents: 0 }), RangeError);
    assert.throws(() => calculateBondSlashing(10, { stakedBondCents: -100 }), RangeError);
    assert.throws(() => calculateBondSlashing(-1, { stakedBondCents: 1000 }), RangeError);
  });

  it('throws RangeError for a non-integer bond (fractional cents)', () => {
    assert.throws(() => calculateBondSlashing(10, { stakedBondCents: 100.7 }), RangeError);
  });
});

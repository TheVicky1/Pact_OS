import { describe, expect, it } from 'vitest';
import {
  calculateEscrowSettlement,
  splitCentsByShares,
  type BeneficiaryShare,
} from '../src/lib/finance/escrow-splitter';

const beneficiaries: BeneficiaryShare[] = [
  { id: 'partner', name: 'Partner', percentageBasisPoints: 5000 },
  { id: 'charity', name: 'Charity', percentageBasisPoints: 4000 },
  { id: 'pool', name: 'Platform pool', percentageBasisPoints: 1000 },
];

describe('splitCentsByShares', () => {
  it('preserves every cent when distributing an odd amount', () => {
    const shares = [
      { id: 'a', name: 'A', percentageBasisPoints: 3333 },
      { id: 'b', name: 'B', percentageBasisPoints: 3333 },
      { id: 'c', name: 'C', percentageBasisPoints: 3334 },
    ];

    expect(splitCentsByShares(1000, shares)).toEqual([
      { beneficiaryId: 'a', name: 'A', allocatedCents: 333 },
      { beneficiaryId: 'b', name: 'B', allocatedCents: 333 },
      { beneficiaryId: 'c', name: 'C', allocatedCents: 334 },
    ]);
  });

  it('resolves equal remainders in the original beneficiary order', () => {
    const shares = [
      { id: 'first', name: 'First', percentageBasisPoints: 5000 },
      { id: 'second', name: 'Second', percentageBasisPoints: 5000 },
    ];

    expect(splitCentsByShares(1, shares)).toEqual([
      { beneficiaryId: 'first', name: 'First', allocatedCents: 1 },
      { beneficiaryId: 'second', name: 'Second', allocatedCents: 0 },
    ]);
  });

  it('distributes a single penny deterministically', () => {
    expect(splitCentsByShares(1, beneficiaries)).toEqual([
      { beneficiaryId: 'partner', name: 'Partner', allocatedCents: 1 },
      { beneficiaryId: 'charity', name: 'Charity', allocatedCents: 0 },
      { beneficiaryId: 'pool', name: 'Platform pool', allocatedCents: 0 },
    ]);
  });

  it('returns zero payouts for a zero amount', () => {
    expect(splitCentsByShares(0, beneficiaries)).toEqual([
      { beneficiaryId: 'partner', name: 'Partner', allocatedCents: 0 },
      { beneficiaryId: 'charity', name: 'Charity', allocatedCents: 0 },
      { beneficiaryId: 'pool', name: 'Platform pool', allocatedCents: 0 },
    ]);
  });

  it.each([
    ['negative total', -1, beneficiaries],
    ['fractional total', 1.5, beneficiaries],
    ['invalid basis point sum', 100, [{ id: 'invalid', name: 'Invalid', percentageBasisPoints: 9999 }]],
    ['negative basis points', 100, [{ id: 'invalid', name: 'Invalid', percentageBasisPoints: -1 }]],
    ['fractional basis points', 100, [{ id: 'invalid', name: 'Invalid', percentageBasisPoints: 10000.5 }]],
  ])('throws RangeError for %s', (_caseName, totalCents, shares) => {
    expect(() => splitCentsByShares(totalCents, shares)).toThrow(RangeError);
  });
});

describe('calculateEscrowSettlement', () => {
  it('returns a full refund at 100% completion', () => {
    expect(calculateEscrowSettlement(1000, 30, 30, beneficiaries)).toEqual({
      totalStakeCents: 1000,
      refundCents: 1000,
      forfeitedCents: 0,
      completionPercentage: 100,
      beneficiaryPayouts: [
        { beneficiaryId: 'partner', name: 'Partner', allocatedCents: 0 },
        { beneficiaryId: 'charity', name: 'Charity', allocatedCents: 0 },
        { beneficiaryId: 'pool', name: 'Platform pool', allocatedCents: 0 },
      ],
    });
  });

  it('forfeits the full stake at 0% completion', () => {
    expect(calculateEscrowSettlement(1000, 0, 30, beneficiaries)).toEqual({
      totalStakeCents: 1000,
      refundCents: 0,
      forfeitedCents: 1000,
      completionPercentage: 0,
      beneficiaryPayouts: [
        { beneficiaryId: 'partner', name: 'Partner', allocatedCents: 500 },
        { beneficiaryId: 'charity', name: 'Charity', allocatedCents: 400 },
        { beneficiaryId: 'pool', name: 'Platform pool', allocatedCents: 100 },
      ],
    });
  });

  it('clamps completion above the target to a full refund', () => {
    const settlement = calculateEscrowSettlement(1000, 31, 30, beneficiaries);

    expect(settlement.completionPercentage).toBe(100);
    expect(settlement.refundCents + settlement.forfeitedCents).toBe(1000);
    expect(settlement.refundCents).toBe(1000);
  });

  it('uses largest remainder when the completion ratio creates a fractional cent', () => {
    const settlement = calculateEscrowSettlement(1, 1, 3, beneficiaries);

    expect(settlement.completionPercentage).toBeCloseTo(33.333333);
    expect(settlement.refundCents + settlement.forfeitedCents).toBe(1);
    expect(settlement.refundCents).toBe(0);
    expect(settlement.forfeitedCents).toBe(1);
  });

  it.each([
    ['negative stake', -1, 0, 1, beneficiaries],
    ['fractional stake', 1.5, 0, 1, beneficiaries],
    ['negative completed count', 100, -1, 1, beneficiaries],
    ['fractional completed count', 100, 1.5, 2, beneficiaries],
    ['non-positive target count', 100, 0, 0, beneficiaries],
    ['fractional target count', 100, 0, 1.5, beneficiaries],
  ])('throws RangeError for %s', (_caseName, stake, completed, target, shares) => {
    expect(() => calculateEscrowSettlement(stake, completed, target, shares)).toThrow(RangeError);
  });
});

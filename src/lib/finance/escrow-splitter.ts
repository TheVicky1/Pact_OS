/**
 * A beneficiary's percentage of a forfeited stake, expressed in basis points.
 */
export interface BeneficiaryShare {
  id: string;
  name: string;
  percentageBasisPoints: number;
}

export interface BeneficiaryPayout {
  beneficiaryId: string;
  name: string;
  allocatedCents: number;
}

export interface EscrowSettlement {
  totalStakeCents: number;
  refundCents: number;
  forfeitedCents: number;
  completionPercentage: number;
  beneficiaryPayouts: BeneficiaryPayout[];
}

const BASIS_POINTS_TOTAL = BigInt(10_000);

function assertNonNegativeSafeInteger(value: number, fieldName: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${fieldName} must be a non-negative safe integer, received: ${value}`);
  }
}

function validateBeneficiaryShares(beneficiaries: BeneficiaryShare[]): void {
  let totalBasisPoints = 0;

  for (const beneficiary of beneficiaries) {
    assertNonNegativeSafeInteger(beneficiary.percentageBasisPoints, 'percentageBasisPoints');
    totalBasisPoints += beneficiary.percentageBasisPoints;
  }

  if (totalBasisPoints !== Number(BASIS_POINTS_TOTAL)) {
    throw new RangeError(`Beneficiary percentage basis points must sum to 10000, received: ${totalBasisPoints}`);
  }
}

/**
 * Splits an integer-cent amount using the Largest Remainder Method.
 *
 * Floors every exact share first, then assigns remaining cents to the largest
 * fractional remainders. Equal remainders retain the original beneficiary order.
 */
export function splitCentsByShares(
  totalCents: number,
  beneficiaries: BeneficiaryShare[]
): BeneficiaryPayout[] {
  assertNonNegativeSafeInteger(totalCents, 'totalCents');
  validateBeneficiaryShares(beneficiaries);

  const totalCentsBigInt = BigInt(totalCents);
  const allocations = beneficiaries.map((beneficiary, index) => {
    const numerator = totalCentsBigInt * BigInt(beneficiary.percentageBasisPoints);

    return {
      beneficiary,
      index,
      allocatedCents: numerator / BASIS_POINTS_TOTAL,
      remainder: numerator % BASIS_POINTS_TOTAL,
    };
  });

  const allocatedCents = allocations.reduce((sum, allocation) => sum + allocation.allocatedCents, BigInt(0));
  let remainingCents = totalCentsBigInt - allocatedCents;

  allocations.sort((left, right) => {
    if (left.remainder === right.remainder) {
      return left.index - right.index;
    }

    return left.remainder > right.remainder ? -1 : 1;
  });

  for (let index = 0; index < allocations.length && remainingCents > BigInt(0); index++) {
    allocations[index].allocatedCents += BigInt(1);
    remainingCents -= BigInt(1);
  }

  return allocations
    .sort((left, right) => left.index - right.index)
    .map(({ beneficiary, allocatedCents }) => ({
      beneficiaryId: beneficiary.id,
      name: beneficiary.name,
      allocatedCents: Number(allocatedCents),
    }));
}

/**
 * Calculates the refund and beneficiary split for a completed commitment.
 *
 * Refund and forfeiture are allocated with the Largest Remainder Method, so
 * their sum always equals the original integer-cent stake.
 */
export function calculateEscrowSettlement(
  totalStakeCents: number,
  completedCount: number,
  targetCount: number,
  beneficiaries: BeneficiaryShare[]
): EscrowSettlement {
  assertNonNegativeSafeInteger(totalStakeCents, 'totalStakeCents');
  assertNonNegativeSafeInteger(completedCount, 'completedCount');

  if (!Number.isSafeInteger(targetCount) || targetCount <= 0) {
    throw new RangeError(`targetCount must be a positive safe integer, received: ${targetCount}`);
  }

  const effectiveCompletedCount = Math.min(completedCount, targetCount);
  const completionPercentage = (effectiveCompletedCount / targetCount) * 100;
  const targetCountBigInt = BigInt(targetCount);
  const refundNumerator = BigInt(totalStakeCents) * BigInt(effectiveCompletedCount);
  const refundBaseCents = refundNumerator / targetCountBigInt;
  const refundRemainder = refundNumerator % targetCountBigInt;
  const refundCents =
    refundRemainder * BigInt(2) >= targetCountBigInt ? refundBaseCents + BigInt(1) : refundBaseCents;
  const forfeitedCents = BigInt(totalStakeCents) - refundCents;

  return {
    totalStakeCents,
    refundCents: Number(refundCents),
    forfeitedCents: Number(forfeitedCents),
    completionPercentage,
    beneficiaryPayouts: splitCentsByShares(Number(forfeitedCents), beneficiaries),
  };
}

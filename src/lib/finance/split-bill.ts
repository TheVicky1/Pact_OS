export interface SplitBillResult {
  /** Original total amount in cents */
  totalAmountCents: number;
  /** Number of participants */
  participantCount: number;
  /** Base share per participant in cents (Math.floor(total / count)) */
  baseShareCents: number;
  /** Number of remainder cents distributed */
  remainderCents: number;
  /** Array of individual share amounts in cents whose sum strictly equals totalAmountCents */
  sharesCents: number[];
}

export function splitBillAmount(
  totalAmountCents: number,
  participantCount: number
): SplitBillResult {
  if (!Number.isSafeInteger(totalAmountCents) || !Number.isSafeInteger(participantCount)) {
    throw new TypeError('Amount and participant count must be safe integers.');
  }
  if (totalAmountCents < 0 || participantCount < 1) {
    throw new RangeError('Amount must be non-negative and participant count must be at least 1.');
  }

  const baseShareCents = Math.floor(totalAmountCents / participantCount);
  const remainderCents = totalAmountCents % participantCount;
  const sharesCents = Array.from({ length: participantCount }, (_, index) =>
    baseShareCents + (index < remainderCents ? 1 : 0)
  );

  return { totalAmountCents, participantCount, baseShareCents, remainderCents, sharesCents };
}

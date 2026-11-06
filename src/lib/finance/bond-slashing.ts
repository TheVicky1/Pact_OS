export interface SlashingPolicy {
  penaltyTiersPercentage: number[]; // e.g. [0, 10, 25, 50, 100]
  charitySplitFraction: number;      // e.g. 0.80 to charity, 0.20 to accountability partner
  comebackStreakForReset: number;    // e.g. 7 consecutive successes removes 1 strike
}

export interface SlashingAssessmentResult {
  currentStrikeCount: number;
  penaltyPercentage: number;
  slashedAmountCents: number;
  remainingBondCents: number;
  charityDisbursementCents: number;
  partnerDisbursementCents: number;
  isFullyLiquidated: boolean;
  consequenceSummary: string;
}

export const DEFAULT_SLASHING_POLICY: SlashingPolicy = {
  penaltyTiersPercentage: [0, 10, 25, 50, 100],
  charitySplitFraction: 0.8,
  comebackStreakForReset: 7,
};

function assertNonNegativeSafeInteger(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be a safe integer.`);
  }
  if (value < 0) {
    throw new RangeError(`${name} must be a non-negative integer (>= 0).`);
  }
}

function assertSafeInteger(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be a safe integer.`);
  }
}

function resolveSlashingPolicy(policy?: Partial<SlashingPolicy>): SlashingPolicy {
  const resolved: SlashingPolicy = {
    penaltyTiersPercentage:
      policy?.penaltyTiersPercentage !== undefined
        ? policy.penaltyTiersPercentage
        : DEFAULT_SLASHING_POLICY.penaltyTiersPercentage,
    charitySplitFraction:
      policy?.charitySplitFraction !== undefined
        ? policy.charitySplitFraction
        : DEFAULT_SLASHING_POLICY.charitySplitFraction,
    comebackStreakForReset:
      policy?.comebackStreakForReset !== undefined
        ? policy.comebackStreakForReset
        : DEFAULT_SLASHING_POLICY.comebackStreakForReset,
  };

  if (
    typeof resolved.charitySplitFraction !== 'number' ||
    Number.isNaN(resolved.charitySplitFraction) ||
    !Number.isFinite(resolved.charitySplitFraction)
  ) {
    throw new TypeError('charitySplitFraction must be a valid finite number.');
  }
  if (resolved.charitySplitFraction < 0 || resolved.charitySplitFraction > 1) {
    throw new RangeError('charitySplitFraction must be between 0 and 1 inclusive.');
  }

  if (
    typeof resolved.comebackStreakForReset !== 'number' ||
    !Number.isSafeInteger(resolved.comebackStreakForReset)
  ) {
    throw new TypeError('comebackStreakForReset must be a safe integer.');
  }
  if (resolved.comebackStreakForReset <= 0) {
    throw new RangeError('comebackStreakForReset must be a positive integer (> 0).');
  }

  if (!Array.isArray(resolved.penaltyTiersPercentage)) {
    throw new TypeError('penaltyTiersPercentage must be an array of numbers.');
  }
  for (const tier of resolved.penaltyTiersPercentage) {
    if (typeof tier !== 'number' || Number.isNaN(tier) || !Number.isFinite(tier)) {
      throw new TypeError('All penaltyTiersPercentage entries must be valid finite numbers.');
    }
    if (tier < 0 || tier > 100) {
      throw new RangeError('All penaltyTiersPercentage entries must be between 0 and 100.');
    }
  }

  return resolved;
}

function formatCentsAsDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateSlashingPenalty(
  stakedAmountCents: number,
  consecutiveBreaches: number,
  policy?: Partial<SlashingPolicy>
): SlashingAssessmentResult {
  assertNonNegativeSafeInteger(stakedAmountCents, 'stakedAmountCents');
  assertSafeInteger(consecutiveBreaches, 'consecutiveBreaches');
  const resolvedPolicy = resolveSlashingPolicy(policy);

  if (consecutiveBreaches <= 0) {
    return {
      currentStrikeCount: 0,
      penaltyPercentage: 0,
      slashedAmountCents: 0,
      remainingBondCents: stakedAmountCents,
      charityDisbursementCents: 0,
      partnerDisbursementCents: 0,
      isFullyLiquidated: false,
      consequenceSummary: `No breaches recorded. Full bond of ${formatCentsAsDollars(
        stakedAmountCents
      )} remains intact (0% penalty).`,
    };
  }

  const tierIndex = consecutiveBreaches - 1;
  const rawPenaltyPercentage =
    tierIndex < resolvedPolicy.penaltyTiersPercentage.length
      ? resolvedPolicy.penaltyTiersPercentage[tierIndex]
      : 100;
  const penaltyPercentage = Math.min(100, Math.max(0, rawPenaltyPercentage));

  const slashedAmountCents = Math.round(stakedAmountCents * (penaltyPercentage / 100)) + 0;
  const remainingBondCents = stakedAmountCents - slashedAmountCents;
  const charityDisbursementCents =
    Math.round(slashedAmountCents * resolvedPolicy.charitySplitFraction) + 0;
  const partnerDisbursementCents = slashedAmountCents - charityDisbursementCents;
  const isFullyLiquidated = remainingBondCents === 0 || penaltyPercentage >= 100;

  let consequenceSummary: string;
  if (isFullyLiquidated) {
    consequenceSummary = `Strike ${consecutiveBreaches}: Bond fully liquidated (${penaltyPercentage}% penalty, ${formatCentsAsDollars(
      slashedAmountCents
    )} slashed: ${formatCentsAsDollars(
      charityDisbursementCents
    )} to charity, ${formatCentsAsDollars(partnerDisbursementCents)} to partner).`;
  } else if (penaltyPercentage === 0) {
    consequenceSummary = `Strike ${consecutiveBreaches} warning: 0% penalty applied (${formatCentsAsDollars(
      0
    )} slashed). Remaining bond: ${formatCentsAsDollars(remainingBondCents)}.`;
  } else {
    consequenceSummary = `Strike ${consecutiveBreaches}: ${penaltyPercentage}% penalty applied (${formatCentsAsDollars(
      slashedAmountCents
    )} slashed: ${formatCentsAsDollars(
      charityDisbursementCents
    )} to charity, ${formatCentsAsDollars(
      partnerDisbursementCents
    )} to partner). Remaining bond: ${formatCentsAsDollars(remainingBondCents)}.`;
  }

  return {
    currentStrikeCount: consecutiveBreaches,
    penaltyPercentage,
    slashedAmountCents,
    remainingBondCents,
    charityDisbursementCents,
    partnerDisbursementCents,
    isFullyLiquidated,
    consequenceSummary,
  };
}

export function evaluateComebackStrikeReduction(
  currentStrikes: number,
  consecutiveSuccessfulDays: number,
  policy?: Partial<SlashingPolicy>
): { updatedStrikes: number; strikesForgiven: number; daysUntilNextForgiveness: number } {
  assertNonNegativeSafeInteger(currentStrikes, 'currentStrikes');
  assertNonNegativeSafeInteger(consecutiveSuccessfulDays, 'consecutiveSuccessfulDays');
  const resolvedPolicy = resolveSlashingPolicy(policy);

  const { comebackStreakForReset } = resolvedPolicy;
  const rawForgiven = Math.floor(consecutiveSuccessfulDays / comebackStreakForReset);
  const updatedStrikes = Math.max(0, currentStrikes - rawForgiven);
  const strikesForgiven = currentStrikes - updatedStrikes;
  const daysUntilNextForgiveness =
    comebackStreakForReset - (consecutiveSuccessfulDays % comebackStreakForReset);

  return {
    updatedStrikes,
    strikesForgiven,
    daysUntilNextForgiveness,
  };
}

export type SlashingModel = 'linear' | 'quadratic' | 'grace_cliff';

export interface SlashingConfig {
  stakedBondCents: number;
  gracePeriodMinutes?: number;
  maximumLatenessMinutes?: number;
  model?: SlashingModel;
}

export interface SlashingAssessment {
  stakedBondCents: number;
  latenessMinutes: number;
  slashedAmountCents: number;
  refundAmountCents: number;
  slashedPercentage: number;
  status: 'intact' | 'partially_slashed' | 'total_forfeiture';
}

const DEFAULT_GRACE_PERIOD_MINUTES = 15;
const DEFAULT_MAXIMUM_LATENESS_MINUTES = 180;
const GRACE_CLIFF_INITIAL_RATE = 0.25;

/** Calculate the forfeiture for a late commitment while keeping all bond amounts in cents. */
export function calculateBondSlashing(
  latenessMinutes: number,
  config: SlashingConfig,
): SlashingAssessment {
  const {
    stakedBondCents,
    gracePeriodMinutes = DEFAULT_GRACE_PERIOD_MINUTES,
    maximumLatenessMinutes = DEFAULT_MAXIMUM_LATENESS_MINUTES,
    model = 'quadratic',
  } = config;

  if (!Number.isSafeInteger(stakedBondCents) || stakedBondCents <= 0) {
    throw new RangeError('stakedBondCents must be a positive safe integer');
  }
  if (!Number.isFinite(latenessMinutes) || latenessMinutes < 0) {
    throw new RangeError('latenessMinutes must be a finite, non-negative number');
  }
  if (!Number.isSafeInteger(gracePeriodMinutes) || gracePeriodMinutes < 0) {
    throw new RangeError('gracePeriodMinutes must be a non-negative integer');
  }
  if (
    !Number.isSafeInteger(maximumLatenessMinutes)
    || maximumLatenessMinutes <= gracePeriodMinutes
  ) {
    throw new RangeError('maximumLatenessMinutes must be an integer greater than the grace period');
  }
  if (!['linear', 'quadratic', 'grace_cliff'].includes(model)) {
    throw new RangeError('model must be linear, quadratic, or grace_cliff');
  }

  const elapsedAfterGrace = latenessMinutes - gracePeriodMinutes;
  const progress = Math.min(
    1,
    Math.max(0, elapsedAfterGrace / (maximumLatenessMinutes - gracePeriodMinutes)),
  );

  let slashingRate = 0;
  if (elapsedAfterGrace > 0) {
    switch (model) {
      case 'linear':
        slashingRate = progress;
        break;
      case 'quadratic':
        slashingRate = progress ** 2;
        break;
      case 'grace_cliff':
        slashingRate = GRACE_CLIFF_INITIAL_RATE + progress * (1 - GRACE_CLIFF_INITIAL_RATE);
        break;
    }
  }

  const rawSlashedAmountCents = stakedBondCents * slashingRate;
  const lowerCents = Math.floor(rawSlashedAmountCents);
  const fractionalCent = rawSlashedAmountCents - lowerCents;
  // Normalize floating-point values that represent an exact half cent but land
  // just below .5 (for example, 100 * 0.145 is 14.499999999999998).
  const halfCentTolerance = Number.EPSILON * Math.max(1, Math.abs(rawSlashedAmountCents));
  const roundedSlashedAmountCents =
    fractionalCent > 0 && Math.abs(fractionalCent - 0.5) <= halfCentTolerance
      ? lowerCents + 1
      : Math.round(rawSlashedAmountCents);
  const slashedAmountCents = Math.min(stakedBondCents, roundedSlashedAmountCents);
  const refundAmountCents = stakedBondCents - slashedAmountCents;
  const slashedPercentage = (slashedAmountCents / stakedBondCents) * 100;

  return {
    stakedBondCents,
    latenessMinutes,
    slashedAmountCents,
    refundAmountCents,
    slashedPercentage,
    status:
      slashedAmountCents === 0
        ? 'intact'
        : slashedAmountCents === stakedBondCents
          ? 'total_forfeiture'
          : 'partially_slashed',
  };
}

/**
 * Commitment bond forfeiture slashing curves.
 *
 * Progressive slashing velocity: a grace period forgives minor lateness,
 * then the forfeited share ramps up according to the selected model.
 * All money math is integer cents (BigInt internally, so no float drift).
 */

export type SlashingModel = 'linear' | 'quadratic' | 'grace_cliff';

export interface SlashingConfig {
  stakedBondCents: number;
  gracePeriodMinutes?: number; // default: 15
  maximumLatenessMinutes?: number; // default: 180 (3 hours before 100% loss)
  model?: SlashingModel; // default: 'quadratic'
}

export interface SlashingAssessment {
  stakedBondCents: number;
  latenessMinutes: number;
  slashedAmountCents: number; // penalty forfeited
  refundAmountCents: number; // residual preserved
  slashedPercentage: number; // 0 to 100
  status: 'intact' | 'partially_slashed' | 'total_forfeiture';
}

const DEFAULT_GRACE_MINUTES = 15;
const DEFAULT_MAX_LATENESS_MINUTES = 180;
const GRACE_CLIFF_INITIAL_PERCENT = 25;

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number, got ${value}`);
  }
}

export function calculateBondSlashing(
  latenessMinutes: number,
  config: SlashingConfig
): SlashingAssessment {
  const { stakedBondCents } = config;
  if (!Number.isInteger(stakedBondCents) || stakedBondCents <= 0) {
    throw new RangeError(`stakedBondCents must be a positive integer number of cents, got ${stakedBondCents}`);
  }
  assertFiniteNonNegative(latenessMinutes, 'latenessMinutes');

  const grace = config.gracePeriodMinutes ?? DEFAULT_GRACE_MINUTES;
  const maximum = config.maximumLatenessMinutes ?? DEFAULT_MAX_LATENESS_MINUTES;
  const model: SlashingModel = config.model ?? 'quadratic';
  assertFiniteNonNegative(grace, 'gracePeriodMinutes');
  assertFiniteNonNegative(maximum, 'maximumLatenessMinutes');

  const staked = BigInt(Math.trunc(stakedBondCents));
  let slashed = BigInt(0);

  if (latenessMinutes > grace) {
    const span = Math.max(maximum - grace, 0);
    const over = latenessMinutes - grace;

    if (span === 0 || over >= span) {
      slashed = staked;
    } else {
      const x = BigInt(Math.floor(over));
      const s = BigInt(Math.floor(span));
      switch (model) {
        case 'linear':
          slashed = (staked * x) / s;
          break;
        case 'quadratic':
          slashed = (staked * x * x) / (s * s);
          break;
        case 'grace_cliff': {
          // 25% instant slash, then linear ramp from 25% to 100% over the span.
          const cliff = BigInt(GRACE_CLIFF_INITIAL_PERCENT);
          const ramp = BigInt(100) - cliff;
          slashed = (staked * (cliff * s + ramp * x)) / (BigInt(100) * s);
          break;
        }
        default:
          throw new RangeError(`Unknown slashing model: ${String(model)}`);
      }
    }
  }

  const slashedAmountCents = Number(slashed);
  const refundAmountCents = stakedBondCents - slashedAmountCents;
  const slashedPercentage = (slashedAmountCents / stakedBondCents) * 100;

  let status: SlashingAssessment['status'];
  if (slashedAmountCents === 0) {
    status = 'intact';
  } else if (slashedAmountCents >= stakedBondCents) {
    status = 'total_forfeiture';
  } else {
    status = 'partially_slashed';
  }

  return {
    stakedBondCents,
    latenessMinutes,
    slashedAmountCents,
    refundAmountCents,
    slashedPercentage,
    status,
  };
}

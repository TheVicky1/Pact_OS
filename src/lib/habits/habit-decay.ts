/**
 * Habit Strength Decay & Half-Life Calculator
 *
 * Models residual habit strength and neurological retention during periods
 * without check-ins using an exponential half-life decay function:
 *   S(t) = S0 * 2^(-t / t_half)
 *
 * Combats the demoralizing "all-or-nothing" psychological pitfall by providing
 * users with residual strength tiers and actionable recovery recommendations.
 *
 * @module src/lib/habits/habit-decay
 */

export interface HabitDecayOptions {
  /** Half-life in days before strength decays by 50% (default: 7) */
  halfLifeDays?: number;
  /** Minimum residual strength floor between 0 and 100 (default: 0) */
  minStrengthFloor?: number;
}

export type HabitDecayStatus = 'solid' | 'fading' | 'at_risk' | 'dormant';

export interface HabitDecayAssessment {
  /** Current calculated strength score (0.0 to 100.0, rounded to 1 decimal) */
  currentStrength: number;
  /** Ratio of original strength retained (0.0 to 1.0, 4 decimals) */
  retentionFraction: number;
  /** Categorized retention status tier */
  status: HabitDecayStatus;
  /** Guidance recommendation */
  recommendation: string;
}

const RECOMMENDATIONS: Record<HabitDecayStatus, string> = {
  solid: 'Habit neural pathway is well-preserved.',
  fading: 'Strength is fading. A quick check-in will restore momentum.',
  at_risk: 'High risk of habit drop-off. Initiate a two-minute comeback.',
  dormant: 'Habit has become dormant. Re-anchor with a tiny trigger.',
};

/**
 * Rounds a number to 1 decimal place.
 */
function roundTo1Decimal(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * Rounds a number to 4 decimal places.
 */
function roundTo4Decimals(val: number): number {
  return Math.round(val * 10000) / 10000;
}

/**
 * Categorizes current strength into a status tier.
 */
function determineStatus(currentStrength: number): HabitDecayStatus {
  if (currentStrength >= 80) {
    return 'solid';
  }
  if (currentStrength >= 50) {
    return 'fading';
  }
  if (currentStrength >= 20) {
    return 'at_risk';
  }
  return 'dormant';
}

/**
 * Calculates exponential habit strength decay and retention after missed check-ins.
 *
 * @param initialStrength - Starting habit strength score (0 to 100).
 * @param daysSinceLastCheckIn - Elapsed days since the last check-in (>= 0).
 * @param options - Optional decay parameters (halfLifeDays, minStrengthFloor).
 * @returns HabitDecayAssessment with current strength, retention fraction, status tier, and recommendation.
 * @throws {TypeError} If initialStrength or daysSinceLastCheckIn is not a finite number.
 * @throws {RangeError} If initialStrength < 0 or > 100, daysSinceLastCheckIn < 0, halfLifeDays <= 0, or minStrengthFloor < 0 or > 100.
 */
export function calculateHabitStrengthDecay(
  initialStrength: number,
  daysSinceLastCheckIn: number,
  options?: HabitDecayOptions
): HabitDecayAssessment {
  if (typeof initialStrength !== 'number' || !Number.isFinite(initialStrength)) {
    throw new TypeError('initialStrength must be a finite number');
  }

  if (typeof daysSinceLastCheckIn !== 'number' || !Number.isFinite(daysSinceLastCheckIn)) {
    throw new TypeError('daysSinceLastCheckIn must be a finite number');
  }

  if (initialStrength < 0 || initialStrength > 100) {
    throw new RangeError('initialStrength must be between 0 and 100');
  }

  if (daysSinceLastCheckIn < 0) {
    throw new RangeError('daysSinceLastCheckIn must be non-negative');
  }

  const halfLifeDays = options?.halfLifeDays ?? 7;
  const minStrengthFloor = options?.minStrengthFloor ?? 0;

  if (typeof halfLifeDays !== 'number' || !Number.isFinite(halfLifeDays)) {
    throw new TypeError('halfLifeDays must be a finite number');
  }

  if (halfLifeDays <= 0) {
    throw new RangeError('halfLifeDays must be greater than 0');
  }

  if (typeof minStrengthFloor !== 'number' || !Number.isFinite(minStrengthFloor)) {
    throw new TypeError('minStrengthFloor must be a finite number');
  }

  if (minStrengthFloor < 0 || minStrengthFloor > 100) {
    throw new RangeError('minStrengthFloor must be between 0 and 100');
  }

  // S(t) = S0 * 2^(-t / t_half)
  const rawStrength = initialStrength * Math.pow(2, -daysSinceLastCheckIn / halfLifeDays);

  // Clamp decay to the effective floor without allowing minStrengthFloor to exceed initialStrength
  const effectiveFloor = Math.min(initialStrength, minStrengthFloor);
  const clamped = Math.max(effectiveFloor, Math.min(initialStrength, rawStrength));
  const currentStrength = roundTo1Decimal(clamped);

  // Calculate retention fraction from unrounded clamped strength to preserve ratio precision
  const retentionFraction =
    initialStrength === 0 ? 0.0 : roundTo4Decimals(clamped / initialStrength);

  const status = determineStatus(currentStrength);
  const recommendation = RECOMMENDATIONS[status];

  return {
    currentStrength,
    retentionFraction,
    status,
    recommendation,
  };
}

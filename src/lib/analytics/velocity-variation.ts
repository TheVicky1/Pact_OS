/**
 * Task Completion Velocity Coefficient of Variation (CV) & Stability Index
 *
 * Evaluates throughput consistency and dispersion across sprint periods
 * using the Coefficient of Variation (CV = SD / Mean) to derive a normalized
 * Stability Score (0 to 100) and stability tier.
 *
 * @module src/lib/analytics/velocity-variation
 */

export type ExecutionStabilityTier =
  | 'hyper-stable'
  | 'steady'
  | 'volatile'
  | 'erratic';

export interface VelocityStabilityMetrics {
  periodCount: number;
  meanVelocity: number;
  variance: number;
  standardDeviation: number;
  coefficientOfVariation: number; // CV = SD / Mean
  stabilityScore: number; // 0 (erratic) to 100 (perfect stability)
  stabilityTier: ExecutionStabilityTier;
}

/**
 * Rounds a floating-point number to 4 decimal places using exponent shifting
 * to avoid IEEE 754 precision artifacts.
 */
function roundTo4Decimals(value: number): number {
  const rounded = Number(Math.round(Number(`${value}e4`)) + 'e-4');
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Derives the execution stability tier based on the Coefficient of Variation (CV).
 *
 * Tier thresholds:
 * - CV < 0.15: 'hyper-stable'
 * - 0.15 <= CV < 0.35: 'steady'
 * - 0.35 <= CV < 0.60: 'volatile'
 * - CV >= 0.60: 'erratic'
 */
function determineStabilityTier(cv: number): ExecutionStabilityTier {
  if (cv < 0.15) {
    return 'hyper-stable';
  }
  if (cv < 0.35) {
    return 'steady';
  }
  if (cv < 0.6) {
    return 'volatile';
  }
  return 'erratic';
}

/**
 * Calculates velocity dispersion metrics, sample variance, standard deviation,
 * Coefficient of Variation (CV), and the composite Stability Index.
 *
 * @param velocities - Array of task completion counts across periods (N >= 2).
 * @returns VelocityStabilityMetrics containing sample statistics and stability assessment.
 * @throws {TypeError} If velocities is not an array or contains non-finite numbers.
 * @throws {RangeError} If velocities has fewer than 2 periods or contains negative numbers.
 */
export function calculateVelocityStability(
  velocities: readonly number[]
): VelocityStabilityMetrics {
  if (!Array.isArray(velocities)) {
    throw new TypeError('velocities must be an array of numbers');
  }

  const periodCount = velocities.length;

  if (periodCount < 2) {
    throw new RangeError(
      `At least 2 periods are required to calculate velocity stability. Received: ${periodCount}`
    );
  }

  let sum = 0;
  for (let i = 0; i < periodCount; i++) {
    const val = velocities[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new TypeError(`Velocity at index ${i} must be a finite number. Received: ${val}`);
    }
    if (val < 0) {
      throw new RangeError(`Velocity at index ${i} cannot be negative. Received: ${val}`);
    }
    sum += val;
  }

  // Mean: mu = (1 / N) * sum(x_i)
  const mean = sum / periodCount;

  // Sample variance with Bessel's correction: s^2 = (1 / (N - 1)) * sum((x_i - mu)^2)
  let sumSquaredDiffs = 0;
  for (let i = 0; i < periodCount; i++) {
    const diff = velocities[i] - mean;
    sumSquaredDiffs += diff * diff;
  }
  const variance = sumSquaredDiffs / (periodCount - 1);
  const standardDeviation = Math.sqrt(variance);

  let rawCv = 0;
  let stabilityScore = 0;

  if (mean === 0) {
    // If mu = 0: CV = 0, stabilityScore = 0
    rawCv = 0;
    stabilityScore = 0;
  } else {
    // CV = SD / Mean
    rawCv = standardDeviation / mean;
    // stabilityScore = Math.round(Math.max(0, Math.min(100, (1 - Math.min(1, CV)) * 100)))
    stabilityScore = Math.round(
      Math.max(0, Math.min(100, (1 - Math.min(1, rawCv)) * 100))
    );
  }

  const roundedCv = roundTo4Decimals(rawCv);
  const stabilityTier = determineStabilityTier(roundedCv);

  return {
    periodCount,
    meanVelocity: roundTo4Decimals(mean),
    variance: roundTo4Decimals(variance),
    standardDeviation: roundTo4Decimals(standardDeviation),
    coefficientOfVariation: roundedCv,
    stabilityScore,
    stabilityTier,
  };
}

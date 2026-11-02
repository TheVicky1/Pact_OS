/**
 * PACT Accountability OS — Shannon Entropy Habit Routine Predictability & Chaos Index
 *
 * Implements Claude Shannon's Information Entropy to evaluate circadian habit predictability:
 *   H(X) = - \sum_{i=1}^{K} P(x_i) \log_2 P(x_i)
 *
 * Mathematical Invariants:
 *  1. Zero-Probability Boundary: 0 * \log_2(0) = 0 (prevents NaN or -Infinity).
 *  2. Normalized Metric Bounds: H_{norm} = H(X) / \log_2(K) \in [0.0000, 1.0000].
 *  3. Clockwork Consistency: Single concentrated hour yields H_{norm} = 0.0000.
 *  4. Maximum Disorder / Chaos: Uniform distribution across 24 bins yields H_{norm} = 1.0000.
 *  5. Sample Sufficiency Threshold: Samples < 5 classify as 'insufficient_data'.
 *
 * Tiers:
 *  - insufficient_data: < 5 recorded executions
 *  - clockwork: H_{norm} < 0.20 (deterministic, locked circadian execution)
 *  - structured: 0.20 <= H_{norm} < 0.50 (stable daily anchor with slight drift)
 *  - flexible: 0.50 <= H_{norm} < 0.80 (adaptive execution across multiple slots)
 *  - chaotic: H_{norm} >= 0.80 (high variance, unpredictable timing)
 *
 * @module src/lib/analytics/routine-entropy
 */

export type RoutinePredictabilityTier =
  | 'insufficient_data'
  | 'clockwork'
  | 'structured'
  | 'flexible'
  | 'chaotic';

export interface RoutineEntropyAssessment {
  sampleCount: number;
  distinctBinsObserved: number;
  rawEntropyBits: number;
  maxPossibleEntropyBits: number;
  normalizedEntropy: number;
  predictabilityTier: RoutinePredictabilityTier;
  hourlyDistribution: number[];
  dominantHour: number | null;
  stabilitySummary: string;
}

const DEFAULT_BIN_COUNT = 24;
const MINIMUM_RELIABLE_SAMPLES = 5;

/**
 * Rounds a number to a fixed number of decimal places without floating-point artifacts.
 */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Extracts the 24-hour bin [0..23] from various timestamp representations.
 */
export function extractHourFromTimestamp(input: string | number | Date): number {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new RangeError('Invalid Date object passed as timestamp');
    }
    return input.getUTCHours();
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || Number.isNaN(input)) {
      throw new TypeError(`Timestamp must be a finite number or valid string, received ${input}`);
    }
    // If integer in 0..23, treat directly as hour
    if (Number.isSafeInteger(input) && input >= 0 && input <= 23) {
      return input;
    }
    // Else treat as epoch millisecond
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw new RangeError(`Epoch timestamp ${input} is out of valid date range`);
    }
    return date.getUTCHours();
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new TypeError('Timestamp string cannot be empty');
    }

    // Check for HH:MM format
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(trimmed);
    if (timeMatch) {
      return parseInt(timeMatch[1], 10);
    }

    // Parse ISO date string
    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) {
      throw new RangeError(`Cannot parse invalid timestamp string: "${trimmed}"`);
    }
    return new Date(parsed).getUTCHours();
  }

  throw new TypeError(`Unsupported timestamp type: ${typeof input}`);
}

/**
 * Computes Shannon Entropy and habit routine predictability from recorded timestamp occurrences.
 *
 * @param timestamps List of execution timestamps (ISO strings, epoch ms, or hour integers 0..23).
 * @param binCount Total discrete time bins (default: 24 for circadian hourly breakdown).
 * @returns Comprehensive routine entropy assessment.
 */
export function calculateRoutineEntropy(
  timestamps: Array<string | number | Date>,
  binCount: number = DEFAULT_BIN_COUNT
): RoutineEntropyAssessment {
  if (!Array.isArray(timestamps)) {
    throw new TypeError('timestamps must be an array');
  }

  if (
    typeof binCount !== 'number' ||
    !Number.isSafeInteger(binCount) ||
    binCount <= 1
  ) {
    throw new RangeError(`binCount must be a safe integer > 1, received ${binCount}`);
  }

  const maxPossibleEntropyBits = roundTo(Math.log2(binCount), 4);
  const sampleCount = timestamps.length;

  // Insufficient data boundary check
  if (sampleCount < MINIMUM_RELIABLE_SAMPLES) {
    const emptyDist = new Array(binCount).fill(0);
    for (const item of timestamps) {
      const h = extractHourFromTimestamp(item) % binCount;
      emptyDist[h] += 1;
    }

    return {
      sampleCount,
      distinctBinsObserved: emptyDist.filter(c => c > 0).length,
      rawEntropyBits: 0.0,
      maxPossibleEntropyBits,
      normalizedEntropy: 1.0, // Conservative default
      predictabilityTier: 'insufficient_data',
      hourlyDistribution: emptyDist.map(c => (sampleCount > 0 ? roundTo(c / sampleCount, 4) : 0)),
      dominantHour: null,
      stabilitySummary: `Insufficient data: ${sampleCount}/${MINIMUM_RELIABLE_SAMPLES} required observations. Routine cannot be reliably modeled.`,
    };
  }

  // Count occurrences across discrete bins
  const binCounts = new Array(binCount).fill(0);
  for (const item of timestamps) {
    const hour = extractHourFromTimestamp(item) % binCount;
    binCounts[hour] += 1;
  }

  let distinctBinsObserved = 0;
  let dominantHour = 0;
  let maxCount = -1;

  for (let i = 0; i < binCount; i++) {
    if (binCounts[i] > 0) {
      distinctBinsObserved++;
    }
    if (binCounts[i] > maxCount) {
      maxCount = binCounts[i];
      dominantHour = i;
    }
  }

  // Calculate Shannon Entropy with strict 0 * log2(0) = 0 invariant
  let rawEntropy = 0;
  const probabilities: number[] = new Array(binCount);

  for (let i = 0; i < binCount; i++) {
    const count = binCounts[i];
    const p = count / sampleCount;
    probabilities[i] = roundTo(p, 4);

    if (p > 0) {
      rawEntropy -= p * Math.log2(p);
    }
  }

  // Safeguard against small floating point drift below 0
  rawEntropy = Math.max(0, rawEntropy);
  const rawEntropyBits = roundTo(rawEntropy, 4);

  // Normalize: H_norm = H(X) / log2(binCount)
  const rawNorm = rawEntropy / Math.log2(binCount);
  const normalizedEntropy = roundTo(Math.max(0.0, Math.min(1.0, rawNorm)), 4);

  // Determine Predictability Tier
  let predictabilityTier: RoutinePredictabilityTier;
  let stabilitySummary: string;

  if (normalizedEntropy < 0.20) {
    predictabilityTier = 'clockwork';
    stabilitySummary = `Clockwork routine: Extremely high predictability (H_norm = ${normalizedEntropy.toFixed(4)}). Primary execution anchored around ${dominantHour}:00 UTC.`;
  } else if (normalizedEntropy < 0.50) {
    predictabilityTier = 'structured';
    stabilitySummary = `Structured routine: Predictable habit with moderate circadian drift (H_norm = ${normalizedEntropy.toFixed(4)}). Primary execution around ${dominantHour}:00 UTC.`;
  } else if (normalizedEntropy < 0.80) {
    predictabilityTier = 'flexible';
    stabilitySummary = `Flexible routine: Habit executes across varied hours (H_norm = ${normalizedEntropy.toFixed(4)}). Dominant slot: ${dominantHour}:00 UTC.`;
  } else {
    predictabilityTier = 'chaotic';
    stabilitySummary = `Chaotic distribution: High entropy across ${distinctBinsObserved} separate bins (H_norm = ${normalizedEntropy.toFixed(4)}). Habit lacks a stable circadian trigger.`;
  }

  return {
    sampleCount,
    distinctBinsObserved,
    rawEntropyBits,
    maxPossibleEntropyBits,
    normalizedEntropy,
    predictabilityTier,
    hourlyDistribution: probabilities,
    dominantHour,
    stabilitySummary,
  };
}

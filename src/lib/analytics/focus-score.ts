/**
 * PACT OS — Focus Score & Daily Work Allocation Analytics
 *
 * Evaluates daily deep work volume, shallow work volume, and interruption penalties
 * to produce a single weighted composite Focus Score (0–100) and qualitative focus tier.
 */

export interface DailyFocusMetrics {
  deepWorkMinutes: number;
  shallowWorkMinutes: number;
  interruptionCount: number;
  targetDeepWorkMinutes?: number; // default: 240 (4 hours)
}

export type FocusTier = 'optimal' | 'productive' | 'fragmented' | 'unfocused';

export interface DailyFocusAssessment {
  /** Composite score from 0 to 100 (integer) */
  score: number;
  /** Percentage of total work time spent in deep work (0.0 to 1.0, 2 decimals) */
  deepWorkRatio: number;
  /** Penalty points deducted due to interruptions */
  interruptionPenalty: number;
  /** Qualitative performance tier */
  tier: FocusTier;
  /** Brief takeaway summary */
  summary: string;
}

/**
 * Rounds a floating-point number to 2 decimal places using decimal exponent shifting
 * to prevent IEEE 754 precision artifacts and ensure accurate tie-breaking.
 */
function roundTo2Decimals(value: number): number {
  const rounded = Number(Math.round(Number(`${value}e2`)) + 'e-2');
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Derives a human-readable summary message based on qualitative focus tier and metrics.
 */
function generateFocusSummary(
  tier: FocusTier,
  score: number,
  deepRatio: number,
  interruptionCount: number
): string {
  const deepPct = Math.round(deepRatio * 100);
  switch (tier) {
    case 'optimal':
      return `Optimal focus (${score}/100): Outstanding deep work volume (${deepPct}%) with minimal disruptions.`;
    case 'productive': {
      const disruptionText =
        interruptionCount <= 3
          ? 'manageable interruptions'
          : `${interruptionCount} interruptions`;
      return `Productive session (${score}/100): Solid deep work baseline (${deepPct}%) with ${disruptionText}.`;
    }
    case 'fragmented':
      return `Fragmented focus (${score}/100): High interruption count or elevated shallow work volume (${100 - deepPct}% shallow).`;
    case 'unfocused':
      return `Unfocused session (${score}/100): Insufficient deep work or heavy context-switching penalties.`;
  }
}

/**
 * Calculates a single weighted Focus Score (0–100) and qualitative assessment
 * balancing deep work volume, shallow work volume, and context-switching interruption penalties.
 *
 * @param metrics Daily focus inputs including deep/shallow minutes and interruption count.
 * @returns DailyFocusAssessment containing composite score, ratio, penalty, tier, and summary.
 * @throws {TypeError} If any metric is not a finite number.
 * @throws {RangeError} If any metric is negative or targetDeepWorkMinutes <= 0.
 */
export function calculateDailyFocusScore(
  metrics: DailyFocusMetrics
): DailyFocusAssessment {
  if (!metrics || typeof metrics !== 'object') {
    throw new TypeError('Metrics must be a valid object');
  }

  const {
    deepWorkMinutes,
    shallowWorkMinutes,
    interruptionCount,
    targetDeepWorkMinutes = 240,
  } = metrics;

  // Type validation: must be finite numbers
  if (typeof deepWorkMinutes !== 'number' || !Number.isFinite(deepWorkMinutes)) {
    throw new TypeError('deepWorkMinutes must be a finite number');
  }
  if (typeof shallowWorkMinutes !== 'number' || !Number.isFinite(shallowWorkMinutes)) {
    throw new TypeError('shallowWorkMinutes must be a finite number');
  }
  if (
    typeof interruptionCount !== 'number' ||
    !Number.isFinite(interruptionCount) ||
    !Number.isInteger(interruptionCount)
  ) {
    throw new TypeError('interruptionCount must be a finite integer');
  }
  if (typeof targetDeepWorkMinutes !== 'number' || !Number.isFinite(targetDeepWorkMinutes)) {
    throw new TypeError('targetDeepWorkMinutes must be a finite number');
  }

  // Range validation: non-negative metrics and strictly positive target
  if (deepWorkMinutes < 0) {
    throw new RangeError(`deepWorkMinutes must be non-negative. Received: ${deepWorkMinutes}`);
  }
  if (shallowWorkMinutes < 0) {
    throw new RangeError(`shallowWorkMinutes must be non-negative. Received: ${shallowWorkMinutes}`);
  }
  if (interruptionCount < 0) {
    throw new RangeError(`interruptionCount must be non-negative. Received: ${interruptionCount}`);
  }
  if (targetDeepWorkMinutes <= 0) {
    throw new RangeError(`targetDeepWorkMinutes must be greater than 0. Received: ${targetDeepWorkMinutes}`);
  }

  // Total Minutes & Deep Ratio
  const totalMinutes = deepWorkMinutes + shallowWorkMinutes;
  const deepWorkRatio = totalMinutes === 0 ? 0.0 : roundTo2Decimals(deepWorkMinutes / totalMinutes);

  // Component Weights
  // Volume Score (max 70 pts)
  const volumeScore = Math.min(70, (deepWorkMinutes / targetDeepWorkMinutes) * 70);

  // Quality Bonus (max 30 pts)
  const qualityBonus = deepWorkRatio * 30;

  // Interruption Penalty (capped at 25 pts)
  const interruptionPenalty = Math.min(25, interruptionCount * 3);

  // Composite Score (clamped between 0 and 100, integer)
  const rawScore = Math.round(volumeScore + qualityBonus - interruptionPenalty);
  const score = Math.max(0, Math.min(100, rawScore));

  // Qualitative Performance Tier
  let tier: FocusTier;
  if (score >= 85) {
    tier = 'optimal';
  } else if (score >= 70) {
    tier = 'productive';
  } else if (score >= 50) {
    tier = 'fragmented';
  } else {
    tier = 'unfocused';
  }

  // Brief Takeaway Summary
  const summary = generateFocusSummary(tier, score, deepWorkRatio, interruptionCount);

  return {
    score,
    deepWorkRatio,
    interruptionPenalty,
    tier,
    summary,
  };
}


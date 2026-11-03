/**
 * Cognitive Warm-up Heuristic Ramping Engine & Flow Onset Estimator
 *
 * Provides a computational behavioral heuristic for session pacing,
 * UI friction reduction, and distraction shielding advice, inspired by
 * Mihaly Csikszentmihalyi's conceptual observations on focus inertia.
 *
 * NOTE: This is a software heuristic for UI pacing and habit support;
 * it is not an empirical physiological or neurological measurement.
 *
 * Mathematical Heuristic Model:
 *   P(t) = 1 / (1 + e^{-k * (t - t0)})
 *
 * Where:
 *   - t is elapsed focus time in minutes
 *   - t0 is the inflection point (default: 10 minutes)
 *   - k is the steepness coefficient (default: 0.35)
 */

export type FlowStage =
  | 'initial_resistance'
  | 'ramping_transition'
  | 'flow_state_engaged'
  | 'deep_immersion';

export interface CognitiveRampingState {
  elapsedSeconds: number;
  flowProbabilityFraction: number; // 0.00 to 1.00 (heuristic probability)
  resistanceScore: number;         // 100 down to 0 (perceived friction index)
  activeStage: FlowStage;
  isFragileRampingWindow: boolean; // True during initial 12 minutes (< 720s)
  shieldingRecommendation: 'strict_dnd_shield' | 'ambient_hold' | 'steady_flow';
  encouragementCue: string;
}

export interface CognitiveRampingOptions {
  inflectionMinutes?: number; // Default: 10 (minutes to reach 0.50 heuristic probability)
  steepnessK?: number;        // Default: 0.35 (curve steepness factor)
}

export const MAX_ELAPSED_SECONDS = 86400; // 24-hour upper bound for session safety

/**
 * Evaluates cognitive flow state ramping and resistance scores based on elapsed focus time.
 *
 * @param elapsedSeconds - Number of seconds elapsed in current focus session.
 * @param options - Optional custom inflection point (minutes) and steepness coefficient.
 * @returns CognitiveRampingState containing probability, friction, stage, and shielding advice.
 */
export function evaluateCognitiveRamping(
  elapsedSeconds: number,
  options?: CognitiveRampingOptions
): CognitiveRampingState {
  // 1. Sanitize and bound elapsed time
  let safeSeconds: number;
  if (typeof elapsedSeconds !== 'number' || Number.isNaN(elapsedSeconds) || elapsedSeconds < 0) {
    safeSeconds = 0;
  } else if (elapsedSeconds === Infinity || elapsedSeconds > MAX_ELAPSED_SECONDS) {
    safeSeconds = MAX_ELAPSED_SECONDS;
  } else {
    safeSeconds = elapsedSeconds;
  }

  const elapsedMinutes = safeSeconds / 60;

  // 2. Validate options with safe bounded defaults
  const rawInflection = options?.inflectionMinutes;
  const inflectionMinutes =
    typeof rawInflection === 'number' && Number.isFinite(rawInflection) && rawInflection > 0
      ? Math.min(1440, rawInflection)
      : 10;

  const rawK = options?.steepnessK;
  const k =
    typeof rawK === 'number' && Number.isFinite(rawK) && rawK > 0
      ? Math.min(50, rawK)
      : 0.35;

  // 3. Sigmoid calculation with exponent clamping for guaranteed numerical stability
  let exponent = -k * (elapsedMinutes - inflectionMinutes);
  if (exponent > 700) {
    exponent = 700;
  } else if (exponent < -700) {
    exponent = -700;
  }

  const rawProb = 1 / (1 + Math.exp(exponent));
  const clampedProb = Math.min(1, Math.max(0, rawProb));
  const flowProbabilityFraction = Math.round(clampedProb * 100) / 100;

  // 4. Perceived friction score (100 -> 0)
  const resistanceScore = Math.max(0, Math.min(100, Math.round((1 - flowProbabilityFraction) * 100)));

  // 5. Stage classification
  let activeStage: FlowStage;
  let shieldingRecommendation: 'strict_dnd_shield' | 'ambient_hold' | 'steady_flow';
  let encouragementCue: string;

  if (elapsedMinutes < 5) {
    activeStage = 'initial_resistance';
    shieldingRecommendation = 'strict_dnd_shield';
    encouragementCue = 'Initial task inertia is highest now. Push past the first 5 minutes to build momentum.';
  } else if (elapsedMinutes < 12) {
    activeStage = 'ramping_transition';
    shieldingRecommendation = 'strict_dnd_shield';
    encouragementCue = 'Warm-up phase in progress. Distraction risk is high — keep your focus perimeter shielded.';
  } else if (elapsedMinutes <= 25) {
    activeStage = 'flow_state_engaged';
    shieldingRecommendation = 'ambient_hold';
    encouragementCue = 'Flow state engaged. Task resistance has transitioned into steady execution velocity.';
  } else {
    activeStage = 'deep_immersion';
    shieldingRecommendation = 'steady_flow';
    encouragementCue = 'Deep immersion reached. Maintain your current work cadence.';
  }

  const isFragileRampingWindow = elapsedMinutes < 12;

  return {
    elapsedSeconds: safeSeconds,
    flowProbabilityFraction,
    resistanceScore,
    activeStage,
    isFragileRampingWindow,
    shieldingRecommendation,
    encouragementCue,
  };
}

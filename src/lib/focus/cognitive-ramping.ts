/**
 * Cognitive Warm-up Sigmoid Ramping Curve & Flow Onset Estimator
 *
 * Implements Mihaly Csikszentmihalyi's Flow transition model using an S-shaped
 * logistic sigmoid curve to calculate flow onset probability, perceive cognitive
 * friction, and recommend progressive notification shielding.
 *
 * Formula:
 *   R(t) = 1 / (1 + e^(-k * (t - t0)))
 * Where:
 *   - t: elapsed minutes (clamped >= 0)
 *   - t0: inflection point (default: 10.0 minutes)
 *   - k: steepness / sensitivity factor (default: 0.35)
 */

export type FlowStage =
  | 'initial_resistance'
  | 'ramping_transition'
  | 'flow_state_engaged'
  | 'deep_immersion';

export interface CognitiveRampingState {
  elapsedSeconds: number;
  flowProbabilityFraction: number; // 0.0 to 1.0 (rounded to 4 decimal places)
  resistanceScore: number;         // 100 down to 0 (rounded to 2 decimal places)
  activeStage: FlowStage;
  isFragileRampingWindow: boolean; // True during first 12 minutes (< 720 seconds)
  shieldingRecommendation: 'strict_dnd_shield' | 'ambient_hold' | 'steady_flow';
  encouragementCue: string;
}

export interface CognitiveRampingOptions {
  /**
   * Inflection point in minutes where flow probability is exactly 0.50 (default: 10.0).
   */
  inflectionMinutes?: number;

  /**
   * Logistic steepness growth rate (default: 0.35).
   */
  steepnessK?: number;
}

const DEFAULT_INFLECTION_MINUTES = 10.0;
const DEFAULT_STEEPNESS_K = 0.35;

/**
 * Evaluates the user's cognitive state and flow readiness across a focus session.
 *
 * @param elapsedSeconds - Elapsed session duration in seconds (negative numbers clamped to 0)
 * @param options - Configuration for sigmoid inflection and slope
 * @returns Complete cognitive ramping diagnostics
 */
export function evaluateCognitiveRamping(
  elapsedSeconds: number,
  options?: CognitiveRampingOptions
): CognitiveRampingState {
  // Clamping and input resilience
  const safeSeconds = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const elapsedMinutes = safeSeconds / 60;

  const t0 = options?.inflectionMinutes && options.inflectionMinutes > 0
    ? options.inflectionMinutes
    : DEFAULT_INFLECTION_MINUTES;

  const k = options?.steepnessK && options.steepnessK > 0
    ? options.steepnessK
    : DEFAULT_STEEPNESS_K;

  // Logistic Sigmoid calculation
  const exponent = -k * (elapsedMinutes - t0);
  const rawProbability = 1 / (1 + Math.exp(exponent));

  // Bound within [0.0, 1.0] and format to 4 decimal precision
  const flowProbabilityFraction = Math.max(0, Math.min(1, Math.round(rawProbability * 10000) / 10000));
  const rawResistance = (1 - flowProbabilityFraction) * 100;
  const resistanceScore = Math.max(0, Math.min(100, Math.round(rawResistance * 100) / 100));

  // Stage Thresholds & Categorization
  // < 5 min (< 300s): initial_resistance
  // 5 to 12 min [300s, 720s): ramping_transition
  // 12 to 25 min [720s, 1500s]: flow_state_engaged
  // > 25 min (> 1500s): deep_immersion
  let activeStage: FlowStage;
  let isFragileRampingWindow: boolean;
  let shieldingRecommendation: 'strict_dnd_shield' | 'ambient_hold' | 'steady_flow';
  let encouragementCue: string;

  if (safeSeconds < 300) {
    activeStage = 'initial_resistance';
    isFragileRampingWindow = true;
    shieldingRecommendation = 'strict_dnd_shield';
    encouragementCue = 'Initial friction is biological. Breathe through the first 5 minutes; focus neurochemistry is warming up.';
  } else if (safeSeconds < 720) {
    activeStage = 'ramping_transition';
    isFragileRampingWindow = true;
    shieldingRecommendation = 'strict_dnd_shield';
    encouragementCue = 'Approaching flow inflection. Distraction barrier dropping as cognitive momentum builds.';
  } else if (safeSeconds <= 1500) {
    activeStage = 'flow_state_engaged';
    isFragileRampingWindow = false;
    shieldingRecommendation = 'ambient_hold';
    encouragementCue = 'Flow state engaged. Executive resistance minimized; maintain your steady cadence.';
  } else {
    activeStage = 'deep_immersion';
    isFragileRampingWindow = false;
    shieldingRecommendation = 'steady_flow';
    encouragementCue = 'Deep immersion achieved. Peak focus envelope active; shield from external interruptions.';
  }

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

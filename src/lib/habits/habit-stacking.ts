/**
 * PACT Accountability OS — Habit Stacking Anchor Compatibility & Transition Latency Scorer
 *
 * Implements James Clear's habit stacking formulation:
 *   "After [CURRENT ANCHOR], I will [NEW TARGET HABIT]."
 *
 * Evaluates the structural viability of chained routines based on:
 *  1. Anchor Establishment & Consistency: Unproven anchors (< 66 days) trigger severe penalty.
 *  2. Frequency Alignment: Forbids stacking high-frequency habits on low-frequency anchors (e.g. daily on weekly).
 *  3. Spatial Friction: Penalizes physical location switching between anchor and target habit.
 *  4. Cognitive/Energy Gradient: Evaluates energy transition mismatch.
 *
 * Output viability score is strictly bounded [0, 100] and categorized into 4 tiers:
 *  - highly_compatible (>= 80)
 *  - viable (60 - 79)
 *  - fragile (40 - 59)
 *  - incompatible (< 40)
 *
 * @module src/lib/habits/habit-stacking
 */

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly';

export type HabitLocation =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'office'
  | 'gym_outdoors'
  | 'transit'
  | 'digital';

export type EnergyLevel = 'low' | 'medium' | 'high';

export type StackingViabilityTier =
  | 'highly_compatible'
  | 'viable'
  | 'fragile'
  | 'incompatible';

export interface HabitAnchor {
  name: string;
  isEstablishedAnchor: boolean;
  frequency: HabitFrequency;
  location: HabitLocation;
  energyRequired: EnergyLevel;
  consistencyScorePercentage: number; // [0, 100]
}

export interface TargetHabit {
  name: string;
  frequency: HabitFrequency;
  location: HabitLocation;
  energyRequired: EnergyLevel;
  estimatedDurationMinutes: number;
}

export interface HabitStackingAssessment {
  viabilityScore: number;
  viabilityTier: StackingViabilityTier;
  anchorConsistencyBase: number;
  unestablishedAnchorPenalty: number;
  frequencyCompatibilityPenalty: number;
  spatialFrictionPenalty: number;
  energyGradientPenalty: number;
  totalPenalties: number;
  warnings: string[];
  recommendations: string[];
}

const VALID_FREQUENCIES: Set<string> = new Set(['daily', 'weekdays', 'weekends', 'weekly']);
const VALID_LOCATIONS: Set<string> = new Set([
  'bedroom',
  'bathroom',
  'kitchen',
  'office',
  'gym_outdoors',
  'transit',
  'digital',
]);
const VALID_ENERGY: Set<string> = new Set(['low', 'medium', 'high']);

/**
 * Validates habit anchor properties.
 */
export function validateHabitAnchor(anchor: HabitAnchor): void {
  if (!anchor || typeof anchor !== 'object') {
    throw new TypeError('anchor must be a valid HabitAnchor object');
  }
  if (typeof anchor.name !== 'string' || !anchor.name.trim()) {
    throw new TypeError('anchor.name must be a non-empty string');
  }
  if (typeof anchor.isEstablishedAnchor !== 'boolean') {
    throw new TypeError('anchor.isEstablishedAnchor must be a boolean');
  }
  if (!VALID_FREQUENCIES.has(anchor.frequency)) {
    throw new RangeError(`Invalid anchor.frequency: '${anchor.frequency}'`);
  }
  if (!VALID_LOCATIONS.has(anchor.location)) {
    throw new RangeError(`Invalid anchor.location: '${anchor.location}'`);
  }
  if (!VALID_ENERGY.has(anchor.energyRequired)) {
    throw new RangeError(`Invalid anchor.energyRequired: '${anchor.energyRequired}'`);
  }
  if (
    typeof anchor.consistencyScorePercentage !== 'number' ||
    Number.isNaN(anchor.consistencyScorePercentage) ||
    !Number.isFinite(anchor.consistencyScorePercentage)
  ) {
    throw new TypeError('anchor.consistencyScorePercentage must be a finite number');
  }
  if (anchor.consistencyScorePercentage < 0 || anchor.consistencyScorePercentage > 100) {
    throw new RangeError(
      `anchor.consistencyScorePercentage must be between 0 and 100, received ${anchor.consistencyScorePercentage}`
    );
  }
}

/**
 * Validates target habit properties.
 */
export function validateTargetHabit(target: TargetHabit): void {
  if (!target || typeof target !== 'object') {
    throw new TypeError('target must be a valid TargetHabit object');
  }
  if (typeof target.name !== 'string' || !target.name.trim()) {
    throw new TypeError('target.name must be a non-empty string');
  }
  if (!VALID_FREQUENCIES.has(target.frequency)) {
    throw new RangeError(`Invalid target.frequency: '${target.frequency}'`);
  }
  if (!VALID_LOCATIONS.has(target.location)) {
    throw new RangeError(`Invalid target.location: '${target.location}'`);
  }
  if (!VALID_ENERGY.has(target.energyRequired)) {
    throw new RangeError(`Invalid target.energyRequired: '${target.energyRequired}'`);
  }
  if (
    typeof target.estimatedDurationMinutes !== 'number' ||
    Number.isNaN(target.estimatedDurationMinutes) ||
    !Number.isFinite(target.estimatedDurationMinutes)
  ) {
    throw new TypeError('target.estimatedDurationMinutes must be a finite number');
  }
  if (target.estimatedDurationMinutes <= 0) {
    throw new RangeError(
      `target.estimatedDurationMinutes must be positive (> 0), received ${target.estimatedDurationMinutes}`
    );
  }
}

/**
 * Computes spatial friction between two physical/digital contexts.
 */
export function computeSpatialFriction(
  fromLoc: HabitLocation,
  toLoc: HabitLocation
): { penalty: number; warning?: string } {
  if (fromLoc === toLoc) {
    return { penalty: 0 };
  }

  // Digital context connects anywhere with minimal friction
  if (fromLoc === 'digital' || toLoc === 'digital') {
    return { penalty: 5 };
  }

  // Domestic proximity transitions
  const domesticRooms = new Set(['bedroom', 'bathroom', 'kitchen', 'office']);
  if (domesticRooms.has(fromLoc) && domesticRooms.has(toLoc)) {
    return { penalty: 10 };
  }

  // Crossing threshold to outdoors/gym/transit
  return {
    penalty: 25,
    warning: `Significant environmental transition from '${fromLoc}' to '${toLoc}' introduces physical friction.`,
  };
}

/**
 * Computes frequency alignment penalties between anchor and target.
 */
export function computeFrequencyPenalty(
  anchorFreq: HabitFrequency,
  targetFreq: HabitFrequency
): { penalty: number; warning?: string } {
  if (anchorFreq === targetFreq) {
    return { penalty: 0 };
  }

  // High-frequency target chained to low-frequency anchor is an anti-pattern
  if (anchorFreq === 'weekly' && targetFreq === 'daily') {
    return {
      penalty: 45,
      warning: 'Anti-pattern: Daily target habit cannot be reliably stacked onto a weekly anchor.',
    };
  }

  if (anchorFreq === 'weekdays' && targetFreq === 'weekends') {
    return {
      penalty: 35,
      warning: 'Schedule collision: Weekdays anchor does not occur during weekend target days.',
    };
  }

  if (anchorFreq === 'daily' && targetFreq === 'weekly') {
    return {
      penalty: 10,
      warning: 'Anchor occurs daily but target is weekly; designate specific trigger day to prevent ambiguity.',
    };
  }

  return { penalty: 15 };
}

/**
 * Evaluates cognitive and physical energy transition gradient.
 */
export function computeEnergyGradientPenalty(
  anchorEnergy: EnergyLevel,
  targetEnergy: EnergyLevel
): { penalty: number; warning?: string } {
  if (anchorEnergy === 'high' && targetEnergy === 'high') {
    return {
      penalty: 15,
      warning: 'Consecutive high-energy demands increase cognitive burnout risk.',
    };
  }
  if (anchorEnergy === 'low' && targetEnergy === 'high') {
    return {
      penalty: 10,
      warning: 'Sudden low-to-high energy transition requires an intentional ramp-up ritual.',
    };
  }
  return { penalty: 0 };
}

/**
 * Evaluates the structural viability of stacking a target habit onto an existing anchor.
 */
export function scoreHabitStackingViability(
  anchor: HabitAnchor,
  target: TargetHabit
): HabitStackingAssessment {
  validateHabitAnchor(anchor);
  validateTargetHabit(target);

  const warnings: string[] = [];
  const recommendations: string[] = [];

  const baseScore = anchor.consistencyScorePercentage;

  // 1. Anchor stability check
  let unestablishedAnchorPenalty = 0;
  if (!anchor.isEstablishedAnchor) {
    unestablishedAnchorPenalty = 30;
    warnings.push(
      `Anchor habit '${anchor.name}' is unproven (< 66 days established). Habit stacks require an automatic anchor.`
    );
    recommendations.push(
      `Solidify '${anchor.name}' for at least 3 weeks before attaching '${target.name}'.`
    );
  }

  // 2. Frequency alignment
  const freqResult = computeFrequencyPenalty(anchor.frequency, target.frequency);
  const frequencyCompatibilityPenalty = freqResult.penalty;
  if (freqResult.warning) {
    warnings.push(freqResult.warning);
  }

  // 3. Spatial friction
  const spatialResult = computeSpatialFriction(anchor.location, target.location);
  const spatialFrictionPenalty = spatialResult.penalty;
  if (spatialResult.warning) {
    warnings.push(spatialResult.warning);
    recommendations.push(
      `Place cues for '${target.name}' physically within '${anchor.location}' to eliminate environment transition.`
    );
  }

  // 4. Energy transition
  const energyResult = computeEnergyGradientPenalty(anchor.energyRequired, target.energyRequired);
  const energyGradientPenalty = energyResult.penalty;
  if (energyResult.warning) {
    warnings.push(energyResult.warning);
  }

  // 5. Total penalties and clamped viability score
  const totalPenalties =
    unestablishedAnchorPenalty +
    frequencyCompatibilityPenalty +
    spatialFrictionPenalty +
    energyGradientPenalty;

  let rawScore = Math.round(baseScore - totalPenalties);

  // Severe frequency mismatch hard ceiling: daily on weekly anchor caps at <= 40 (incompatible tier)
  if (anchor.frequency === 'weekly' && target.frequency === 'daily') {
    rawScore = Math.min(rawScore, 35);
  }

  const viabilityScore = Math.max(0, Math.min(100, rawScore));

  // Determine tier
  let viabilityTier: StackingViabilityTier;
  if (viabilityScore >= 80) {
    viabilityTier = 'highly_compatible';
    recommendations.push(
      `Optimal stack configuration: Execute '${target.name}' immediately (< 2 min) after finishing '${anchor.name}'.`
    );
  } else if (viabilityScore >= 60) {
    viabilityTier = 'viable';
    recommendations.push(
      `Viable routine: Track consistency for 14 days to confirm anchor resilience.`
    );
  } else if (viabilityScore >= 40) {
    viabilityTier = 'fragile';
    recommendations.push(
      `Fragile stack: Reduce target duration from ${target.estimatedDurationMinutes}m to a 2-minute starter ritual.`
    );
  } else {
    viabilityTier = 'incompatible';
    recommendations.push(
      `Incompatible stack: Select a different established daily anchor in the same room.`
    );
  }

  return {
    viabilityScore,
    viabilityTier,
    anchorConsistencyBase: baseScore,
    unestablishedAnchorPenalty,
    frequencyCompatibilityPenalty,
    spatialFrictionPenalty,
    energyGradientPenalty,
    totalPenalties,
    warnings,
    recommendations,
  };
}

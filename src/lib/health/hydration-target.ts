/**
 * Daily Hydration Target & Water Intake Glass Divider
 *
 * Estimates a daily water target from body weight, exercise and climate, then
 * divides it into glasses for health-focused habit tracking.
 *
 * @module src/lib/health/hydration-target
 */

const BASELINE_ML_PER_KG = 35;
const EXERCISE_ML_PER_MINUTE = 12;
const WARM_CLIMATE_BASELINE_PERCENT = 10;
const TARGET_ROUNDING_ML = 50;
const DEFAULT_GLASS_VOLUME_ML = 250;

export interface HydrationProfile {
  /** Body weight in kg (> 0) */
  weightKg: number;
  /** Daily exercise in minutes (default: 0) */
  workoutMinutes?: number;
  /** Warm environment toggle (default: false) */
  isWarmClimate?: boolean;
  /** Volume per glass in ml (default: 250) */
  glassVolumeMl?: number;
}

export interface HydrationTargetResult {
  /** Sum of the breakdown, rounded to the nearest 50 ml */
  totalTargetMl: number;
  /** Glasses needed to reach the target, rounded up */
  glassCount: number;
  glassVolumeMl: number;
  /** Unrounded components of the target */
  breakdown: {
    baselineMl: number;
    exerciseAdjustmentMl: number;
    climateAdjustmentMl: number;
  };
}

/**
 * Calculates a daily hydration target and the number of glasses needed to reach it.
 *
 * @param profile Body weight plus optional exercise, climate and glass size inputs
 * @returns Rounded target, glass count and the components of the target
 * @throws {RangeError} If weightKg or glassVolumeMl is not a positive number, or
 *   workoutMinutes is not a non-negative number
 */
export function calculateDailyHydrationTarget(profile: HydrationProfile): HydrationTargetResult {
  const {
    weightKg,
    workoutMinutes = 0,
    isWarmClimate = false,
    glassVolumeMl = DEFAULT_GLASS_VOLUME_ML,
  } = profile;

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new RangeError(`weightKg must be a positive number, got: ${weightKg}`);
  }
  if (!Number.isFinite(glassVolumeMl) || glassVolumeMl <= 0) {
    throw new RangeError(`glassVolumeMl must be a positive number, got: ${glassVolumeMl}`);
  }
  if (!Number.isFinite(workoutMinutes) || workoutMinutes < 0) {
    throw new RangeError(`workoutMinutes must be a non-negative number, got: ${workoutMinutes}`);
  }

  const baselineMl = weightKg * BASELINE_ML_PER_KG;
  const exerciseAdjustmentMl = workoutMinutes * EXERCISE_ML_PER_MINUTE;
  const climateAdjustmentMl = isWarmClimate
    ? (baselineMl * WARM_CLIMATE_BASELINE_PERCENT) / 100
    : 0;

  const unroundedTargetMl = baselineMl + exerciseAdjustmentMl + climateAdjustmentMl;
  const totalTargetMl = Math.round(unroundedTargetMl / TARGET_ROUNDING_ML) * TARGET_ROUNDING_ML;

  return {
    totalTargetMl,
    glassCount: Math.ceil(totalTargetMl / glassVolumeMl),
    glassVolumeMl,
    breakdown: {
      baselineMl,
      exerciseAdjustmentMl,
      climateAdjustmentMl,
    },
  };
}

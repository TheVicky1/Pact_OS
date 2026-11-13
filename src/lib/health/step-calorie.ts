export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'highly_active';

export interface StepCalorieAssessment {
  /** Estimated active energy expenditure in kcal (rounded to nearest integer) */
  caloriesBurned: number;
  /** Estimated distance walked in kilometers (steps * strideLength / 100,000, 2 decimals) */
  distanceKm: number;
  /** Categorized activity level based on daily step volume */
  activityLevel: ActivityLevel;
}

/** kcal burned per step per kilogram of body weight. */
const KCAL_PER_STEP_PER_KG = 0.00057;

/** Average stride length in centimeters (0.762 m). */
const STRIDE_LENGTH_CM = 76.2;

const CM_PER_KM = 100_000;

function classifyActivityLevel(steps: number): ActivityLevel {
  if (steps < 5_000) return 'sedentary';
  if (steps < 7_500) return 'lightly_active';
  if (steps < 10_000) return 'moderately_active';
  return 'highly_active';
}

/**
 * Estimates active energy expenditure, distance walked, and activity level
 * from a daily step count and body weight.
 *
 * @throws {TypeError} if `steps` or `weightKg` is not a finite number.
 * @throws {RangeError} if `steps < 0` or `weightKg <= 0`.
 */
export function estimateStepCalories(
  steps: number,
  weightKg: number = 70
): StepCalorieAssessment {
  if (typeof steps !== 'number' || !Number.isFinite(steps)) {
    throw new TypeError('steps must be a finite number');
  }
  if (typeof weightKg !== 'number' || !Number.isFinite(weightKg)) {
    throw new TypeError('weightKg must be a finite number');
  }
  if (steps < 0) {
    throw new RangeError('steps must be greater than or equal to 0');
  }
  if (weightKg <= 0) {
    throw new RangeError('weightKg must be greater than 0');
  }

  const caloriesBurned = Math.round(steps * weightKg * KCAL_PER_STEP_PER_KG);
  const distanceKm =
    Math.round(((steps * STRIDE_LENGTH_CM) / CM_PER_KM) * 100) / 100;

  return {
    caloriesBurned,
    distanceKm,
    activityLevel: classifyActivityLevel(steps),
  };
}

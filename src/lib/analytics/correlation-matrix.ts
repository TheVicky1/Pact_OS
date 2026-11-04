/**
 * Pearson Correlation Coefficient Matrix for Multi-Habit Synergy
 *
 * Implements statistical correlation analysis across multi-habit check-in vectors
 * in Pact OS to detect keystone synergies and behavioral habit conflicts.
 *
 * Zero external runtime dependencies.
 */

export interface HabitCheckinVector {
  habitId: string;
  habitName: string;
  checkins: (0 | 1 | number)[]; // Boolean or binary check-ins aligned by calendar day
}

export type HabitSynergyRelationship =
  | 'strong_synergy'
  | 'moderate_synergy'
  | 'independent'
  | 'moderate_conflict'
  | 'strong_conflict';

export interface HabitPairCorrelation {
  habitIdA: string;
  habitNameA: string;
  habitIdB: string;
  habitNameB: string;
  pearsonR: number; // -1.0 to +1.0 rounded to 4 decimal places
  relationship: HabitSynergyRelationship;
  sampleSize: number;
}

export interface CorrelationMatrixResult {
  habitIds: string[];
  matrix: number[][]; // 2D symmetric correlation matrix with 1.0 along diagonal
  topSynergies: HabitPairCorrelation[];
  topConflicts: HabitPairCorrelation[];
}

/**
 * Categorizes the Pearson correlation coefficient into an actionable habit relationship.
 *
 * Statistical Thresholds:
 * - r >= 0.60: strong_synergy (keystone habit pairing; habits strongly reinforce each other)
 * - 0.20 <= r < 0.60: moderate_synergy (positive co-occurrence)
 * - -0.20 < r < 0.20: independent (uncorrelated or negligible mutual dependency)
 * - -0.60 < r <= -0.20: moderate_conflict (competition for attention or willpower)
 * - r <= -0.60: strong_conflict (toxic friction; mutually exclusive habit patterns)
 *
 * @param r - Pearson correlation coefficient in [-1.0, 1.0]
 */
export function classifyHabitRelationship(r: number): HabitSynergyRelationship {
  if (r >= 0.6) {
    return 'strong_synergy';
  }
  if (r >= 0.2) {
    return 'moderate_synergy';
  }
  if (r <= -0.6) {
    return 'strong_conflict';
  }
  if (r <= -0.2) {
    return 'moderate_conflict';
  }
  return 'independent';
}

/**
 * Calculates the Pearson product-moment correlation coefficient between two numeric vectors.
 *
 * Formula:
 *   r = sum((x_i - meanX) * (y_i - meanY)) / (sqrt(sum((x_i - meanX)^2) * sum((y_i - meanY)^2)))
 *
 * Defenses and Invariants:
 * - Insufficient sample size (< 3): returns 0.0 (requires at least 3 points for statistical degree of freedom)
 * - Mismatched vector lengths: truncated to common prefix length min(lengthA, lengthB)
 * - Zero variance (constant vector, e.g. 100% or 0% completion): returns 0.0 without divide-by-zero or NaN
 * - Clamped strictly to [-1.0, 1.0] to guard against floating-point rounding artifacts
 * - Rounded to 4 decimal places
 *
 * @param vectorA - Array of numerical values (e.g. check-ins 0 or 1)
 * @param vectorB - Array of numerical values aligned on the same calendar timestamps
 * @returns Pearson r coefficient between -1.0 and 1.0
 */
export function calculatePearsonCorrelation(vectorA: number[], vectorB: number[]): number {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    return 0.0;
  }

  const n = Math.min(vectorA.length, vectorB.length);
  if (n < 3) {
    return 0.0;
  }

  // Calculate means
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    const valA = Number.isFinite(vectorA[i]) ? vectorA[i] : 0;
    const valB = Number.isFinite(vectorB[i]) ? vectorB[i] : 0;
    sumA += valA;
    sumB += valB;
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  // Calculate covariance and variances
  let covariance = 0;
  let varA = 0;
  let varB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = (Number.isFinite(vectorA[i]) ? vectorA[i] : 0) - meanA;
    const diffB = (Number.isFinite(vectorB[i]) ? vectorB[i] : 0) - meanB;

    covariance += diffA * diffB;
    varA += diffA * diffA;
    varB += diffB * diffB;
  }

  // Zero variance guard (constant check-in vectors)
  if (varA <= 0 || varB <= 0) {
    return 0.0;
  }

  const denominator = Math.sqrt(varA * varB);
  if (denominator <= 0 || !Number.isFinite(denominator)) {
    return 0.0;
  }

  const rawR = covariance / denominator;
  const clampedR = Math.max(-1.0, Math.min(1.0, rawR));
  const roundedR = Math.round(clampedR * 10000) / 10000;

  // Guard against -0 in JavaScript floating point
  return Object.is(roundedR, -0) ? 0.0 : roundedR;
}

/**
 * Builds a symmetric Pearson correlation matrix across multiple habit check-in vectors.
 *
 * @param habitVectors - List of habit check-in series
 * @returns Symmetric correlation matrix with 1.0 diagonal and sorted top synergies & conflicts
 */
export function buildHabitCorrelationMatrix(
  habitVectors: HabitCheckinVector[]
): CorrelationMatrixResult {
  if (!Array.isArray(habitVectors) || habitVectors.length === 0) {
    return {
      habitIds: [],
      matrix: [],
      topSynergies: [],
      topConflicts: [],
    };
  }

  const count = habitVectors.length;
  const habitIds = habitVectors.map((h) => h.habitId);

  // Initialize empty N x N symmetric matrix
  const matrix: number[][] = Array.from({ length: count }, () =>
    new Array<number>(count).fill(0.0)
  );

  const topSynergies: HabitPairCorrelation[] = [];
  const topConflicts: HabitPairCorrelation[] = [];

  for (let i = 0; i < count; i++) {
    matrix[i][i] = 1.0; // Diagonal identity invariant

    for (let j = i + 1; j < count; j++) {
      const vecA = habitVectors[i].checkins;
      const vecB = habitVectors[j].checkins;
      const sampleSize = Math.min(vecA?.length || 0, vecB?.length || 0);

      const r = calculatePearsonCorrelation(vecA, vecB);

      // Symmetry invariant: matrix[i][j] === matrix[j][i]
      matrix[i][j] = r;
      matrix[j][i] = r;

      const correlationRecord: HabitPairCorrelation = {
        habitIdA: habitVectors[i].habitId,
        habitNameA: habitVectors[i].habitName,
        habitIdB: habitVectors[j].habitId,
        habitNameB: habitVectors[j].habitName,
        pearsonR: r,
        relationship: classifyHabitRelationship(r),
        sampleSize,
      };

      if (r > 0.0) {
        topSynergies.push(correlationRecord);
      } else if (r < 0.0) {
        topConflicts.push(correlationRecord);
      }
    }
  }

  // Sort top synergies by highest positive Pearson r descending
  topSynergies.sort((a, b) => b.pearsonR - a.pearsonR);

  // Sort top conflicts by strongest negative Pearson r ascending (e.g. -1.0 before -0.5)
  topConflicts.sort((a, b) => a.pearsonR - b.pearsonR);

  return {
    habitIds,
    matrix,
    topSynergies,
    topConflicts,
  };
}

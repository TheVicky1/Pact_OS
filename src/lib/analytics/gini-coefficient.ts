/**
 * Gini Coefficient Inequality Index for Life Domain Time Allocation
 *
 * Implements statistical dispersion measurement across time allocations in Pact OS
 * to assess balance across life domains (e.g. Deep Work, Health, Relationships, Learning).
 *
 * Pure mathematics implementation with zero external dependencies.
 */

export type BalanceRating =
  | 'equitable_harmony'
  | 'balanced_portfolio'
  | 'moderate_skew'
  | 'hyper_skewed_obsession';

export interface DomainAllocation {
  domain: string;
  minutesSpent: number;
}

export interface TimeBalanceReport {
  giniCoefficient: number; // 0.00 to 1.00 rounded to 2 decimal places
  balanceRating: BalanceRating;
  dominantDomain: string | null;
  neglectedDomains: string[];
  totalTrackedMinutes: number;
}

/**
 * Calculates the Gini coefficient for an array of numerical values.
 *
 * Uses the discrete absolute difference formula:
 *   G = sum_{i=1}^n sum_{j=1}^n |x_i - x_j| / (2 * n^2 * mean)
 * where mean = (1 / n) * sum_{i=1}^n x_i.
 *
 * @param values - Array of non-negative numbers representing allocations or quantities.
 * @returns A float clamped in [0, 1], rounded to 2 decimal places. Returns 0 if all values are 0 or length <= 1.
 * @throws {RangeError} If any value in the array is negative.
 *
 * @example
 * calculateGiniCoefficient([60, 60, 60, 60]); // 0
 * calculateGiniCoefficient([300, 0, 0]); // 0.67
 */
export function calculateGiniCoefficient(values: number[]): number {
  if (!Array.isArray(values)) {
    return 0;
  }

  for (const value of values) {
    if (value < 0) {
      throw new RangeError(`Gini coefficient values must be non-negative. Received: ${value}`);
    }
  }

  const n = values.length;
  if (n <= 1) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += values[i];
  }

  if (sum === 0) {
    return 0;
  }

  let diffSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      diffSum += Math.abs(values[i] - values[j]);
    }
  }

  const rawGini = diffSum / (2 * n * sum);
  const clamped = Math.min(1, Math.max(0, rawGini));
  const rounded = Math.round(clamped * 100) / 100;

  return rounded === 0 ? 0 : Math.min(1, Math.max(0, rounded));
}

/**
 * Evaluates the time balance across life domains and produces a detailed report.
 *
 * @param allocations - Array of domain allocations with domain names and minutes spent.
 * @returns A TimeBalanceReport containing the Gini coefficient, rating, dominant domain,
 *          neglected domains (< 5% of total time), and total tracked minutes.
 * @throws {RangeError} If any allocation contains negative minutesSpent.
 *
 * @example
 * evaluateTimeBalance([
 *   { domain: 'Deep Work', minutesSpent: 240 },
 *   { domain: 'Health', minutesSpent: 60 },
 *   { domain: 'Relationships', minutesSpent: 60 },
 *   { domain: 'Admin', minutesSpent: 10 },
 * ]);
 */
export function evaluateTimeBalance(allocations: DomainAllocation[]): TimeBalanceReport {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    return {
      giniCoefficient: 0,
      balanceRating: 'equitable_harmony',
      dominantDomain: null,
      neglectedDomains: [],
      totalTrackedMinutes: 0,
    };
  }

  for (const allocation of allocations) {
    if (allocation.minutesSpent < 0) {
      throw new RangeError(
        `Allocation minutesSpent cannot be negative. Received ${allocation.minutesSpent} for domain "${allocation.domain}".`
      );
    }
  }

  const values = allocations.map((a) => a.minutesSpent);
  const giniCoefficient = calculateGiniCoefficient(values);

  let balanceRating: BalanceRating;
  if (giniCoefficient < 0.20) {
    balanceRating = 'equitable_harmony';
  } else if (giniCoefficient < 0.35) {
    balanceRating = 'balanced_portfolio';
  } else if (giniCoefficient < 0.55) {
    balanceRating = 'moderate_skew';
  } else {
    balanceRating = 'hyper_skewed_obsession';
  }

  let totalTrackedMinutes = 0;
  let maxMinutes = 0;
  let dominantDomain: string | null = null;

  for (const allocation of allocations) {
    totalTrackedMinutes += allocation.minutesSpent;
    if (allocation.minutesSpent > maxMinutes) {
      maxMinutes = allocation.minutesSpent;
      dominantDomain = allocation.domain;
    }
  }

  const neglectedDomains: string[] = [];
  if (totalTrackedMinutes > 0) {
    const threshold = 0.05 * totalTrackedMinutes;
    for (const allocation of allocations) {
      if (allocation.minutesSpent < threshold) {
        if (!neglectedDomains.includes(allocation.domain)) {
          neglectedDomains.push(allocation.domain);
        }
      }
    }
  }

  return {
    giniCoefficient,
    balanceRating,
    dominantDomain,
    neglectedDomains,
    totalTrackedMinutes,
  };
}

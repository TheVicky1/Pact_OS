/**
 * Debt payoff acceleration optimizer: deterministic Snowball vs Avalanche simulation.
 *
 * All money values are integer cents. Interest accrues monthly at APR / 12 and is
 * rounded to the nearest cent per debt per month.
 */

export interface DebtItem {
  id: string;
  name: string;
  principalBalanceCents: number;
  annualInterestRatePercent: number; // e.g. 18.5 for 18.5%
  minimumMonthlyPaymentCents: number;
}

export type PayoffStrategy = 'snowball' | 'avalanche';

export interface PayoffMonthSnapshot {
  monthIndex: number; // 1, 2, ...
  remainingTotalPrincipalCents: number;
  interestPaidThisMonthCents: number;
  /**
   * Payments applied this month minus interest charged. Negative when payments
   * do not cover the interest (the shortfall is capitalized into the balance).
   */
  principalPaidThisMonthCents: number;
  debtsRemaining: number;
}

export interface StrategyPayoffResult {
  strategy: PayoffStrategy;
  /** Months until all debts are cleared; equals MAX_SIMULATION_MONTHS if never cleared. */
  monthsToDebtFree: number;
  totalInterestPaidCents: number;
  totalPrincipalPaidCents: number;
  monthlySchedule: PayoffMonthSnapshot[];
}

export interface DebtAccelerationComparison {
  snowball: StrategyPayoffResult;
  avalanche: StrategyPayoffResult;
  interestSavingsWithAvalancheCents: number;
  monthsSavedWithAvalanche: number;
}

/** Simulation horizon (50 years) guarding against minimums that never cover interest. */
export const MAX_SIMULATION_MONTHS = 600;

interface ActiveDebt {
  balance: number;
  apr: number;
  minimum: number;
  id: string;
}

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
}

function validateInputs(debts: readonly DebtItem[], extraMonthlyBudgetCents: number, strategy: PayoffStrategy): void {
  if (!Array.isArray(debts)) {
    throw new TypeError('debts must be an array.');
  }
  if (strategy !== 'snowball' && strategy !== 'avalanche') {
    throw new TypeError('strategy must be "snowball" or "avalanche".');
  }
  assertFiniteNumber(extraMonthlyBudgetCents, 'extraMonthlyBudgetCents');
  if (extraMonthlyBudgetCents < 0 || !Number.isInteger(extraMonthlyBudgetCents)) {
    throw new RangeError('extraMonthlyBudgetCents must be a non-negative integer.');
  }
  for (const debt of debts) {
    if (debt === null || typeof debt !== 'object') {
      throw new TypeError('Each debt must be an object.');
    }
    assertFiniteNumber(debt.principalBalanceCents, 'principalBalanceCents');
    assertFiniteNumber(debt.annualInterestRatePercent, 'annualInterestRatePercent');
    assertFiniteNumber(debt.minimumMonthlyPaymentCents, 'minimumMonthlyPaymentCents');
    if (debt.principalBalanceCents <= 0 || !Number.isInteger(debt.principalBalanceCents)) {
      throw new RangeError('principalBalanceCents must be a positive integer.');
    }
    if (debt.annualInterestRatePercent < 0) {
      throw new RangeError('annualInterestRatePercent must not be negative.');
    }
    if (debt.minimumMonthlyPaymentCents <= 0 || !Number.isInteger(debt.minimumMonthlyPaymentCents)) {
      throw new RangeError('minimumMonthlyPaymentCents must be a positive integer.');
    }
  }
}

function compareByStrategy(strategy: PayoffStrategy, a: ActiveDebt, b: ActiveDebt): number {
  if (strategy === 'snowball') {
    return a.balance - b.balance || b.apr - a.apr || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }
  return b.apr - a.apr || a.balance - b.balance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function simulateDebtPayoff(
  debts: readonly DebtItem[],
  extraMonthlyBudgetCents: number,
  strategy: PayoffStrategy
): StrategyPayoffResult {
  validateInputs(debts, extraMonthlyBudgetCents, strategy);

  const active: ActiveDebt[] = debts.map((d) => ({
    id: d.id,
    balance: d.principalBalanceCents,
    apr: d.annualInterestRatePercent,
    minimum: d.minimumMonthlyPaymentCents,
  }));
  const initialPrincipal = active.reduce((sum, d) => sum + d.balance, 0);
  // Total monthly budget is fixed: sum of all minimums plus the extra contribution.
  // As debts are cleared, their freed minimums roll into the priority debt.
  const totalBudget = active.reduce((sum, d) => sum + d.minimum, 0) + extraMonthlyBudgetCents;

  const schedule: PayoffMonthSnapshot[] = [];
  let totalInterest = 0;
  let remaining = initialPrincipal;
  let month = 0;

  while (remaining > 0 && month < MAX_SIMULATION_MONTHS) {
    month += 1;

    // 1. Accrue interest.
    let interestThisMonth = 0;
    for (const d of active) {
      if (d.balance <= 0) continue;
      const interest = Math.round(d.balance * (d.apr / 100 / 12));
      d.balance += interest;
      interestThisMonth += interest;
    }

    // 2. Pay minimums on every active debt (never more than owed).
    let pool = totalBudget;
    let paidThisMonth = 0;
    for (const d of active) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minimum, d.balance);
      d.balance -= pay;
      pool -= pay;
      paidThisMonth += pay;
    }

    // 3. Waterfall the rest (extra + freed minimums + unused capped minimums) by priority.
    const ordered = active.filter((d) => d.balance > 0).sort((a, b) => compareByStrategy(strategy, a, b));
    for (const d of ordered) {
      if (pool <= 0) break;
      const pay = Math.min(pool, d.balance);
      d.balance -= pay;
      pool -= pay;
      paidThisMonth += pay;
    }

    remaining = active.reduce((sum, d) => sum + d.balance, 0);
    totalInterest += interestThisMonth;
    schedule.push({
      monthIndex: month,
      remainingTotalPrincipalCents: remaining,
      interestPaidThisMonthCents: interestThisMonth,
      principalPaidThisMonthCents: paidThisMonth - interestThisMonth,
      debtsRemaining: active.filter((d) => d.balance > 0).length,
    });
  }

  return {
    strategy,
    monthsToDebtFree: month,
    totalInterestPaidCents: totalInterest,
    totalPrincipalPaidCents: initialPrincipal - remaining,
    monthlySchedule: schedule,
  };
}

export function comparePayoffStrategies(
  debts: readonly DebtItem[],
  extraMonthlyBudgetCents: number
): DebtAccelerationComparison {
  const snowball = simulateDebtPayoff(debts, extraMonthlyBudgetCents, 'snowball');
  const avalanche = simulateDebtPayoff(debts, extraMonthlyBudgetCents, 'avalanche');
  return {
    snowball,
    avalanche,
    interestSavingsWithAvalancheCents: snowball.totalInterestPaidCents - avalanche.totalInterestPaidCents,
    monthsSavedWithAvalanche: snowball.monthsToDebtFree - avalanche.monthsToDebtFree,
  };
}

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
  principalPaidThisMonthCents: number;
  debtsRemaining: number;
}

export interface StrategyPayoffResult {
  strategy: PayoffStrategy;
  /** Months until every balance is zero; equals MAX_SIMULATION_MONTHS if debts remain at the cap. */
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

/** 50 years; stops the loop when minimum payments never cover interest. */
export const MAX_SIMULATION_MONTHS = 600;

interface ActiveDebt {
  balance: number;
  apr: number;
  minimum: number;
}

function validate(debts: readonly DebtItem[], extraMonthlyBudgetCents: number): void {
  if (!Number.isSafeInteger(extraMonthlyBudgetCents)) {
    throw new TypeError('extraMonthlyBudgetCents must be a safe integer.');
  }
  if (extraMonthlyBudgetCents < 0) {
    throw new RangeError('extraMonthlyBudgetCents must be non-negative.');
  }
  for (const debt of debts) {
    if (
      !Number.isSafeInteger(debt.principalBalanceCents) ||
      !Number.isSafeInteger(debt.minimumMonthlyPaymentCents) ||
      !Number.isFinite(debt.annualInterestRatePercent)
    ) {
      throw new TypeError(`Debt "${debt.id}" has a non-numeric or non-finite value.`);
    }
    if (debt.principalBalanceCents <= 0 || debt.minimumMonthlyPaymentCents <= 0 || debt.annualInterestRatePercent < 0) {
      throw new RangeError(`Debt "${debt.id}" needs balance > 0, minimum payment > 0 and APR >= 0.`);
    }
  }
}

// Sort is stable, so full ties keep input order.
const comparators: Record<PayoffStrategy, (a: ActiveDebt, b: ActiveDebt) => number> = {
  snowball: (a, b) => a.balance - b.balance || b.apr - a.apr,
  avalanche: (a, b) => b.apr - a.apr || a.balance - b.balance,
};

export function simulateDebtPayoff(
  debts: readonly DebtItem[],
  extraMonthlyBudgetCents: number,
  strategy: PayoffStrategy
): StrategyPayoffResult {
  validate(debts, extraMonthlyBudgetCents);

  const active: ActiveDebt[] = debts.map((d) => ({
    balance: d.principalBalanceCents,
    apr: d.annualInterestRatePercent,
    minimum: d.minimumMonthlyPaymentCents,
  }));
  // Minimums of paid-off debts stay in the budget and roll over to the target debt.
  const monthlyBudget = extraMonthlyBudgetCents + active.reduce((sum, d) => sum + d.minimum, 0);
  const startingPrincipal = active.reduce((sum, d) => sum + d.balance, 0);

  const monthlySchedule: PayoffMonthSnapshot[] = [];
  let totalInterestPaidCents = 0;
  let remaining = startingPrincipal;

  while (remaining > 0 && monthlySchedule.length < MAX_SIMULATION_MONTHS) {
    // Priority is ranked on start-of-month balances.
    const open = active.filter((d) => d.balance > 0).sort(comparators[strategy]);

    let interest = 0;
    for (const d of open) {
      const accrued = Math.round(d.balance * (d.apr / 100 / 12));
      d.balance += accrued;
      interest += accrued;
    }

    let budget = monthlyBudget;
    for (const d of open) {
      const pay = Math.min(d.minimum, d.balance);
      d.balance -= pay;
      budget -= pay;
    }

    for (const d of open) {
      if (budget === 0) break;
      const pay = Math.min(budget, d.balance);
      d.balance -= pay;
      budget -= pay;
    }

    const newRemaining = active.reduce((sum, d) => sum + d.balance, 0);
    totalInterestPaidCents += interest;
    monthlySchedule.push({
      monthIndex: monthlySchedule.length + 1,
      remainingTotalPrincipalCents: newRemaining,
      interestPaidThisMonthCents: interest,
      // Negative when payments do not cover the interest accrued.
      principalPaidThisMonthCents: remaining - newRemaining,
      debtsRemaining: active.filter((d) => d.balance > 0).length,
    });
    remaining = newRemaining;
  }

  return {
    strategy,
    monthsToDebtFree: monthlySchedule.length,
    totalInterestPaidCents,
    totalPrincipalPaidCents: startingPrincipal - remaining,
    monthlySchedule,
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

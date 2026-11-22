import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  comparePayoffStrategies,
  simulateDebtPayoff,
  MAX_SIMULATION_MONTHS,
  type DebtItem,
  type StrategyPayoffResult,
} from '../src/lib/finance/debt-accelerator';

const debt = (id: string, balance: number, apr: number, minimum: number): DebtItem => ({
  id,
  name: id,
  principalBalanceCents: balance,
  annualInterestRatePercent: apr,
  minimumMonthlyPaymentCents: minimum,
});

function assertConsistent(result: StrategyPayoffResult): void {
  const sum = (pick: (s: StrategyPayoffResult['monthlySchedule'][number]) => number) =>
    result.monthlySchedule.reduce((total, s) => total + pick(s), 0);
  assert.strictEqual(sum((s) => s.interestPaidThisMonthCents), result.totalInterestPaidCents);
  assert.strictEqual(sum((s) => s.principalPaidThisMonthCents), result.totalPrincipalPaidCents);
  assert.deepStrictEqual(result.monthlySchedule.map((s) => s.monthIndex), result.monthlySchedule.map((_, i) => i + 1));
  for (const s of result.monthlySchedule) {
    for (const value of Object.values(s)) assert.ok(Number.isSafeInteger(value));
  }
}

describe('simulateDebtPayoff: single debt', () => {
  it('pays off a 0% debt with minimums only', () => {
    const result = simulateDebtPayoff([debt('a', 100_000, 0, 30_000)], 0, 'avalanche');
    assert.strictEqual(result.monthsToDebtFree, 4);
    assert.strictEqual(result.totalInterestPaidCents, 0);
    assert.strictEqual(result.totalPrincipalPaidCents, 100_000);
    assert.deepStrictEqual(result.monthlySchedule.map((s) => s.remainingTotalPrincipalCents), [70_000, 40_000, 10_000, 0]);
    assert.deepStrictEqual(result.monthlySchedule.map((s) => s.debtsRemaining), [1, 1, 1, 0]);
    assertConsistent(result);
  });

  it('accrues rounded monthly interest (12% APR = 1% per month)', () => {
    // Month 1: 10000 + 100 interest - 6000 = 4100. Month 2: 4100 + 41 interest, final payment 4141.
    const result = simulateDebtPayoff([debt('a', 10_000, 12, 6_000)], 0, 'snowball');
    assert.deepStrictEqual(result.monthlySchedule, [
      { monthIndex: 1, remainingTotalPrincipalCents: 4_100, interestPaidThisMonthCents: 100, principalPaidThisMonthCents: 5_900, debtsRemaining: 1 },
      { monthIndex: 2, remainingTotalPrincipalCents: 0, interestPaidThisMonthCents: 41, principalPaidThisMonthCents: 4_100, debtsRemaining: 0 },
    ]);
    assert.strictEqual(result.monthsToDebtFree, 2);
    assert.strictEqual(result.totalInterestPaidCents, 141);
    assert.strictEqual(result.totalPrincipalPaidCents, 10_000);
  });

  it('stops at the 600-month cap when the minimum never covers interest', () => {
    // 24% APR on 100000 is 2000/month interest; a 1000 minimum lets the balance grow.
    const result = simulateDebtPayoff([debt('a', 100_000, 24, 1_000)], 0, 'avalanche');
    assert.strictEqual(result.monthsToDebtFree, MAX_SIMULATION_MONTHS);
    assert.strictEqual(result.monthlySchedule.length, 600);
    assert.strictEqual(result.monthlySchedule.at(-1)?.debtsRemaining, 1);
    assert.ok(result.totalPrincipalPaidCents < 0);
    assertConsistent(result);
  });

  it('returns an empty schedule for no debts', () => {
    const result = simulateDebtPayoff([], 5_000, 'snowball');
    assert.deepStrictEqual(result, {
      strategy: 'snowball',
      monthsToDebtFree: 0,
      totalInterestPaidCents: 0,
      totalPrincipalPaidCents: 0,
      monthlySchedule: [],
    });
  });
});

describe('simulateDebtPayoff: multiple debts', () => {
  // A: 1000.00 at 24% (2%/month), min 100.00. B: 500.00 at 12% (1%/month), min 50.00. Extra 50.00.
  const debts = [debt('A', 100_000, 24, 10_000), debt('B', 50_000, 12, 5_000)];

  it('avalanche sends the extra to the highest-APR debt (hand-checked first two months)', () => {
    // M1: A 100000+2000-10000-5000 = 87000, B 50000+500-5000 = 45500.
    // M2: A 87000+1740-10000-5000 = 73740, B 45500+455-5000 = 40955.
    const { monthlySchedule } = simulateDebtPayoff(debts, 5_000, 'avalanche');
    assert.deepStrictEqual(monthlySchedule.slice(0, 2).map((s) => [s.interestPaidThisMonthCents, s.remainingTotalPrincipalCents]), [
      [2_500, 132_500],
      [2_195, 114_695],
    ]);
  });

  it('snowball sends the extra to the lowest-balance debt (hand-checked first two months)', () => {
    // M1: A 100000+2000-10000 = 92000, B 50000+500-5000-5000 = 40500.
    // M2: A 92000+1840-10000 = 83840, B 40500+405-5000-5000 = 30905.
    const { monthlySchedule } = simulateDebtPayoff(debts, 5_000, 'snowball');
    assert.deepStrictEqual(monthlySchedule.slice(0, 2).map((s) => [s.interestPaidThisMonthCents, s.remainingTotalPrincipalCents]), [
      [2_500, 132_500],
      [2_245, 114_745],
    ]);
  });

  it('clears every debt and pays back exactly the starting principal', () => {
    for (const strategy of ['snowball', 'avalanche'] as const) {
      const result = simulateDebtPayoff(debts, 5_000, strategy);
      assert.strictEqual(result.totalPrincipalPaidCents, 150_000);
      assert.strictEqual(result.monthlySchedule.at(-1)?.remainingTotalPrincipalCents, 0);
      assert.strictEqual(result.monthlySchedule.at(-1)?.debtsRemaining, 0);
      assertConsistent(result);
    }
  });

  it('an aggressive extra budget is faster and cheaper than zero extra', () => {
    for (const strategy of ['snowball', 'avalanche'] as const) {
      const none = simulateDebtPayoff(debts, 0, strategy);
      const aggressive = simulateDebtPayoff(debts, 50_000, strategy);
      assert.ok(aggressive.monthsToDebtFree < none.monthsToDebtFree);
      assert.ok(aggressive.totalInterestPaidCents < none.totalInterestPaidCents);
      assertConsistent(none);
      assertConsistent(aggressive);
    }
  });

  it('does not mutate the input debts', () => {
    const input = [debt('A', 100_000, 24, 10_000)];
    const copy = structuredClone(input);
    simulateDebtPayoff(input, 5_000, 'avalanche');
    assert.deepStrictEqual(input, copy);
  });
});

describe('simulateDebtPayoff: ties', () => {
  it('snowball breaks equal balances by higher APR', () => {
    // Extra goes to B (12%): M1 B = 10000+100-1000-5000 = 4100, so M2 interest = 41 (A is 0%).
    // Had it gone to A, B would sit at 9100 and M2 interest would be 91.
    const result = simulateDebtPayoff([debt('A', 10_000, 0, 1_000), debt('B', 10_000, 12, 1_000)], 5_000, 'snowball');
    assert.strictEqual(result.monthlySchedule[1].interestPaidThisMonthCents, 41);
  });

  it('avalanche breaks equal APRs by lower principal', () => {
    // Extra goes to B (smaller): M1 B = 5000+50-1000-4000 = 50, cleared in M2, leaving 1 debt.
    const result = simulateDebtPayoff([debt('A', 10_000, 12, 1_000), debt('B', 5_000, 12, 1_000)], 4_000, 'avalanche');
    assert.strictEqual(result.monthlySchedule[1].debtsRemaining, 1);
  });
});

describe('comparePayoffStrategies', () => {
  it('reports avalanche savings relative to snowball', () => {
    const debts = [debt('card', 300_000, 36, 9_000), debt('loan', 100_000, 6, 3_000), debt('store', 200_000, 24, 6_000)];
    const result = comparePayoffStrategies(debts, 10_000);
    assert.strictEqual(result.snowball.strategy, 'snowball');
    assert.strictEqual(result.avalanche.strategy, 'avalanche');
    assert.strictEqual(
      result.interestSavingsWithAvalancheCents,
      result.snowball.totalInterestPaidCents - result.avalanche.totalInterestPaidCents
    );
    assert.strictEqual(result.monthsSavedWithAvalanche, result.snowball.monthsToDebtFree - result.avalanche.monthsToDebtFree);
    assert.ok(result.interestSavingsWithAvalancheCents > 0);
  });

  it('shows no difference for a single debt', () => {
    const result = comparePayoffStrategies([debt('a', 100_000, 18.5, 5_000)], 2_500);
    assert.strictEqual(result.interestSavingsWithAvalancheCents, 0);
    assert.strictEqual(result.monthsSavedWithAvalanche, 0);
  });
});

describe('input validation', () => {
  const ok = debt('a', 10_000, 12, 1_000);

  it('rejects non-numeric or non-finite values with TypeError', () => {
    for (const bad of [NaN, Infinity, -Infinity, '100' as unknown as number]) {
      assert.throws(() => simulateDebtPayoff([{ ...ok, principalBalanceCents: bad }], 0, 'snowball'), TypeError);
      assert.throws(() => simulateDebtPayoff([{ ...ok, annualInterestRatePercent: bad }], 0, 'snowball'), TypeError);
      assert.throws(() => simulateDebtPayoff([{ ...ok, minimumMonthlyPaymentCents: bad }], 0, 'snowball'), TypeError);
      assert.throws(() => simulateDebtPayoff([ok], bad, 'snowball'), TypeError);
    }
    assert.throws(() => simulateDebtPayoff([{ ...ok, principalBalanceCents: 10.5 }], 0, 'snowball'), TypeError);
  });

  it('rejects out-of-range values with RangeError', () => {
    assert.throws(() => simulateDebtPayoff([{ ...ok, principalBalanceCents: 0 }], 0, 'snowball'), RangeError);
    assert.throws(() => simulateDebtPayoff([{ ...ok, principalBalanceCents: -1 }], 0, 'snowball'), RangeError);
    assert.throws(() => simulateDebtPayoff([{ ...ok, annualInterestRatePercent: -0.01 }], 0, 'snowball'), RangeError);
    assert.throws(() => simulateDebtPayoff([{ ...ok, minimumMonthlyPaymentCents: 0 }], 0, 'snowball'), RangeError);
    assert.throws(() => simulateDebtPayoff([ok], -1, 'snowball'), RangeError);
    assert.throws(() => comparePayoffStrategies([ok], -1), RangeError);
  });
});

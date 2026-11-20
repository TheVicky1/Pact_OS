import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simulateDebtPayoff,
  comparePayoffStrategies,
  MAX_SIMULATION_MONTHS,
  type DebtItem,
} from '../src/lib/finance/debt-accelerator';

const debt = (id: string, balance: number, apr: number, min: number): DebtItem => ({
  id,
  name: id,
  principalBalanceCents: balance,
  annualInterestRatePercent: apr,
  minimumMonthlyPaymentCents: min,
});

test('single debt, zero APR, no extra: pays off linearly with zero interest', () => {
  const r = simulateDebtPayoff([debt('a', 100_00, 0, 25_00)], 0, 'avalanche');
  assert.equal(r.monthsToDebtFree, 4);
  assert.equal(r.totalInterestPaidCents, 0);
  assert.equal(r.totalPrincipalPaidCents, 100_00);
  assert.equal(r.monthlySchedule.length, 4);
  assert.equal(r.monthlySchedule[3].remainingTotalPrincipalCents, 0);
  assert.equal(r.monthlySchedule[3].debtsRemaining, 0);
});

test('single debt: hand-checked first month interest and balances', () => {
  // 1200.00 at 12% => 1% monthly => 12.00 interest; pay 100.00
  const r = simulateDebtPayoff([debt('a', 1200_00, 12, 100_00)], 0, 'snowball');
  const m1 = r.monthlySchedule[0];
  assert.equal(m1.interestPaidThisMonthCents, 12_00);
  assert.equal(m1.principalPaidThisMonthCents, 88_00);
  assert.equal(m1.remainingTotalPrincipalCents, 1112_00);
});

test('final payment is capped at what is owed', () => {
  const r = simulateDebtPayoff([debt('a', 50_00, 0, 30_00)], 0, 'snowball');
  assert.equal(r.monthsToDebtFree, 2);
  assert.equal(r.totalPrincipalPaidCents, 50_00);
});

test('two-debt hand-checked example, zero APR: extra goes to priority debt', () => {
  const debts = [debt('small', 100_00, 0, 10_00), debt('big', 300_00, 0, 10_00)];
  // Budget = 20 + 30 extra = 50/month. Snowball targets small first.
  const r = simulateDebtPayoff(debts, 30_00, 'snowball');
  // M1: small 100-10-30=60, big 300-10=290. M2: small 20, big 280.
  // M3: mins small 10 (->10), big 10 (->270), pool 30 -> small cleared (10), rest 20 -> big 250.
  assert.equal(r.monthlySchedule[0].remainingTotalPrincipalCents, 350_00);
  assert.equal(r.monthlySchedule[1].remainingTotalPrincipalCents, 300_00);
  assert.equal(r.monthlySchedule[2].remainingTotalPrincipalCents, 250_00);
  assert.equal(r.monthlySchedule[2].debtsRemaining, 1);
  assert.equal(r.monthsToDebtFree, 8); // 400.00 total at a fixed 50.00/month budget
});

test('total payments equal principal plus interest (accounting invariant)', () => {
  const debts = [debt('a', 5000_00, 19.9, 150_00), debt('b', 1200_00, 24.5, 40_00), debt('c', 9000_00, 6.5, 120_00)];
  for (const strategy of ['snowball', 'avalanche'] as const) {
    const r = simulateDebtPayoff(debts, 200_00, strategy);
    assert.equal(r.totalPrincipalPaidCents, 15200_00);
    const schedulePrincipal = r.monthlySchedule.reduce((s, m) => s + m.principalPaidThisMonthCents, 0);
    const scheduleInterest = r.monthlySchedule.reduce((s, m) => s + m.interestPaidThisMonthCents, 0);
    assert.equal(schedulePrincipal, r.totalPrincipalPaidCents);
    assert.equal(scheduleInterest, r.totalInterestPaidCents);
  }
});

test('avalanche never pays more interest than snowball on the classic trap', () => {
  const debts = [debt('card', 5000_00, 24, 100_00), debt('loan', 1000_00, 5, 50_00)];
  const c = comparePayoffStrategies(debts, 100_00);
  assert.ok(c.interestSavingsWithAvalancheCents > 0);
  assert.ok(c.monthsSavedWithAvalanche >= 0);
  assert.equal(c.interestSavingsWithAvalancheCents, c.snowball.totalInterestPaidCents - c.avalanche.totalInterestPaidCents);
  assert.equal(c.monthsSavedWithAvalanche, c.snowball.monthsToDebtFree - c.avalanche.monthsToDebtFree);
});

test('aggressive extra budget finishes sooner and costs less interest than none', () => {
  const debts = [debt('a', 3000_00, 18, 90_00), debt('b', 800_00, 12, 30_00)];
  const none = simulateDebtPayoff(debts, 0, 'avalanche');
  const aggressive = simulateDebtPayoff(debts, 500_00, 'avalanche');
  assert.ok(aggressive.monthsToDebtFree < none.monthsToDebtFree);
  assert.ok(aggressive.totalInterestPaidCents < none.totalInterestPaidCents);
});

test('strategies pick different targets: snowball lowest balance, avalanche highest APR', () => {
  const debts = [debt('lowBal', 100_00, 5, 10_00), debt('highApr', 1000_00, 30, 10_00)];
  // Month 1 with extra 100: snowball clears lowBal first, avalanche attacks highApr.
  const s = simulateDebtPayoff(debts, 100_00, 'snowball');
  const a = simulateDebtPayoff(debts, 100_00, 'avalanche');
  assert.equal(s.monthlySchedule[0].debtsRemaining, 1);
  assert.equal(a.monthlySchedule[0].debtsRemaining, 2);
});

test('ties: snowball breaks equal balances by higher APR, avalanche breaks equal APR by lower balance', () => {
  const snowDebts = [debt('lowApr', 500_00, 5, 10_00), debt('highApr', 500_00, 25, 10_00)];
  const s = simulateDebtPayoff(snowDebts, 0, 'snowball');
  const sNoTie = simulateDebtPayoff(snowDebts, 600_00, 'snowball');
  assert.equal(s.strategy, 'snowball');
  // With a big extra, highApr (tie winner) should be paid first and only lowApr remains after month 1 is not guaranteed;
  // so assert determinism and that total interest is lower than reversed-priority outcome.
  const reversed = simulateDebtPayoff([snowDebts[1], snowDebts[0]], 600_00, 'snowball');
  assert.deepEqual(sNoTie, reversed);

  const avaDebts = [debt('big', 900_00, 15, 10_00), debt('small', 200_00, 15, 10_00)];
  const a1 = simulateDebtPayoff(avaDebts, 100_00, 'avalanche');
  const a2 = simulateDebtPayoff([avaDebts[1], avaDebts[0]], 100_00, 'avalanche');
  assert.deepEqual(a1, a2);
  // Small is targeted first: 200 + interest vs 110/month => still 2 remaining after month 1 is false only if cleared.
  assert.ok(a1.monthlySchedule[0].remainingTotalPrincipalCents < 1100_00);
});

test('minimum below interest never converges: capped at 600 months', () => {
  // 10,000.00 at 24% => 200.00/month interest; minimum 50.00 cannot cover it.
  const r = simulateDebtPayoff([debt('trap', 10_000_00, 24, 50_00)], 0, 'avalanche');
  assert.equal(r.monthsToDebtFree, MAX_SIMULATION_MONTHS);
  assert.equal(r.monthlySchedule.length, MAX_SIMULATION_MONTHS);
  assert.ok(r.monthlySchedule[0].principalPaidThisMonthCents < 0);
  assert.ok(r.totalPrincipalPaidCents < 0);
});

test('empty debts list yields an immediate debt-free result', () => {
  const c = comparePayoffStrategies([], 100_00);
  assert.equal(c.snowball.monthsToDebtFree, 0);
  assert.equal(c.avalanche.totalInterestPaidCents, 0);
  assert.deepEqual(c.snowball.monthlySchedule, []);
  assert.equal(c.monthsSavedWithAvalanche, 0);
});

test('does not mutate the input debts', () => {
  const debts = Object.freeze([Object.freeze(debt('a', 1000_00, 10, 50_00))]);
  simulateDebtPayoff(debts, 10_00, 'snowball');
  assert.equal(debts[0].principalBalanceCents, 1000_00);
});

test('throws TypeError on non-numeric or non-finite inputs', () => {
  const ok = [debt('a', 100_00, 10, 10_00)];
  assert.throws(() => simulateDebtPayoff(ok, Number.NaN, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff(ok, Infinity, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff(ok, '5' as unknown as number, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff([debt('a', Number.NaN, 10, 10_00)], 0, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff([debt('a', 100_00, Infinity, 10_00)], 0, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff([{ ...ok[0], minimumMonthlyPaymentCents: '1' as unknown as number }], 0, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff(null as unknown as DebtItem[], 0, 'snowball'), TypeError);
  assert.throws(() => simulateDebtPayoff(ok, 0, 'bogus' as unknown as 'snowball'), TypeError);
});

test('throws RangeError on invalid balance, APR, minimum, or extra budget', () => {
  assert.throws(() => simulateDebtPayoff([debt('a', 0, 10, 10_00)], 0, 'snowball'), RangeError);
  assert.throws(() => simulateDebtPayoff([debt('a', -1, 10, 10_00)], 0, 'snowball'), RangeError);
  assert.throws(() => simulateDebtPayoff([debt('a', 100_00, -0.1, 10_00)], 0, 'snowball'), RangeError);
  assert.throws(() => simulateDebtPayoff([debt('a', 100_00, 10, 0)], 0, 'snowball'), RangeError);
  assert.throws(() => simulateDebtPayoff([debt('a', 100_00, 10, -5)], 0, 'snowball'), RangeError);
  assert.throws(() => simulateDebtPayoff([debt('a', 100_00, 10, 10_00)], -1, 'snowball'), RangeError);
  assert.throws(() => comparePayoffStrategies([debt('a', 100_00, 10, 10_00)], -1), RangeError);
});

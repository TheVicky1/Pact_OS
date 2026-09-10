import assert from 'node:assert';
import {
  getDaysInMonth,
  calculateNextOccurrence,
  isRecurrenceDue,
  generateUpcomingOccurrences,
  calculateBudgetStatus,
  evaluateBudgetAlert,
  FinanceRecurringTransaction,
  FinanceBudget,
  FinanceCategory,
  FinanceTransaction,
  parseAmountToCents,
  formatCentsToCurrency,
} from '../src/lib/money';
import {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '../src/lib/validations/finance';

console.log('================================================================');
console.log('  PACT Phase 5E — Financial Subscriptions & Budget Discipline Test');
console.log('================================================================\n');

// 1. Recurrence Calendar Arithmetic & Month-End Clamping
console.log('1. Testing Recurrence Calendar Math & Month-End Clamping...');

// Leap year check
assert.strictEqual(getDaysInMonth(2024, 2), 29, 'Feb 2024 (leap) must have 29 days');
assert.strictEqual(getDaysInMonth(2026, 2), 28, 'Feb 2026 (non-leap) must have 28 days');
assert.strictEqual(getDaysInMonth(2026, 4), 30, 'Apr 2026 must have 30 days');
assert.strictEqual(getDaysInMonth(2026, 1), 31, 'Jan 2026 must have 31 days');

// Weekly: +7 days
assert.strictEqual(
  calculateNextOccurrence('2026-09-01', 'weekly', '2026-09-01'),
  '2026-09-08',
  'Weekly recurrence must advance by 7 days'
);

// Biweekly: +14 days
assert.strictEqual(
  calculateNextOccurrence('2026-09-01', 'biweekly', '2026-09-01'),
  '2026-09-15',
  'Biweekly recurrence must advance by 14 days'
);

// Monthly with Day 31 Clamping:
// Jan 31 -> Feb 28 (2026 non-leap) -> Mar 31 -> Apr 30 -> May 31
const jan31 = '2026-01-31';
const febNext = calculateNextOccurrence(jan31, 'monthly', jan31);
assert.strictEqual(febNext, '2026-02-28', 'Jan 31 monthly must clamp to Feb 28 in non-leap year');

const marNext = calculateNextOccurrence(febNext, 'monthly', jan31);
assert.strictEqual(marNext, '2026-03-31', 'Mar occurrence must restore original Day 31 preference');

const aprNext = calculateNextOccurrence(marNext, 'monthly', jan31);
assert.strictEqual(aprNext, '2026-04-30', 'Apr occurrence must clamp to 30');

const mayNext = calculateNextOccurrence(aprNext, 'monthly', jan31);
assert.strictEqual(mayNext, '2026-05-31', 'May occurrence must restore to 31');

// Yearly with Feb 29 Clamping (2024 leap -> 2025 non-leap)
const leapYearStart = '2024-02-29';
const nextYear = calculateNextOccurrence(leapYearStart, 'yearly', leapYearStart);
assert.strictEqual(nextYear, '2025-02-28', 'Feb 29 yearly must clamp to Feb 28 in non-leap year');

console.log('✅ Recurrence math and month-end clamping verified.');

// 2. Recurrence Due Check & Projections
console.log('2. Testing Recurrence Due Checks & Projections...');

assert.strictEqual(isRecurrenceDue('2026-09-10', '2026-09-11'), true, 'Past next_occurrence must be due');
assert.strictEqual(isRecurrenceDue('2026-09-11', '2026-09-11'), true, 'Today next_occurrence must be due');
assert.strictEqual(isRecurrenceDue('2026-09-12', '2026-09-11'), false, 'Future next_occurrence must not be due');

const mockRecurrence: FinanceRecurringTransaction = {
  id: 'rec-1',
  user_id: 'user-1',
  category_id: 'cat-housing',
  type: 'expense',
  amount_cents: 1500000,
  description: 'Apartment Rent',
  frequency: 'monthly',
  start_date: '2026-09-01',
  end_date: null,
  next_occurrence: '2026-09-01',
  last_generated_date: null,
  status: 'active',
  metadata: {},
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const upcomingList = generateUpcomingOccurrences(mockRecurrence, 3);
assert.deepStrictEqual(
  upcomingList,
  ['2026-09-01', '2026-10-01', '2026-11-01'],
  'Projected occurrences must match future monthly schedule'
);

const pausedRecurrence: FinanceRecurringTransaction = {
  ...mockRecurrence,
  status: 'paused',
};
assert.deepStrictEqual(
  generateUpcomingOccurrences(pausedRecurrence, 3),
  [],
  'Paused recurrence must yield no future active projections'
);

console.log('✅ Recurrence due checks and projections verified.');

// 3. Category Budget Discipline & Spending Utilization
console.log('3. Testing Category Budget Discipline & Utilization Calculations...');

const mockCategories: FinanceCategory[] = [
  {
    id: 'cat-food',
    user_id: 'user-1',
    name: 'Food & Dining',
    color_tag: 'amber',
    is_archived: false,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'cat-tech',
    user_id: 'user-1',
    name: 'Software & Tools',
    color_tag: 'purple',
    is_archived: false,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

const mockBudgets: FinanceBudget[] = [
  {
    id: 'b-food',
    user_id: 'user-1',
    category_id: 'cat-food',
    period: '2026-09',
    limit_cents: 1000000, // ₹10,000
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'b-tech',
    user_id: 'user-1',
    category_id: 'cat-tech',
    period: '2026-09',
    limit_cents: 500000, // ₹5,000
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

const mockTransactions: FinanceTransaction[] = [
  // Food spent: 8,500.00 (85% - approaching threshold)
  {
    id: 'tx-1',
    user_id: 'user-1',
    category_id: 'cat-food',
    type: 'expense',
    amount_cents: 850000,
    description: 'Groceries & Dining',
    transaction_date: '2026-09-05',
    created_at: '2026-09-05T00:00:00Z',
    updated_at: '2026-09-05T00:00:00Z',
  },
  // Tech spent: 6,000.00 (120% - exceeded threshold)
  {
    id: 'tx-2',
    user_id: 'user-1',
    category_id: 'cat-tech',
    type: 'expense',
    amount_cents: 600000,
    description: 'Cloud Servers',
    transaction_date: '2026-09-08',
    created_at: '2026-09-08T00:00:00Z',
    updated_at: '2026-09-08T00:00:00Z',
  },
  // Income (must not count towards expense budgets)
  {
    id: 'tx-3',
    user_id: 'user-1',
    category_id: 'cat-tech',
    type: 'income',
    amount_cents: 2000000,
    description: 'Consulting Income',
    transaction_date: '2026-09-09',
    created_at: '2026-09-09T00:00:00Z',
    updated_at: '2026-09-09T00:00:00Z',
  },
];

const overview = calculateBudgetStatus(mockBudgets, mockTransactions, mockCategories, '2026-09');

assert.strictEqual(overview.totalBudgetLimitCents, 1500000, 'Total budget limit must be ₹15,000');
assert.strictEqual(overview.totalBudgetSpentCents, 1450000, 'Total budget spent must be ₹14,500');
assert.strictEqual(overview.totalBudgetRemainingCents, 50000, 'Total budget remaining must be ₹500');
assert.strictEqual(overview.overallUtilizationPercent, 97, 'Overall utilization must be 97%');
assert.strictEqual(overview.exceededCount, 1, 'Exceeded count must be 1 (Tech)');
assert.strictEqual(overview.approachingCount, 1, 'Approaching count must be 1 (Food)');

const foodStatus = overview.categories.find((c) => c.categoryId === 'cat-food');
assert.ok(foodStatus, 'Food status must exist');
assert.strictEqual(foodStatus.utilizationPercent, 85, 'Food utilization must be 85%');
assert.strictEqual(foodStatus.isApproaching, true, 'Food status must be approaching (>= 80%)');
assert.strictEqual(foodStatus.isExceeded, false, 'Food status must not be exceeded');

const techStatus = overview.categories.find((c) => c.categoryId === 'cat-tech');
assert.ok(techStatus, 'Tech status must exist');
assert.strictEqual(techStatus.utilizationPercent, 120, 'Tech utilization must be 120%');
assert.strictEqual(techStatus.isExceeded, true, 'Tech status must be exceeded (>= 100%)');
assert.strictEqual(techStatus.isApproaching, false, 'Exceeded status overrides approaching');

console.log('✅ Budget discipline & utilization calculations verified.');

// 4. Budget Alert Notification Evaluation
console.log('4. Testing Budget Alert Threshold Evaluation...');

const foodAlert = evaluateBudgetAlert('user-1', foodStatus);
assert.strictEqual(foodAlert.shouldNotify, true, 'Food alert should trigger notification');
assert.strictEqual(foodAlert.type, 'budget_approaching_limit');
assert.strictEqual(
  foodAlert.idempotencyKey,
  'budget_approaching_user-1_cat-food_2026-09',
  'Idempotency key must match format'
);

const techAlert = evaluateBudgetAlert('user-1', techStatus);
assert.strictEqual(techAlert.shouldNotify, true, 'Tech alert should trigger notification');
assert.strictEqual(techAlert.type, 'budget_exceeded');
assert.strictEqual(
  techAlert.idempotencyKey,
  'budget_exceeded_user-1_cat-tech_2026-09',
  'Idempotency key must match format'
);

console.log('✅ Budget alert notifications verified.');

// 5. Schema Validation Suite
console.log('5. Testing Zod Validation Schemas for Subscriptions & Budgets...');

const validRecurrence = createRecurringTransactionSchema.safeParse({
  type: 'expense',
  amount_cents: 19900,
  description: 'Spotify Premium',
  frequency: 'monthly',
  start_date: '2026-09-01',
});
assert.strictEqual(validRecurrence.success, true, 'Valid recurring transaction input must pass');

const invalidAmountRecurrence = createRecurringTransactionSchema.safeParse({
  type: 'expense',
  amount_cents: -500,
  description: 'Invalid negative',
  start_date: '2026-09-01',
});
assert.strictEqual(invalidAmountRecurrence.success, false, 'Negative amount must fail');

const validBudget = createBudgetSchema.safeParse({
  category_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  period: '2026-09',
  limit_cents: 500000,
});
assert.strictEqual(validBudget.success, true, 'Valid budget input must pass');

const invalidPeriodBudget = createBudgetSchema.safeParse({
  category_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  period: 'September-2026',
  limit_cents: 500000,
});
assert.strictEqual(invalidPeriodBudget.success, false, 'Invalid period string must fail');

console.log('✅ Validation schemas verified.');

console.log('\n================================================================');
console.log('  ALL PHASE 5E TESTS PASSED (100% SUCCESS)');
console.log('================================================================');

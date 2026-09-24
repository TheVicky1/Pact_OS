import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';
import {
  calculateBudgetStatus,
  evaluateBudgetAlert,
  formatCentsToCurrency,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceTransaction,
  type MonthlyBudgetOverview,
} from '../src/lib/money';

const category: FinanceCategory = {
  id: 'food', user_id: 'user-1', name: 'Food', color_tag: 'amber',
  is_archived: false, created_at: '', updated_at: '',
};
const budget: FinanceBudget = {
  id: 'budget-1', user_id: 'user-1', category_id: category.id,
  period: '2026-09', limit_cents: 10000, is_active: true,
  created_at: '', updated_at: '',
};
function overviewFor(spentCents: number) {
  const transaction: FinanceTransaction = {
    id: 'expense-1', user_id: 'user-1', category_id: category.id,
    type: 'expense', amount_cents: spentCents, description: 'Fixture expense',
    transaction_date: '2026-09-12', created_at: '', updated_at: '',
  };
  return calculateBudgetStatus([budget], [transaction], [category], '2026-09');
}

for (const [spent, remaining, exceeded, utilization] of [
  [0, 10000, false, 0],
  [8000, 2000, false, 80],
  [9999, 1, false, 100],
  [10000, 0, true, 100],
  [10001, 0, true, 100],
  [12000, 0, true, 120],
] as const) {
  const overview = overviewFor(spent);
  const status = overview.categories[0];
  assert.equal(status.remainingCents, remaining, `Remaining cents after spending ${spent}`);
  assert.equal(status.spentCents, spent, 'Clamping must not hide actual spending');
  assert.equal(status.isExceeded, exceeded, `Exceeded flag for ${spent}`);
  assert.equal(status.utilizationPercent, utilization, `Utilization for ${spent}`);
  assert.equal(overview.totalBudgetRemainingCents, 10000 - spent, 'Aggregate net balance retains its signed contract');
  if (exceeded) {
    assert.equal(evaluateBudgetAlert('user-1', status).type, 'budget_exceeded');
  }
}
// Budget boundary: spending exactly the budget leaves 0 remaining and 100% used.
const exactBudgetOverview = overviewFor(10000);
const exactBudgetStatus = exactBudgetOverview.categories[0];

assert.equal(exactBudgetStatus.remainingCents, 0);
assert.equal(exactBudgetStatus.utilizationPercent, 100);
const jiti = createJiti(import.meta.url, { jsx: true, alias: { '@': path.resolve('src') } });
const { BudgetDisciplineCard } = jiti('../src/features/finance/components/budget-discipline-card.tsx') as {
  BudgetDisciplineCard: React.ComponentType<{
    budgetOverview: MonthlyBudgetOverview; currency: string; onManageBudgets: () => void;
  }>;
};
// A non-negative category balance must not erase the amount shown as over budget.
const displayOverview = overviewFor(12000);
displayOverview.categories[0].remainingCents = 0;
const html = renderToStaticMarkup(React.createElement(BudgetDisciplineCard, {
  budgetOverview: displayOverview, currency: 'USD', onManageBudgets: () => {},
}));
const text = html.replace(/<[^>]*>/g, '');
assert.ok(text.includes(`+${formatCentsToCurrency(2000, 'USD')} over`), 'Card must retain the actual overage when remaining cents is zero');
assert.ok(!text.includes(`+${formatCentsToCurrency(0, 'USD')} over`), 'Card must not report zero overage after clamping');
console.log('Six remaining-balance boundaries and the rendered category overage passed.');

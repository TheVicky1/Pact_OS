// Feature exports for Finance UX (Phase 4I-2 & Phase 5E)
export * from './actions';
export type {
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  RecurrenceFrequency,
  RecurrenceStatus,
  FinanceRecurringTransaction,
  FinanceBudget,
  CategoryBudgetStatus,
  MonthlyBudgetOverview,
} from '@/lib/money';
export type { FinanceOverviewData } from './data-access';

export { FinanceWorkspace } from './components/finance-workspace';
export { FinanceHeader } from './components/finance-header';
export { FinanceSummaryCards } from './components/finance-summary-cards';
export { SpendingBreakdownCard } from './components/spending-breakdown-card';
export { MonthlyTrendCard } from './components/monthly-trend-card';
export { BudgetDisciplineCard } from './components/budget-discipline-card';
export { RecurringTransactionsCard } from './components/recurring-transactions-card';
export { TransactionList } from './components/transaction-list';
export { TransactionModal } from './components/transaction-modal';
export { CategoryManagerModal } from './components/category-manager-modal';
export { RecurringTransactionModal } from './components/recurring-transaction-modal';
export { BudgetManagerModal } from './components/budget-manager-modal';
export { FinanceSkeleton } from './components/finance-skeleton';

// Feature exports for Finance UX
export * from './actions';
export type {
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
} from '@/lib/money';
export type { FinanceOverviewData } from './data-access';

export { FinanceWorkspace } from './components/finance-workspace';
export { FinanceHeader } from './components/finance-header';
export { FinanceSummaryCards } from './components/finance-summary-cards';
export { SpendingBreakdownCard } from './components/spending-breakdown-card';
export { MonthlyTrendCard } from './components/monthly-trend-card';
export { TransactionList } from './components/transaction-list';
export { TransactionModal } from './components/transaction-modal';
export { CategoryManagerModal } from './components/category-manager-modal';
export { FinanceSkeleton } from './components/finance-skeleton';

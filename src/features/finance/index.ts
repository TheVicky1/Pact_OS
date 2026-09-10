// Client-safe re-exports and feature definitions for Finance UX
export * from './actions';
export type {
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
} from '@/lib/money';
export type { FinanceOverviewData } from './data-access';

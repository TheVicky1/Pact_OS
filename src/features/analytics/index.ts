// Client-safe re-exports and feature definitions for Analytics UX
export * from './actions';
export type {
  AnalyticsTimeRange,
  CompletionMetrics,
  ActivityTrendPoint,
  GoalProgressItem,
  ProjectProgressItem,
  RecordedSessionMetrics,
  AccountabilityAggregates,
  AnalyticsOverviewData,
} from '@/lib/analytics';
export type { DataAccessResult } from './data-access';

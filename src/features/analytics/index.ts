// Feature exports for Analytics UX
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

export { AnalyticsWorkspace } from './components/analytics-workspace';
export type { ProofOfWorkPlatform } from './components/analytics-workspace';
export { AnalyticsHeader } from './components/analytics-header';
export { AnalyticsSummaryCards } from './components/analytics-summary-cards';
export { CommitmentActivityChart } from './components/commitment-activity-chart';
export { GoalProgressCard } from './components/goal-progress-card';
export { ProjectProgressCard } from './components/project-progress-card';
export { AnalyticsSkeleton } from './components/analytics-skeleton';

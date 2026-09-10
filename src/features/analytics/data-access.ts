import { createClient } from '@/lib/supabase/server';
import {
  AnalyticsTimeRange,
  AnalyticsOverviewData,
  getPeriodBoundaries,
  calculateCompletionMetrics,
  calculateCommitmentActivityTrend,
  calculateGoalProgressList,
  calculateProjectProgressList,
  formatDurationHoursMinutes,
  generateFactualObservations,
  RecordedSessionMetrics,
  AccountabilityAggregates,
} from '@/lib/analytics';

export type {
  AnalyticsTimeRange,
  AnalyticsOverviewData,
  RecordedSessionMetrics,
  AccountabilityAggregates,
};

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Server-authoritative query retrieving all necessary metrics for the Analytics workspace.
 * Queries are scoped to the authenticated user via Supabase RLS and server session checks.
 */
export async function getAnalyticsOverview(
  timeRange: AnalyticsTimeRange,
  anchorDateStr: string, // YYYY-MM-DD
  timeZone: string
): Promise<DataAccessResult<AnalyticsOverviewData>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { startDateStr, endDateStr, periodLabel } = getPeriodBoundaries(
      timeRange,
      anchorDateStr,
      timeZone
    );

    // Parallelized fetching of raw domain entities for the user
    const [tasksRes, goalsRes, projectsRes, sessionsRes, commitmentsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, priority, deadline_at, completed_at, goal_id, project_id')
        .eq('user_id', user.id),
      supabase
        .from('goals')
        .select('id, title, status, target_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, title, status, goals(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('accountability_verification_sessions')
        .select('id, status, actual_duration_seconds, started_at, ended_at')
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('task_accountability_commitments')
        .select('id, commitment_status, activated_at')
        .eq('user_id', user.id),
    ]);

    const tasks = tasksRes.data || [];
    const goals = goalsRes.data || [];
    const projects = projectsRes.data || [];
    const sessions = sessionsRes.data || [];
    const commitments = commitmentsRes.data || [];

    // 1. Completion Metrics
    const completionMetrics = calculateCompletionMetrics(tasks, startDateStr, endDateStr, timeZone);

    // 2. Commitment Activity Trends
    const activityTrends = calculateCommitmentActivityTrend(
      tasks,
      timeRange,
      startDateStr,
      endDateStr,
      timeZone
    );

    // 3. Goal Progress List
    const goalsProgress = calculateGoalProgressList(goals, tasks);

    // 4. Project Progress List
    const projectsProgress = calculateProjectProgressList(
      projects as unknown as Array<{ id: string; title: string; status: string; goals?: { title: string } | null }>,
      tasks
    );

    // 5. Recorded Session Metrics in Period
    let totalSecondsInPeriod = 0;
    let sessionCountInPeriod = 0;

    for (const s of sessions) {
      if (s.ended_at && s.actual_duration_seconds) {
        try {
          const sessionEndDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: timeZone || 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(s.ended_at));

          if (sessionEndDate >= startDateStr && sessionEndDate <= endDateStr) {
            totalSecondsInPeriod += s.actual_duration_seconds;
            sessionCountInPeriod += 1;
          }
        } catch {
          // Skip
        }
      }
    }

    const sessionMetrics: RecordedSessionMetrics = {
      totalSeconds: totalSecondsInPeriod,
      formattedDuration: formatDurationHoursMinutes(totalSecondsInPeriod),
      sessionCount: sessionCountInPeriod,
    };

    // 6. Accountability Aggregates (Strict Confidentiality - counts only)
    let totalActivated = 0;
    let totalFulfilled = 0;
    let totalWaived = 0;
    let totalPendingResolution = 0;

    for (const c of commitments) {
      if (c.commitment_status === 'activated') {
        totalActivated += 1;
        totalPendingResolution += 1;
      } else if (c.commitment_status === 'fulfilled') {
        totalActivated += 1;
        totalFulfilled += 1;
      } else if (c.commitment_status === 'waived') {
        totalActivated += 1;
        totalWaived += 1;
      }
    }

    const accountabilityAggregates: AccountabilityAggregates = {
      totalActivated,
      totalFulfilled,
      totalWaived,
      totalPendingResolution,
    };

    // 7. Factual Observations
    const factualObservations = generateFactualObservations({
      completion: completionMetrics,
      sessions: sessionMetrics,
      accountability: accountabilityAggregates,
      periodLabel,
    });

    return {
      data: {
        timeRange,
        anchorDateStr,
        periodLabel,
        startDateStr,
        endDateStr,
        completionMetrics,
        activityTrends,
        goalsProgress,
        projectsProgress,
        sessionMetrics,
        accountabilityAggregates,
        factualObservations,
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      data: null,
      error: msg,
    };
  }
}

/**
 * PACT Phase 4I-3: Pure Analytics & Progress Measurement Layer
 * Pure, deterministic calculations deriving factual metrics from real PACT data.
 * Zero fabricated numbers, zero artificial streaks, strict timezone alignment.
 */

export type AnalyticsTimeRange = 'week' | 'month' | 'quarter';

export interface CompletionMetrics {
  completedCount: number;
  missedCount: number;
  pendingCount: number;
  totalResolved: number;
  completionRate: number | null; // null when 0 resolved tasks
}

export interface ActivityTrendPoint {
  key: string; // e.g. "2026-09-18" or "W38 2026"
  label: string; // e.g. "Fri" or "Sep 14 - 20"
  completedCount: number;
  missedCount: number;
  totalCount: number;
}

export interface GoalProgressItem {
  id: string;
  title: string;
  status: string;
  targetDate: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

export interface ProjectProgressItem {
  id: string;
  title: string;
  status: string;
  goalTitle: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

export interface RecordedSessionMetrics {
  totalSeconds: number;
  formattedDuration: string;
  sessionCount: number;
}

export interface AccountabilityAggregates {
  totalActivated: number;
  totalFulfilled: number;
  totalWaived: number;
  totalPendingResolution: number;
}

export interface AnalyticsOverviewData {
  timeRange: AnalyticsTimeRange;
  anchorDateStr: string; // YYYY-MM-DD
  periodLabel: string; // e.g. "Sep 14 – 20, 2026" or "September 2026"
  startDateStr: string;
  endDateStr: string;
  completionMetrics: CompletionMetrics;
  activityTrends: ActivityTrendPoint[];
  goalsProgress: GoalProgressItem[];
  projectsProgress: ProjectProgressItem[];
  sessionMetrics: RecordedSessionMetrics;
  accountabilityAggregates: AccountabilityAggregates;
  factualObservations: string[];
}

/**
 * Computes exact start and end local date strings (YYYY-MM-DD) and human period label for a given range.
 */
export function getPeriodBoundaries(
  timeRange: AnalyticsTimeRange,
  anchorDateStr: string, // YYYY-MM-DD
  timeZone: string
): {
  startDateStr: string;
  endDateStr: string;
  periodLabel: string;
} {
  const [year, month, day] = anchorDateStr.split('-').map(Number);
  const anchorDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (timeRange === 'week') {
    // ISO week: Monday to Sunday
    const dayOfWeek = (anchorDate.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
    const monday = new Date(anchorDate);
    monday.setUTCDate(anchorDate.getUTCDate() - dayOfWeek);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const fmtDate = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    const startDateStr = fmtDate(monday);
    const endDateStr = fmtDate(sunday);

    const startMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(monday);
    const endMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(sunday);

    const periodLabel =
      startMonth === endMonth
        ? `${startMonth} ${monday.getUTCDate()} – ${sunday.getUTCDate()}, ${monday.getUTCFullYear()}`
        : `${startMonth} ${monday.getUTCDate()} – ${endMonth} ${sunday.getUTCDate()}, ${monday.getUTCFullYear()}`;

    return { startDateStr, endDateStr, periodLabel };
  }

  if (timeRange === 'month') {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

    const periodLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(anchorDate);

    return { startDateStr: firstDay, endDateStr: lastDay, periodLabel };
  }

  // Quarter
  const qNumber = Math.floor((month - 1) / 3) + 1;
  const qStartMonth = (qNumber - 1) * 3 + 1;
  const qEndMonth = qStartMonth + 2;
  const qEndTotalDays = new Date(Date.UTC(year, qEndMonth, 0)).getUTCDate();

  const startDateStr = `${year}-${String(qStartMonth).padStart(2, '0')}-01`;
  const endDateStr = `${year}-${String(qEndMonth).padStart(2, '0')}-${String(qEndTotalDays).padStart(2, '0')}`;
  const periodLabel = `Q${qNumber} ${year}`;

  return { startDateStr, endDateStr, periodLabel };
}

/**
 * Calculates authoritative completion metrics from real task records.
 */
export function calculateCompletionMetrics(
  tasks: Array<{
    status: string;
    deadline_at: string;
    completed_at?: string | null;
  }>,
  startDateStr: string,
  endDateStr: string,
  timeZone: string
): CompletionMetrics {
  let completedCount = 0;
  let missedCount = 0;
  let pendingCount = 0;

  for (const t of tasks) {
    // Extract local date string YYYY-MM-DD from deadline
    try {
      const deadlineDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(t.deadline_at));

      if (deadlineDateStr >= startDateStr && deadlineDateStr <= endDateStr) {
        if (t.status === 'completed') {
          completedCount += 1;
        } else if (t.status === 'missed') {
          missedCount += 1;
        } else if (t.status === 'pending') {
          pendingCount += 1;
        }
      }
    } catch {
      // Skip invalid dates gracefully
    }
  }

  const totalResolved = completedCount + missedCount;
  const completionRate = totalResolved > 0 ? Math.round((completedCount / totalResolved) * 100) : null;

  return {
    completedCount,
    missedCount,
    pendingCount,
    totalResolved,
    completionRate,
  };
}

/**
 * Calculates commitment activity trends across time intervals.
 */
export function calculateCommitmentActivityTrend(
  tasks: Array<{
    status: string;
    deadline_at: string;
  }>,
  timeRange: AnalyticsTimeRange,
  startDateStr: string,
  endDateStr: string,
  timeZone: string
): ActivityTrendPoint[] {
  if (timeRange === 'week') {
    // 7 distinct days Monday -> Sunday
    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const days: ActivityTrendPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(sYear, sMonth - 1, sDay + i, 12, 0, 0));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(d);

      days.push({
        key,
        label,
        completedCount: 0,
        missedCount: 0,
        totalCount: 0,
      });
    }

    const dayMap = new Map<string, ActivityTrendPoint>();
    for (const point of days) {
      dayMap.set(point.key, point);
    }

    for (const t of tasks) {
      try {
        const localDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: timeZone || 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(t.deadline_at));

        const point = dayMap.get(localDateStr);
        if (point) {
          if (t.status === 'completed') {
            point.completedCount += 1;
            point.totalCount += 1;
          } else if (t.status === 'missed') {
            point.missedCount += 1;
            point.totalCount += 1;
          }
        }
      } catch {
        // Skip
      }
    }

    return days;
  }

  // Month or Quarter: aggregate into weeks or months
  // For month: 4 or 5 week buckets
  // For quarter: 3 month buckets
  if (timeRange === 'quarter') {
    const [sYear, sMonth] = startDateStr.split('-').map(Number);
    const months: ActivityTrendPoint[] = [];

    for (let i = 0; i < 3; i++) {
      const mNum = sMonth + i;
      const d = new Date(Date.UTC(sYear, mNum - 1, 15));
      const key = `${sYear}-${String(mNum).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(d);

      months.push({
        key,
        label,
        completedCount: 0,
        missedCount: 0,
        totalCount: 0,
      });
    }

    const monthMap = new Map<string, ActivityTrendPoint>();
    for (const m of months) {
      monthMap.set(m.key, m);
    }

    for (const t of tasks) {
      try {
        const localMonthKey = new Intl.DateTimeFormat('en-CA', {
          timeZone: timeZone || 'UTC',
          year: 'numeric',
          month: '2-digit',
        }).format(new Date(t.deadline_at)); // YYYY-MM

        const point = monthMap.get(localMonthKey);
        if (point) {
          if (t.status === 'completed') {
            point.completedCount += 1;
            point.totalCount += 1;
          } else if (t.status === 'missed') {
            point.missedCount += 1;
            point.totalCount += 1;
          }
        }
      } catch {
        // Skip
      }
    }

    return months;
  }

  // Month: 4 week buckets
  const weeks: ActivityTrendPoint[] = [
    { key: 'w1', label: 'Week 1', completedCount: 0, missedCount: 0, totalCount: 0 },
    { key: 'w2', label: 'Week 2', completedCount: 0, missedCount: 0, totalCount: 0 },
    { key: 'w3', label: 'Week 3', completedCount: 0, missedCount: 0, totalCount: 0 },
    { key: 'w4', label: 'Week 4', completedCount: 0, missedCount: 0, totalCount: 0 },
  ];

  for (const t of tasks) {
    try {
      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(t.deadline_at));

      if (localDateStr >= startDateStr && localDateStr <= endDateStr) {
        const dayOfMonth = parseInt(localDateStr.split('-')[2], 10);
        const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
        if (t.status === 'completed') {
          weeks[weekIndex].completedCount += 1;
          weeks[weekIndex].totalCount += 1;
        } else if (t.status === 'missed') {
          weeks[weekIndex].missedCount += 1;
          weeks[weekIndex].totalCount += 1;
        }
      }
    } catch {
      // Skip
    }
  }

  return weeks;
}

/**
 * Derives goal completion progress from linked tasks.
 */
export function calculateGoalProgressList(
  goals: Array<{ id: string; title: string; status: string; target_date: string | null }>,
  tasks: Array<{ goal_id?: string | null; status: string }>
): GoalProgressItem[] {
  const goalMap = new Map<string, { total: number; completed: number }>();

  for (const g of goals) {
    goalMap.set(g.id, { total: 0, completed: 0 });
  }

  for (const t of tasks) {
    if (t.goal_id && goalMap.has(t.goal_id)) {
      const entry = goalMap.get(t.goal_id)!;
      entry.total += 1;
      if (t.status === 'completed') {
        entry.completed += 1;
      }
    }
  }

  return goals
    .filter((g) => g.status === 'active')
    .map((g) => {
      const counts = goalMap.get(g.id) || { total: 0, completed: 0 };
      const progressPercent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

      return {
        id: g.id,
        title: g.title,
        status: g.status,
        targetDate: g.target_date,
        totalTasks: counts.total,
        completedTasks: counts.completed,
        progressPercent,
      };
    });
}

/**
 * Derives project completion progress from linked tasks.
 */
export function calculateProjectProgressList(
  projects: Array<{ id: string; title: string; status: string; goals?: { title: string } | null }>,
  tasks: Array<{ project_id?: string | null; status: string }>
): ProjectProgressItem[] {
  const projMap = new Map<string, { total: number; completed: number }>();

  for (const p of projects) {
    projMap.set(p.id, { total: 0, completed: 0 });
  }

  for (const t of tasks) {
    if (t.project_id && projMap.has(t.project_id)) {
      const entry = projMap.get(t.project_id)!;
      entry.total += 1;
      if (t.status === 'completed') {
        entry.completed += 1;
      }
    }
  }

  return projects
    .filter((p) => p.status === 'active')
    .map((p) => {
      const counts = projMap.get(p.id) || { total: 0, completed: 0 };
      const progressPercent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        goalTitle: p.goals?.title || null,
        totalTasks: counts.total,
        completedTasks: counts.completed,
        progressPercent,
      };
    });
}

/**
 * Formats seconds into human-readable hours and minutes (e.g. "4h 30m" or "45m").
 */
export function formatDurationHoursMinutes(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return '0m';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Deterministically generates factual observations from real PACT activity numbers.
 * Strictly no fake AI, no personality scoring, no gamification badges.
 */
export function generateFactualObservations(metrics: {
  completion: CompletionMetrics;
  sessions: RecordedSessionMetrics;
  accountability: AccountabilityAggregates;
  periodLabel: string;
}): string[] {
  const observations: string[] = [];

  const { completion, sessions, accountability, periodLabel } = metrics;

  if (completion.totalResolved === 0 && sessions.sessionCount === 0 && accountability.totalActivated === 0) {
    return [
      `No commitment or session activity recorded for ${periodLabel}.`,
      'Complete tasks and resolve commitments to populate your analytical trends.',
    ];
  }

  if (completion.totalResolved > 0) {
    observations.push(
      `${completion.completedCount} of ${completion.totalResolved} resolved commitments were completed (${completion.completionRate}% completion rate).`
    );
  }

  if (completion.missedCount > 0) {
    observations.push(
      `${completion.missedCount} commitment${completion.missedCount === 1 ? '' : 's'} missed during ${periodLabel}.`
    );
  } else if (completion.completedCount > 0) {
    observations.push('Zero missed commitments during this period.');
  }

  if (sessions.totalSeconds > 0) {
    observations.push(
      `Recorded ${sessions.formattedDuration} of verified session time across ${sessions.sessionCount} session${sessions.sessionCount === 1 ? '' : 's'}.`
    );
  }

  if (accountability.totalFulfilled > 0 || accountability.totalWaived > 0) {
    observations.push(
      `Accountability resolutions: ${accountability.totalFulfilled} fulfilled, ${accountability.totalWaived} waived.`
    );
  }

  return observations;
}

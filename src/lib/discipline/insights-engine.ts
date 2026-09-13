/**
 * PACT Phase 14: Autonomous Discipline Intelligence & Anti-Burnout Engine
 * Pure, deterministic heuristics engine analyzing workload density, schedule pressure,
 * habit fatigue, and focus duration patterns.
 * 
 * Invariants:
 * 1. 100% Deterministic & Explainable: Zero external third-party LLM dependencies sending private data.
 * 2. Conservative & Advisory: Never modifies commitments, triggers penalties, or alters consequences automatically.
 * 3. Strict Consequence Confidentiality: Never exposes hidden consequences or punishment statements.
 * 4. Grounded Language: Employs operational strain metrics, avoiding medical/diagnostic claims.
 */

export type DisciplineInsightCategory =
  | 'WORKLOAD_OVERLOAD'
  | 'HABIT_FATIGUE'
  | 'FOCUS_OVEREXTENSION'
  | 'RECOVERY_IMBALANCE'
  | 'VELOCITY_DECLINE'
  | 'SCHEDULE_DENSITY';

export type DisciplineInsightSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DisciplineMetricsInput {
  userId: string;
  activeTaskCount: number;
  overdueTaskCount: number;
  completedTasksThisWeek: number;
  completedTasksLastWeek: number;
  consecutiveFocusMinutesToday: number;
  totalFocusHoursThisWeek: number;
  habitCompletionRate: number; // 0.0 to 1.0
  missedHabitCountThisWeek: number;
  activeCommitmentsCount: number;
  breachedCommitmentsCount: number;
  dailyPlannedHours: number;
  dailyCapacityHours?: number; // default 8
}

export interface DisciplineInsight {
  id: string; // Deterministic identifier (e.g., insight_overload_20260914)
  userId: string;
  category: DisciplineInsightCategory;
  severity: DisciplineInsightSeverity;
  confidence: number; // 0.0 to 1.0
  title: string;
  explanation: string;
  recommendedAction: string;
  metricsEvidence: Record<string, number | string | boolean>;
  createdAt: string; // ISO 8601
}

/**
 * Pure evaluation function: Generates structured, deterministic discipline insights.
 */
export function evaluateDisciplineInsights(
  input: DisciplineMetricsInput,
  anchorDate: string = new Date().toISOString().split('T')[0]
): DisciplineInsight[] {
  const insights: DisciplineInsight[] = [];
  const capacity = input.dailyCapacityHours || 8;

  // 1. Workload Overload Detection
  if (input.dailyPlannedHours > capacity * 1.3 || input.overdueTaskCount >= 5) {
    const isCritical = input.dailyPlannedHours > capacity * 1.6 || input.overdueTaskCount >= 8;
    insights.push({
      id: `insight_workload_${anchorDate}`,
      userId: input.userId,
      category: 'WORKLOAD_OVERLOAD',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      confidence: 0.92,
      title: 'Elevated Workload & Deadline Density',
      explanation: `Your planned workload of ${input.dailyPlannedHours.toFixed(1)} hours exceeds standard capacity (${capacity}h), with ${input.overdueTaskCount} overdue tasks accumulating.`,
      recommendedAction: 'Reschedule 2–3 non-critical tasks to the backlog and protect your top priority commitment.',
      metricsEvidence: {
        dailyPlannedHours: input.dailyPlannedHours,
        dailyCapacityHours: capacity,
        overdueTaskCount: input.overdueTaskCount,
      },
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Focus Overextension & Recovery Imbalance
  if (input.consecutiveFocusMinutesToday >= 180) {
    insights.push({
      id: `insight_focus_overextension_${anchorDate}`,
      userId: input.userId,
      category: 'FOCUS_OVEREXTENSION',
      severity: input.consecutiveFocusMinutesToday >= 240 ? 'HIGH' : 'MEDIUM',
      confidence: 0.88,
      title: 'Extended Continuous Deep Work Block',
      explanation: `You have logged ${Math.round(input.consecutiveFocusMinutesToday / 60)} continuous hours of deep work today without a structured decompression period.`,
      recommendedAction: 'Insert a 15–30 minute physical recovery or screen-free interval before starting your next session.',
      metricsEvidence: {
        consecutiveFocusMinutes: input.consecutiveFocusMinutesToday,
      },
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Habit Fatigue & Routine Decay
  if (input.habitCompletionRate < 0.5 && input.missedHabitCountThisWeek >= 3) {
    insights.push({
      id: `insight_habit_fatigue_${anchorDate}`,
      userId: input.userId,
      category: 'HABIT_FATIGUE',
      severity: 'MEDIUM',
      confidence: 0.85,
      title: 'Habit Consistency Deceleration',
      explanation: `Your habit adherence is currently at ${Math.round(input.habitCompletionRate * 100)}% with ${input.missedHabitCountThisWeek} missed daily check-ins this week.`,
      recommendedAction: 'Temporarily reduce habit loop frequency or scale down habit friction to rebuild streak momentum.',
      metricsEvidence: {
        habitCompletionRate: input.habitCompletionRate,
        missedHabitCount: input.missedHabitCountThisWeek,
      },
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Velocity Decline & Capacity Imbalance
  if (
    input.completedTasksLastWeek > 5 &&
    input.completedTasksThisWeek < input.completedTasksLastWeek * 0.4 &&
    input.activeTaskCount > 10
  ) {
    insights.push({
      id: `insight_velocity_decline_${anchorDate}`,
      userId: input.userId,
      category: 'VELOCITY_DECLINE',
      severity: 'LOW',
      confidence: 0.78,
      title: 'Execution Velocity Compression',
      explanation: `Task completion velocity has decreased from ${input.completedTasksLastWeek} tasks last week to ${input.completedTasksThisWeek} this week while total backlog remains elevated (${input.activeTaskCount} tasks).`,
      recommendedAction: 'Conduct a brief 10-minute task triage to unblock stagnant items or drop low-leverage tasks.',
      metricsEvidence: {
        completedThisWeek: input.completedTasksThisWeek,
        completedLastWeek: input.completedTasksLastWeek,
        activeTasks: input.activeTaskCount,
      },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Filters out dismissed or snoozed insights based on active user state.
 */
export function filterActiveDisciplineInsights(
  insights: DisciplineInsight[],
  dismissedIds: Set<string>
): DisciplineInsight[] {
  return insights.filter((i) => !dismissedIds.has(i.id));
}

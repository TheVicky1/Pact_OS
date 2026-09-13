'use server';

import { createClient } from '@/lib/supabase/server';
import {
  evaluateDisciplineInsights,
  DisciplineInsight,
  DisciplineMetricsInput,
} from '@/lib/discipline/insights-engine';
import { logger } from '@/lib/observability/logger';

export interface GetDisciplineInsightsResult {
  success: boolean;
  insights: DisciplineInsight[];
  error?: string;
}

/**
 * Server action to evaluate and retrieve autonomous discipline insights for the active authenticated user.
 */
export async function getDisciplineInsightsAction(): Promise<GetDisciplineInsightsResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, insights: [], error: 'Unauthorized' };
    }

    // Aggregate user metrics for heuristic evaluation
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [tasksRes, habitsRes, focusRes, commitmentsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, status, due_date, completed_at')
        .eq('user_id', user.id),
      supabase
        .from('habit_logs')
        .select('id, completed, date')
        .eq('user_id', user.id)
        .gte('date', weekAgo.split('T')[0]),
      supabase
        .from('focus_sessions')
        .select('id, duration_minutes, created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo),
      supabase
        .from('commitments')
        .select('id, status')
        .eq('user_id', user.id),
    ]);

    const tasks = tasksRes.data || [];
    const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const overdueTasks = activeTasks.filter(
      (t) => t.due_date && new Date(t.due_date).getTime() < now.getTime()
    );

    const completedThisWeek = tasks.filter(
      (t) => t.completed_at && t.completed_at >= weekAgo
    ).length;

    const completedLastWeek = tasks.filter(
      (t) => t.completed_at && t.completed_at >= twoWeeksAgo && t.completed_at < weekAgo
    ).length;

    const habits = habitsRes.data || [];
    const completedHabits = habits.filter((h) => h.completed).length;
    const habitCompletionRate = habits.length > 0 ? completedHabits / habits.length : 0.8;
    const missedHabits = habits.length - completedHabits;

    const focusSessions = focusRes.data || [];
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    const commitments = commitmentsRes.data || [];
    const activeCommitments = commitments.filter((c) => c.status === 'ACTIVE').length;
    const breachedCommitments = commitments.filter((c) => c.status === 'BREACHED').length;

    const metricsInput: DisciplineMetricsInput = {
      userId: user.id,
      activeTaskCount: activeTasks.length,
      overdueTaskCount: overdueTasks.length,
      completedTasksThisWeek: completedThisWeek,
      completedTasksLastWeek: completedLastWeek,
      consecutiveFocusMinutesToday: 0, // Calculated dynamically in sessions if active
      totalFocusHoursThisWeek: totalFocusMinutes / 60,
      habitCompletionRate,
      missedHabitCountThisWeek: missedHabits,
      activeCommitmentsCount: activeCommitments,
      breachedCommitmentsCount: breachedCommitments,
      dailyPlannedHours: (activeTasks.length * 0.75), // Estimated average duration
      dailyCapacityHours: 8,
    };

    const insights = evaluateDisciplineInsights(metricsInput);
    return { success: true, insights };
  } catch (err: unknown) {
    logger.error('Failed to compute discipline insights', err instanceof Error ? err : new Error(String(err)));
    return { success: false, insights: [], error: 'Failed to compute discipline insights' };
  }
}

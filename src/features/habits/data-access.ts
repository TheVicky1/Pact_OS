/**
 * PACT Phase 6C: Habit & Routine Data Access Layer
 * Authenticated, tenant-isolated data loaders with automatic idempotent
 * occurrence generation and deterministic streak calculations.
 */

import { createClient } from '@/lib/supabase/server';
import {
  HabitTemplate,
  HabitOccurrence,
  RoutineTemplate,
  RoutineTemplateItem,
  DailyHabitItem,
  RoutineProgressSummary,
} from '@/lib/habits/types';
import { isHabitScheduledOnDate } from '@/lib/habits/recurrence';
import { calculateHabitStreak, calculateOverallHabitMetrics } from '@/lib/habits/streaks';
import { getLocalDateString, addDaysToDateString } from '@/lib/time';

export interface HabitsBootstrapData {
  habits: DailyHabitItem[];
  archivedHabits: HabitTemplate[];
  routines: RoutineProgressSummary[];
  overallMetrics: ReturnType<typeof calculateOverallHabitMetrics>;
  availableTasks: Array<{ id: string; title: string; priority: string; status: string }>;
  currentDateStr: string;
  userTimezone: string;
}

/**
 * Loads all habit templates, history occurrences, routine templates, and task context
 * for the authenticated user, automatically reconciling today's occurrences.
 */
export async function getHabitsBootstrapData(
  overrideDateStr?: string
): Promise<HabitsBootstrapData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 1. Fetch user profile for timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single();

  const userTimezone = profile?.timezone || 'UTC';
  const currentDateStr = overrideDateStr || getLocalDateString(new Date(), userTimezone);
  const lookbackStartStr = addDaysToDateString(currentDateStr, -90);

  // 2. Fetch all habit templates
  const { data: templatesRaw, error: templatesError } = await supabase
    .from('habit_templates')
    .select(`
      *,
      tasks:linked_task_id (
        id,
        title,
        status,
        priority
      )
    `)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (templatesError || !templatesRaw) {
    return null;
  }

  const allTemplates = templatesRaw as unknown as HabitTemplate[];
  const activeAndPausedTemplates = allTemplates.filter((t) => t.status !== 'archived');
  const archivedHabits = allTemplates.filter((t) => t.status === 'archived');

  // 3. Fetch occurrences in the 90-day window
  const { data: occurrencesRaw } = await supabase
    .from('habit_occurrences')
    .select('*')
    .eq('user_id', user.id)
    .gte('scheduled_date', lookbackStartStr)
    .lte('scheduled_date', currentDateStr);

  const occurrences = (occurrencesRaw || []) as unknown as HabitOccurrence[];

  // 4. Idempotently generate today's occurrence rows for active scheduled habits if missing
  const todayOccurrencesMap = new Map<string, HabitOccurrence>();
  for (const occ of occurrences) {
    if (occ.scheduled_date === currentDateStr) {
      todayOccurrencesMap.set(occ.habit_template_id, occ);
    }
  }

  const missingTodayInserts: Array<{
    user_id: string;
    habit_template_id: string;
    scheduled_date: string;
    status: string;
  }> = [];

  for (const template of activeAndPausedTemplates) {
    if (
      template.status === 'active' &&
      isHabitScheduledOnDate(template, currentDateStr) &&
      !todayOccurrencesMap.has(template.id)
    ) {
      missingTodayInserts.push({
        user_id: user.id,
        habit_template_id: template.id,
        scheduled_date: currentDateStr,
        status: 'pending',
      });
    }
  }

  if (missingTodayInserts.length > 0) {
    const { data: insertedOccurrences } = await supabase
      .from('habit_occurrences')
      .upsert(missingTodayInserts, { onConflict: 'user_id,habit_template_id,scheduled_date' })
      .select('*');

    if (insertedOccurrences) {
      for (const ins of insertedOccurrences as unknown as HabitOccurrence[]) {
        occurrences.push(ins);
        todayOccurrencesMap.set(ins.habit_template_id, ins);
      }
    }
  }

  // 5. Compute streak summaries for each habit
  const dailyHabits: DailyHabitItem[] = activeAndPausedTemplates.map((template) => {
    const habitOccurrences = occurrences.filter((o) => o.habit_template_id === template.id);
    const streak = calculateHabitStreak(template, habitOccurrences, currentDateStr);
    const todayOcc = todayOccurrencesMap.get(template.id) || null;

    return {
      template,
      occurrence: todayOcc,
      streak,
    };
  });

  // 6. Fetch routine templates and items
  const { data: routinesRaw } = await supabase
    .from('routine_templates')
    .select(`
      *,
      items:routine_template_items (
        id,
        user_id,
        routine_template_id,
        habit_template_id,
        sort_order,
        created_at,
        habit_templates:habit_template_id (*)
      )
    `)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const routineTemplates = (routinesRaw || []) as unknown as RoutineTemplate[];

  const routinesProgress: RoutineProgressSummary[] = routineTemplates.map((routine) => {
    const items = (routine.items || []) as RoutineTemplateItem[];
    // Sort items by sort_order
    items.sort((a, b) => a.sort_order - b.sort_order);

    const itemsSummary = items
      .map((item) => {
        const template = allTemplates.find((t) => t.id === item.habit_template_id);
        if (!template) return null;
        const occ = todayOccurrencesMap.get(template.id) || null;
        return {
          habit: template,
          occurrence: occ,
          isCompleted: occ?.status === 'completed',
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const totalHabits = itemsSummary.length;
    const completedHabits = itemsSummary.filter((i) => i.isCompleted).length;
    const progressPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    return {
      routine,
      totalHabits,
      completedHabits,
      progressPercentage,
      items: itemsSummary,
    };
  });

  // 7. Overall metrics
  const overallMetrics = calculateOverallHabitMetrics(dailyHabits);

  // 8. Fetch available tasks for attachment dropdown
  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select('id, title, priority, status')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(50);

  const availableTasks = (tasksRaw || []) as Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
  }>;

  return {
    habits: dailyHabits,
    archivedHabits,
    routines: routinesProgress,
    overallMetrics,
    availableTasks,
    currentDateStr,
    userTimezone,
  };
}

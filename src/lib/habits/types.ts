/**
 * PACT Phase 6C: Recurring Habits & Daily Routine Domain Types
 * Strongly typed contracts for habit templates, occurrences, routines, and streaks.
 */

export type HabitCategory =
  | 'general'
  | 'health'
  | 'learning'
  | 'productivity'
  | 'mindset'
  | 'fitness'
  | 'finance';

export type HabitFrequency =
  | 'daily'
  | 'weekdays'
  | 'selected_days'
  | 'weekly'
  | 'custom_interval';

export type HabitStatus = 'active' | 'paused' | 'archived';

export type OccurrenceStatus = 'pending' | 'completed' | 'skipped' | 'missed';

export interface HabitTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  frequency_type: HabitFrequency;
  selected_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  interval_days: number;
  target_time_local: string | null; // HH:MM
  target_duration_minutes: number | null;
  linked_task_id: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  status: HabitStatus;
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  } | null;
}

export interface HabitOccurrence {
  id: string;
  user_id: string;
  habit_template_id: string;
  scheduled_date: string; // YYYY-MM-DD
  status: OccurrenceStatus;
  completed_at: string | null;
  notes: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  habit_templates?: HabitTemplate | null;
}

export interface RoutineTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_time_local: string | null; // HH:MM
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items?: RoutineTemplateItem[];
}

export interface RoutineTemplateItem {
  id: string;
  user_id: string;
  routine_template_id: string;
  habit_template_id: string;
  sort_order: number;
  created_at: string;
  habit_templates?: HabitTemplate | null;
}

export interface HabitStreakSummary {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  totalScheduled: number;
  completionRate: number; // 0..100
  isCompletedToday: boolean;
  isScheduledToday: boolean;
  historyMap: Record<string, OccurrenceStatus>;
}

export interface DailyHabitItem {
  template: HabitTemplate;
  occurrence: HabitOccurrence | null;
  streak: HabitStreakSummary;
}

export interface RoutineProgressSummary {
  routine: RoutineTemplate;
  totalHabits: number;
  completedHabits: number;
  progressPercentage: number;
  items: Array<{
    habit: HabitTemplate;
    occurrence: HabitOccurrence | null;
    isCompleted: boolean;
  }>;
}

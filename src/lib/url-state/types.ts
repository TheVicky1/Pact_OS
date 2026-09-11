/**
 * PACT OS — Phase 6E: Deep-Link URL State Types
 * Canonical type definitions for persistent, shareable, and validated search parameter states.
 */

import { TaskPriority, TaskStatus, GoalStatus, ProjectStatus } from '@/types/domain';
import { TransactionType } from '@/lib/money';

// ============================================================================
// Tasks URL State
// ============================================================================
export type TaskSortField = 'deadline' | 'priority' | 'created' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface TasksUrlState {
  tab: 'all' | TaskStatus;
  priority: 'all' | TaskPriority;
  q: string;
  sort: TaskSortField;
  dir: SortDirection;
  goal?: string; // Goal UUID filter
  project?: string; // Project UUID filter
}

export const DEFAULT_TASKS_URL_STATE: TasksUrlState = {
  tab: 'all',
  priority: 'all',
  q: '',
  sort: 'deadline',
  dir: 'asc',
};

// ============================================================================
// Finance URL State
// ============================================================================
export interface FinanceUrlState {
  tab: 'all' | TransactionType;
  category: string; // 'all' | 'uncategorized' | categoryId
  q: string;
  month?: string; // YYYY-MM
}

export const DEFAULT_FINANCE_URL_STATE: FinanceUrlState = {
  tab: 'all',
  category: 'all',
  q: '',
};

// ============================================================================
// Goals URL State
// ============================================================================
export type GoalFilter = GoalStatus | 'all';
export type GoalSortField = 'target_date' | 'title' | 'created';

export interface GoalsUrlState {
  status: GoalFilter;
  q: string;
  sort: GoalSortField;
}

export const DEFAULT_GOALS_URL_STATE: GoalsUrlState = {
  status: 'active',
  q: '',
  sort: 'target_date',
};

// ============================================================================
// Projects URL State
// ============================================================================
export type ProjectFilter = ProjectStatus | 'all';
export type ProjectSortField = 'deadline' | 'title' | 'created';

export interface ProjectsUrlState {
  status: ProjectFilter;
  goal: string; // 'all' | 'independent' | goalId
  q: string;
  sort: ProjectSortField;
}

export const DEFAULT_PROJECTS_URL_STATE: ProjectsUrlState = {
  status: 'active',
  goal: 'all',
  q: '',
  sort: 'created',
};

// ============================================================================
// Habits URL State
// ============================================================================
export type HabitsTabMode = 'today' | 'all' | 'routines' | 'archived';

export interface HabitsUrlState {
  tab: HabitsTabMode;
  category: string; // 'all' | HabitCategory
}

export const DEFAULT_HABITS_URL_STATE: HabitsUrlState = {
  tab: 'today',
  category: 'all',
};

// ============================================================================
// Accountability URL State
// ============================================================================
export type AccountabilityFilterTab = 'all' | 'fulfilled' | 'waived' | 'activated';

export interface AccountabilityUrlState {
  filter: AccountabilityFilterTab;
  event?: string; // Expanded event UUID
}

export const DEFAULT_ACCOUNTABILITY_URL_STATE: AccountabilityUrlState = {
  filter: 'all',
};

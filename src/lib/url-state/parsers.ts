/**
 * PACT OS — Phase 6E: Deep-Link URL State Parsers & Serializers
 * Pure deterministic functions to parse URLSearchParams into validated domain state
 * and serialize domain state back into canonical URL query strings.
 */

import {
  type TasksUrlState,
  DEFAULT_TASKS_URL_STATE,
  type FinanceUrlState,
  DEFAULT_FINANCE_URL_STATE,
  type GoalsUrlState,
  DEFAULT_GOALS_URL_STATE,
  type ProjectsUrlState,
  DEFAULT_PROJECTS_URL_STATE,
  type HabitsUrlState,
  DEFAULT_HABITS_URL_STATE,
  type AccountabilityUrlState,
  DEFAULT_ACCOUNTABILITY_URL_STATE,
  type TaskSortField,
  type SortDirection,
  type GoalFilter,
  type GoalSortField,
  type ProjectFilter,
  type ProjectSortField,
  type HabitsTabMode,
  type AccountabilityFilterTab,
} from './types';

// ============================================================================
// Tasks URL State
// ============================================================================
const VALID_TASK_TABS = new Set<string>([
  'all',
  'pending',
  'in_progress',
  'completed',
  'missed',
  'archived',
]);

const VALID_TASK_PRIORITIES = new Set<string>(['all', 'low', 'medium', 'high', 'urgent']);
const VALID_TASK_SORTS = new Set<string>(['deadline', 'priority', 'created', 'title']);
const VALID_SORT_DIRS = new Set<string>(['asc', 'desc']);

export function parseTasksUrlState(params: URLSearchParams | Readonly<URLSearchParams> | Record<string, string | undefined>): TasksUrlState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    if ('get' in params && typeof params.get === 'function') return params.get(key);
    return (params as Record<string, string | undefined>)[key] ?? null;
  };

  const rawTab = (get('tab') || get('status') || '').toLowerCase();
  const tab = VALID_TASK_TABS.has(rawTab) ? (rawTab as TasksUrlState['tab']) : DEFAULT_TASKS_URL_STATE.tab;

  const rawPriority = (get('priority') || '').toLowerCase();
  const priority = VALID_TASK_PRIORITIES.has(rawPriority)
    ? (rawPriority as TasksUrlState['priority'])
    : DEFAULT_TASKS_URL_STATE.priority;

  const q = (get('q') || get('search') || '').trim();

  const rawSort = (get('sort') || '').toLowerCase();
  const sort = VALID_TASK_SORTS.has(rawSort)
    ? (rawSort as TaskSortField)
    : DEFAULT_TASKS_URL_STATE.sort;

  const rawDir = (get('dir') || '').toLowerCase();
  const dir = VALID_SORT_DIRS.has(rawDir)
    ? (rawDir as SortDirection)
    : DEFAULT_TASKS_URL_STATE.dir;

  const rawGoal = get('goal') || undefined;
  const rawProject = get('project') || undefined;

  return {
    tab,
    priority,
    q,
    sort,
    dir,
    goal: rawGoal?.trim() || undefined,
    project: rawProject?.trim() || undefined,
  };
}

export function serializeTasksUrlState(state: Partial<TasksUrlState>): string {
  const params = new URLSearchParams();

  if (state.tab && state.tab !== DEFAULT_TASKS_URL_STATE.tab) {
    params.set('tab', state.tab);
  }
  if (state.priority && state.priority !== DEFAULT_TASKS_URL_STATE.priority) {
    params.set('priority', state.priority);
  }
  if (state.q && state.q.trim()) {
    params.set('q', state.q.trim());
  }
  if (state.sort && state.sort !== DEFAULT_TASKS_URL_STATE.sort) {
    params.set('sort', state.sort);
  }
  if (state.dir && state.dir !== DEFAULT_TASKS_URL_STATE.dir) {
    params.set('dir', state.dir);
  }
  if (state.goal && state.goal.trim()) {
    params.set('goal', state.goal.trim());
  }
  if (state.project && state.project.trim()) {
    params.set('project', state.project.trim());
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// Finance URL State
// ============================================================================
const VALID_FINANCE_TABS = new Set<string>(['all', 'expense', 'income']);

export function parseFinanceUrlState(params: URLSearchParams | Readonly<URLSearchParams> | Record<string, string | undefined>): FinanceUrlState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    if ('get' in params && typeof params.get === 'function') return params.get(key);
    return (params as Record<string, string | undefined>)[key] ?? null;
  };

  const rawTab = (get('tab') || get('type') || '').toLowerCase();
  const tab = VALID_FINANCE_TABS.has(rawTab)
    ? (rawTab as FinanceUrlState['tab'])
    : DEFAULT_FINANCE_URL_STATE.tab;

  const rawCat = get('category') || get('cat') || '';
  const category = rawCat.trim() ? rawCat.trim() : DEFAULT_FINANCE_URL_STATE.category;

  const q = (get('q') || get('search') || '').trim();

  const rawMonth = get('month') || undefined;
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const month = rawMonth && monthRegex.test(rawMonth) ? rawMonth : undefined;

  return {
    tab,
    category,
    q,
    month,
  };
}

export function serializeFinanceUrlState(state: Partial<FinanceUrlState>): string {
  const params = new URLSearchParams();

  if (state.tab && state.tab !== DEFAULT_FINANCE_URL_STATE.tab) {
    params.set('tab', state.tab);
  }
  if (state.category && state.category !== DEFAULT_FINANCE_URL_STATE.category) {
    params.set('category', state.category);
  }
  if (state.q && state.q.trim()) {
    params.set('q', state.q.trim());
  }
  if (state.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(state.month)) {
    params.set('month', state.month);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// Goals URL State
// ============================================================================
const VALID_GOAL_STATUSES = new Set<string>(['all', 'active', 'completed', 'archived']);
const VALID_GOAL_SORTS = new Set<string>(['target_date', 'title', 'created']);

export function parseGoalsUrlState(params: URLSearchParams | Readonly<URLSearchParams> | Record<string, string | undefined>): GoalsUrlState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    if ('get' in params && typeof params.get === 'function') return params.get(key);
    return (params as Record<string, string | undefined>)[key] ?? null;
  };

  const rawStatus = (get('status') || '').toLowerCase();
  const status = VALID_GOAL_STATUSES.has(rawStatus)
    ? (rawStatus as GoalFilter)
    : DEFAULT_GOALS_URL_STATE.status;

  const q = (get('q') || get('search') || '').trim();

  const rawSort = (get('sort') || '').toLowerCase();
  const sort = VALID_GOAL_SORTS.has(rawSort)
    ? (rawSort as GoalSortField)
    : DEFAULT_GOALS_URL_STATE.sort;

  return {
    status,
    q,
    sort,
  };
}

export function serializeGoalsUrlState(state: Partial<GoalsUrlState>): string {
  const params = new URLSearchParams();

  if (state.status && state.status !== DEFAULT_GOALS_URL_STATE.status) {
    params.set('status', state.status);
  }
  if (state.q && state.q.trim()) {
    params.set('q', state.q.trim());
  }
  if (state.sort && state.sort !== DEFAULT_GOALS_URL_STATE.sort) {
    params.set('sort', state.sort);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// Projects URL State
// ============================================================================
const VALID_PROJECT_STATUSES = new Set<string>(['all', 'active', 'completed', 'paused', 'archived']);
const VALID_PROJECT_SORTS = new Set<string>(['deadline', 'title', 'created']);

export function parseProjectsUrlState(params: URLSearchParams | Readonly<URLSearchParams> | Record<string, string | undefined>): ProjectsUrlState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    if ('get' in params && typeof params.get === 'function') return params.get(key);
    return (params as Record<string, string | undefined>)[key] ?? null;
  };

  const rawStatus = (get('status') || '').toLowerCase();
  const status = VALID_PROJECT_STATUSES.has(rawStatus)
    ? (rawStatus as ProjectFilter)
    : DEFAULT_PROJECTS_URL_STATE.status;

  const rawGoal = get('goal') || '';
  const goal = rawGoal.trim() ? rawGoal.trim() : DEFAULT_PROJECTS_URL_STATE.goal;

  const q = (get('q') || get('search') || '').trim();

  const rawSort = (get('sort') || '').toLowerCase();
  const sort = VALID_PROJECT_SORTS.has(rawSort)
    ? (rawSort as ProjectSortField)
    : DEFAULT_PROJECTS_URL_STATE.sort;

  return {
    status,
    goal,
    q,
    sort,
  };
}

export function serializeProjectsUrlState(state: Partial<ProjectsUrlState>): string {
  const params = new URLSearchParams();

  if (state.status && state.status !== DEFAULT_PROJECTS_URL_STATE.status) {
    params.set('status', state.status);
  }
  if (state.goal && state.goal !== DEFAULT_PROJECTS_URL_STATE.goal) {
    params.set('goal', state.goal);
  }
  if (state.q && state.q.trim()) {
    params.set('q', state.q.trim());
  }
  if (state.sort && state.sort !== DEFAULT_PROJECTS_URL_STATE.sort) {
    params.set('sort', state.sort);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// Habits URL State
// ============================================================================
const VALID_HABIT_TABS = new Set<string>(['today', 'all', 'routines', 'archived']);

export function parseHabitsUrlState(params: URLSearchParams | Readonly<URLSearchParams> | Record<string, string | undefined>): HabitsUrlState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    if ('get' in params && typeof params.get === 'function') return params.get(key);
    return (params as Record<string, string | undefined>)[key] ?? null;
  };

  const rawTab = (get('tab') || '').toLowerCase();
  const tab = VALID_HABIT_TABS.has(rawTab)
    ? (rawTab as HabitsTabMode)
    : DEFAULT_HABITS_URL_STATE.tab;

  const rawCat = get('category') || get('cat') || '';
  const category = rawCat.trim() ? rawCat.trim() : DEFAULT_HABITS_URL_STATE.category;

  return {
    tab,
    category,
  };
}

export function serializeHabitsUrlState(state: Partial<HabitsUrlState>): string {
  const params = new URLSearchParams();

  if (state.tab && state.tab !== DEFAULT_HABITS_URL_STATE.tab) {
    params.set('tab', state.tab);
  }
  if (state.category && state.category !== DEFAULT_HABITS_URL_STATE.category) {
    params.set('category', state.category);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// Accountability URL State
// ============================================================================
const VALID_ACCOUNTABILITY_FILTERS = new Set<string>(['all', 'fulfilled', 'waived', 'activated']);

export function parseAccountabilityUrlState(params: URLSearchParams | Readonly<URLSearchParams> | Record<string, string | undefined>): AccountabilityUrlState {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    if ('get' in params && typeof params.get === 'function') return params.get(key);
    return (params as Record<string, string | undefined>)[key] ?? null;
  };

  const rawFilter = (get('filter') || '').toLowerCase();
  const filter = VALID_ACCOUNTABILITY_FILTERS.has(rawFilter)
    ? (rawFilter as AccountabilityFilterTab)
    : DEFAULT_ACCOUNTABILITY_URL_STATE.filter;

  const rawEvent = get('event') || undefined;

  return {
    filter,
    event: rawEvent?.trim() || undefined,
  };
}

export function serializeAccountabilityUrlState(state: Partial<AccountabilityUrlState>): string {
  const params = new URLSearchParams();

  if (state.filter && state.filter !== DEFAULT_ACCOUNTABILITY_URL_STATE.filter) {
    params.set('filter', state.filter);
  }
  if (state.event && state.event.trim()) {
    params.set('event', state.event.trim());
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

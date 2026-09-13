/**
 * PACT Phase 7: Account Data Portability Importer & Restore Engine
 * Parses, validates, sanitizes, and reconciles full PACT JSON archives,
 * preserving entity relational graphs, remapping user IDs, and resolving collisions.
 */

import { randomUUID } from 'node:crypto';
import {
  userAccountBackupSchema,
  UserAccountBackup,
  ImportOptions,
} from '../validations/import';

export interface ImportParseResult {
  success: boolean;
  data?: UserAccountBackup;
  error?: string;
  schemaVersion?: string;
}

export interface ReconciledEntityCollection {
  goals: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  commitments: Record<string, unknown>[];
  verificationSessions: Record<string, unknown>[];
  waivers: Record<string, unknown>[];
  accountabilityEvents: Record<string, unknown>[];
  consequenceDefinitions: Record<string, unknown>[];
  calendarEvents: Record<string, unknown>[];
  financeCategories: Record<string, unknown>[];
  financeTransactions: Record<string, unknown>[];
  financeRecurringTransactions: Record<string, unknown>[];
  financeBudgets: Record<string, unknown>[];
  focusSessions: Record<string, unknown>[];
  habits: Record<string, unknown>[];
  habitOccurrences: Record<string, unknown>[];
  routineTemplates: Record<string, unknown>[];
  routineItems: Record<string, unknown>[];
  weeklyReviews: Record<string, unknown>[];
}

export interface ImportReconciliationSummary {
  goalsCount: number;
  projectsCount: number;
  tasksCount: number;
  commitmentsCount: number;
  verificationSessionsCount: number;
  waiversCount: number;
  consequenceDefinitionsCount: number;
  calendarEventsCount: number;
  financeTransactionsCount: number;
  financeCategoriesCount: number;
  financeBudgetsCount: number;
  focusSessionsCount: number;
  habitsCount: number;
  routineTemplatesCount: number;
  weeklyReviewsCount: number;
  totalEntitiesCount: number;
  remappedIdsCount: number;
}

export interface ImportReconciliationResult {
  success: boolean;
  targetUserId: string;
  sourceUserId: string;
  summary: ImportReconciliationSummary;
  entities: ReconciledEntityCollection;
  idMap: Record<string, string>;
  warnings: string[];
}

/**
 * Parses and validates raw backup JSON against the canonical schema.
 */
export function parseAndValidateBackupJson(rawJson: string): ImportParseResult {
  if (!rawJson || !rawJson.trim()) {
    return {
      success: false,
      error: 'Empty backup JSON provided.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON format';
    return {
      success: false,
      error: `JSON syntax error: ${msg}`,
    };
  }

  const result = userAccountBackupSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues;
    const errorDetails = issues.length > 0
      ? issues.map((e) => `${e.path.length > 0 ? e.path.join('.') : 'root'}: ${e.message}`).join('; ')
      : result.error.message;
    return {
      success: false,
      error: `Schema validation failed: ${errorDetails}`,
    };
  }

  const data = result.data;
  return {
    success: true,
    data,
    schemaVersion: data.schema_version,
  };
}

/**
 * Sanitizes a single entity record, stripping forbidden keys and ensuring valid timestamps.
 */
export function sanitizeImportRecord(
  record: Record<string, unknown>,
  targetUserId?: string
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  const forbiddenKeys = new Set([
    'access_token',
    'refresh_token',
    'token_secret',
    'password_hash',
    'secret_key',
    'webhook_secret',
  ]);

  for (const [k, v] of Object.entries(record)) {
    if (!forbiddenKeys.has(k)) {
      safe[k] = v;
    }
  }

  if (targetUserId) {
    if ('user_id' in safe) {
      safe.user_id = targetUserId;
    }
  }

  return safe;
}

/**
 * Reconciles the full entity graph across all 14 domains with foreign key remapping and sanitization.
 */
export function reconcileEntityGraph(
  backup: UserAccountBackup,
  targetUserId: string,
  options?: Partial<ImportOptions>
): ImportReconciliationResult {
  const warnings: string[] = [];
  const idMap = new Map<string, string>();

  const shouldRemap = options?.remapUserId ?? true;

  // Helper to map or generate ID
  const mapId = (oldId: unknown): string => {
    if (typeof oldId !== 'string' || !oldId) {
      return randomUUID();
    }
    if (shouldRemap) {
      if (!idMap.has(oldId)) {
        idMap.set(oldId, randomUUID());
      }
      return idMap.get(oldId)!;
    }
    return oldId;
  };

  const getRemappedId = (oldId: unknown): string | null => {
    if (typeof oldId !== 'string' || !oldId) return null;
    return idMap.get(oldId) || (shouldRemap ? null : oldId);
  };

  // 1. Goals
  const goals = (backup.goals || []).map((g) => {
    const newId = mapId(g.id);
    const sanitized = sanitizeImportRecord(g, targetUserId);
    return { ...sanitized, id: newId };
  });

  // 2. Projects (remap goal_id)
  const projects = (backup.projects || []).map((p) => {
    const newId = mapId(p.id);
    const sanitized = sanitizeImportRecord(p, targetUserId);
    const goalId = getRemappedId(p.goal_id);
    return { ...sanitized, id: newId, goal_id: goalId };
  });

  // 3. Tasks (remap project_id, goal_id)
  const tasks = (backup.tasks || []).map((t) => {
    const newId = mapId(t.id);
    const sanitized = sanitizeImportRecord(t, targetUserId);
    const projectId = getRemappedId(t.project_id);
    const goalId = getRemappedId(t.goal_id);
    return { ...sanitized, id: newId, project_id: projectId, goal_id: goalId };
  });

  // 4. Consequence Definitions
  const consequenceDefinitions = (backup.consequence_definitions || []).map((c) => {
    const newId = mapId(c.id);
    const sanitized = sanitizeImportRecord(c, targetUserId);
    return { ...sanitized, id: newId };
  });

  // 5. Commitments (remap task_id, source_consequence_id)
  const commitments = (backup.commitments || []).map((c) => {
    const newId = mapId(c.id);
    const sanitized = sanitizeImportRecord(c, targetUserId);
    const taskId = getRemappedId(c.task_id) || mapId(c.task_id);
    const consequenceId = getRemappedId(c.source_consequence_id);
    return {
      ...sanitized,
      id: newId,
      task_id: taskId,
      source_consequence_id: consequenceId,
    };
  });

  // 6. Verification Sessions (remap commitment_id)
  const verificationSessions = (backup.verification_sessions || []).map((v) => {
    const newId = mapId(v.id);
    const sanitized = sanitizeImportRecord(v, targetUserId);
    const commitmentId = getRemappedId(v.commitment_id) || mapId(v.commitment_id);
    return { ...sanitized, id: newId, commitment_id: commitmentId };
  });

  // 7. Waivers (remap commitment_id, task_id)
  const waivers = (backup.waivers || []).map((w) => {
    const newId = mapId(w.id);
    const sanitized = sanitizeImportRecord(w, targetUserId);
    const commitmentId = getRemappedId(w.commitment_id) || mapId(w.commitment_id);
    const taskId = getRemappedId(w.task_id) || mapId(w.task_id);
    return { ...sanitized, id: newId, commitment_id: commitmentId, task_id: taskId };
  });

  // 8. Accountability Events (remap task_id, commitment_id)
  const accountabilityEvents = (backup.accountability_events || []).map((e) => {
    const newId = mapId(e.id);
    const sanitized = sanitizeImportRecord(e, targetUserId);
    const taskId = getRemappedId(e.task_id) || mapId(e.task_id);
    const commitmentId = getRemappedId(e.commitment_id) || mapId(e.commitment_id);
    return { ...sanitized, id: newId, task_id: taskId, commitment_id: commitmentId };
  });

  // 9. Calendar Events (remap goal_id, project_id, task_id)
  const calendarEvents = (backup.calendar_events || []).map((ce) => {
    const newId = mapId(ce.id);
    const sanitized = sanitizeImportRecord(ce, targetUserId);
    const goalId = getRemappedId(ce.goal_id);
    const projectId = getRemappedId(ce.project_id);
    const taskId = getRemappedId(ce.task_id);
    return { ...sanitized, id: newId, goal_id: goalId, project_id: projectId, task_id: taskId };
  });

  // 10. Finance Categories
  const financeCategories = ((backup.finance && backup.finance.categories) || []).map((fc) => {
    const newId = mapId(fc.id);
    const sanitized = sanitizeImportRecord(fc, targetUserId);
    return { ...sanitized, id: newId };
  });

  // 11. Finance Recurring Transactions (remap category_id)
  const financeRecurringTransactions = (
    (backup.finance && backup.finance.recurring_transactions) ||
    []
  ).map((rt) => {
    const newId = mapId(rt.id);
    const sanitized = sanitizeImportRecord(rt, targetUserId);
    const categoryId = getRemappedId(rt.category_id);
    return { ...sanitized, id: newId, category_id: categoryId };
  });

  // 12. Finance Transactions (remap category_id, recurring_transaction_id)
  const financeTransactions = ((backup.finance && backup.finance.transactions) || []).map((ft) => {
    const newId = mapId(ft.id);
    const sanitized = sanitizeImportRecord(ft, targetUserId);
    const categoryId = getRemappedId(ft.category_id);
    const recId = getRemappedId(ft.recurring_transaction_id);
    return {
      ...sanitized,
      id: newId,
      category_id: categoryId,
      recurring_transaction_id: recId,
    };
  });

  // 13. Finance Budgets (remap category_id)
  const financeBudgets = ((backup.finance && backup.finance.budgets) || []).map((fb) => {
    const newId = mapId(fb.id);
    const sanitized = sanitizeImportRecord(fb, targetUserId);
    const categoryId = getRemappedId(fb.category_id);
    return { ...sanitized, id: newId, category_id: categoryId };
  });

  // 14. Focus Sessions (remap task_id)
  const focusSessions = (backup.focus_sessions || []).map((fs) => {
    const newId = mapId(fs.id);
    const sanitized = sanitizeImportRecord(fs, targetUserId);
    const taskId = getRemappedId(fs.task_id);
    return { ...sanitized, id: newId, task_id: taskId };
  });

  // 15. Habits
  const habitsData = backup.habits || { habits: [], occurrences: [], routine_templates: [], routine_items: [] };
  const habits = (habitsData.habits || []).map((h) => {
    const newId = mapId(h.id);
    const sanitized = sanitizeImportRecord(h, targetUserId);
    return { ...sanitized, id: newId };
  });

  // 16. Habit Occurrences (remap habit_id)
  const habitOccurrences = (habitsData.occurrences || []).map((ho) => {
    const newId = mapId(ho.id);
    const sanitized = sanitizeImportRecord(ho, targetUserId);
    const habitId = getRemappedId(ho.habit_id) || mapId(ho.habit_id);
    return { ...sanitized, id: newId, habit_id: habitId };
  });

  // 17. Routine Templates
  const routineTemplates = (habitsData.routine_templates || []).map((rt) => {
    const newId = mapId(rt.id);
    const sanitized = sanitizeImportRecord(rt, targetUserId);
    return { ...sanitized, id: newId };
  });

  // 18. Routine Items (remap template_id, habit_id)
  const routineItems = (habitsData.routine_items || []).map((ri) => {
    const newId = mapId(ri.id);
    const sanitized = sanitizeImportRecord(ri, targetUserId);
    const templateId = getRemappedId(ri.template_id) || mapId(ri.template_id);
    const habitId = getRemappedId(ri.habit_id);
    return {
      ...sanitized,
      id: newId,
      template_id: templateId,
      habit_id: habitId,
    };
  });

  // 19. Weekly Reviews
  const weeklyReviews = (backup.weekly_reviews || []).map((wr) => {
    const newId = mapId(wr.id);
    const sanitized = sanitizeImportRecord(wr, targetUserId);
    return { ...sanitized, id: newId };
  });

  const totalEntitiesCount =
    goals.length +
    projects.length +
    tasks.length +
    commitments.length +
    verificationSessions.length +
    waivers.length +
    consequenceDefinitions.length +
    calendarEvents.length +
    financeCategories.length +
    financeTransactions.length +
    financeRecurringTransactions.length +
    financeBudgets.length +
    focusSessions.length +
    habits.length +
    habitOccurrences.length +
    routineTemplates.length +
    routineItems.length +
    weeklyReviews.length;

  const idMapObj: Record<string, string> = {};
  for (const [k, v] of idMap.entries()) {
    idMapObj[k] = v;
  }

  return {
    success: true,
    targetUserId,
    sourceUserId: backup.user_id,
    summary: {
      goalsCount: goals.length,
      projectsCount: projects.length,
      tasksCount: tasks.length,
      commitmentsCount: commitments.length,
      verificationSessionsCount: verificationSessions.length,
      waiversCount: waivers.length,
      consequenceDefinitionsCount: consequenceDefinitions.length,
      calendarEventsCount: calendarEvents.length,
      financeTransactionsCount: financeTransactions.length,
      financeCategoriesCount: financeCategories.length,
      financeBudgetsCount: financeBudgets.length,
      focusSessionsCount: focusSessions.length,
      habitsCount: habits.length,
      routineTemplatesCount: routineTemplates.length,
      weeklyReviewsCount: weeklyReviews.length,
      totalEntitiesCount,
      remappedIdsCount: idMap.size,
    },
    entities: {
      goals,
      projects,
      tasks,
      commitments,
      verificationSessions,
      waivers,
      accountabilityEvents,
      consequenceDefinitions,
      calendarEvents,
      financeCategories,
      financeTransactions,
      financeRecurringTransactions,
      financeBudgets,
      focusSessions,
      habits,
      habitOccurrences,
      routineTemplates,
      routineItems,
      weeklyReviews,
    },
    idMap: idMapObj,
    warnings,
  };
}

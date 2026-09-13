/**
 * PACT Phase 7: Account Data Portability Import & Restore Test Suite
 * Validates JSON parsing, strict schema validation, sanitization,
 * entity graph reconciliation, and relational foreign-key integrity.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  serializeUserAccountJson,
  EXPORT_SCHEMA_VERSION,
  RawUserDataArchive,
} from '../src/lib/export/serializer';

import {
  parseAndValidateBackupJson,
  reconcileEntityGraph,
  sanitizeImportRecord,
} from '../src/lib/export/importer';

describe('PACT Phase 7: Account Data Portability Import & Restore Engine', () => {
  describe('JSON Parsing & Validation', () => {
    it('validates a complete, canonical PACT backup JSON archive', () => {
      const validBackup = {
        schema_version: EXPORT_SCHEMA_VERSION,
        exported_at: '2026-09-13T12:00:00.000Z',
        user_id: 'user_orig_123',
        profile: { full_name: 'Original User', timezone: 'UTC' },
        goals: [{ id: 'g1', title: 'Goal 1', status: 'active' }],
        projects: [{ id: 'p1', goal_id: 'g1', title: 'Project 1', status: 'active' }],
        tasks: [{ id: 't1', project_id: 'p1', goal_id: 'g1', title: 'Task 1', status: 'pending' }],
        commitments: [{ id: 'c1', task_id: 't1', commitment_status: 'committed' }],
        finance: {
          categories: [{ id: 'cat1', name: 'Software' }],
          transactions: [{ id: 'tx1', category_id: 'cat1', amount_cents: 2500, type: 'expense' }],
          recurring_transactions: [],
          budgets: [{ id: 'b1', category_id: 'cat1', limit_cents: 10000 }],
        },
        habits: {
          habits: [{ id: 'h1', title: 'Deep Work' }],
          occurrences: [{ id: 'ho1', habit_id: 'h1', status: 'completed' }],
          routine_templates: [{ id: 'rt1', name: 'Morning Kickoff' }],
          routine_items: [{ id: 'ri1', template_id: 'rt1', habit_id: 'h1', title: 'Meditate' }],
        },
        focus_sessions: [{ id: 'fs1', task_id: 't1', session_type: 'flow', actual_duration_seconds: 1800 }],
        weekly_reviews: [{ id: 'wr1', week_start_date: '2026-09-07', status: 'completed' }],
      };

      const result = parseAndValidateBackupJson(JSON.stringify(validBackup));
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.schemaVersion, EXPORT_SCHEMA_VERSION);
      assert.strictEqual(result.data.goals.length, 1);
    });

    it('rejects malformed or non-JSON payloads with honest error diagnostics', () => {
      const result1 = parseAndValidateBackupJson('');
      assert.strictEqual(result1.success, false);
      assert.ok(result1.error?.includes('Empty backup'));

      const result2 = parseAndValidateBackupJson('INVALID_JSON_HERE{');
      assert.strictEqual(result2.success, false);
      assert.ok(result2.error?.includes('syntax error'));
    });

    it('rejects payloads missing mandatory metadata headers', () => {
      const invalidBackup = {
        goals: [],
      };

      const result = parseAndValidateBackupJson(JSON.stringify(invalidBackup));
      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('schema_version') || result.error?.includes('user_id'));
    });
  });

  describe('Record Sanitization', () => {
    it('strips sensitive credentials and rebinds user_id', () => {
      const rawRecord = {
        id: 'rec1',
        user_id: 'old_user_id',
        title: 'Safe Entity',
        access_token: 'secret_oauth_token',
        password_hash: '$2b$10$...',
        secret_key: 'sk_test_123',
      };

      const sanitized = sanitizeImportRecord(rawRecord, 'target_user_456');
      assert.strictEqual(sanitized.id, 'rec1');
      assert.strictEqual(sanitized.user_id, 'target_user_456');
      assert.strictEqual(sanitized.title, 'Safe Entity');
      assert.strictEqual(sanitized.access_token, undefined);
      assert.strictEqual(sanitized.password_hash, undefined);
      assert.strictEqual(sanitized.secret_key, undefined);
    });
  });

  describe('Relational Graph Reconciliation & Foreign-Key Integrity', () => {
    it('remaps entity IDs while preserving complete relational hierarchy', () => {
      const rawBackup = {
        schema_version: EXPORT_SCHEMA_VERSION,
        exported_at: '2026-09-13T12:00:00.000Z',
        user_id: 'source_user_999',
        goals: [{ id: 'goal_orig_1', title: 'Master Distributed Systems' }],
        projects: [{ id: 'proj_orig_1', goal_id: 'goal_orig_1', title: 'Build Raft Consensus' }],
        tasks: [{ id: 'task_orig_1', project_id: 'proj_orig_1', goal_id: 'goal_orig_1', title: 'Implement Leader Election' }],
        consequence_definitions: [{ id: 'csq_orig_1', title: 'Donate $50' }],
        commitments: [{ id: 'comm_orig_1', task_id: 'task_orig_1', source_consequence_id: 'csq_orig_1', commitment_status: 'committed' }],
        verification_sessions: [{ id: 'vs_orig_1', commitment_id: 'comm_orig_1', status: 'completed' }],
        waivers: [{ id: 'wv_orig_1', commitment_id: 'comm_orig_1', task_id: 'task_orig_1' }],
        calendar_events: [{ id: 'cal_orig_1', goal_id: 'goal_orig_1', project_id: 'proj_orig_1', task_id: 'task_orig_1', title: 'Study Session' }],
        finance: {
          categories: [{ id: 'cat_orig_1', name: 'Servers' }],
          transactions: [{ id: 'tx_orig_1', category_id: 'cat_orig_1', amount_cents: 5000, type: 'expense' }],
          recurring_transactions: [{ id: 'rec_orig_1', category_id: 'cat_orig_1', amount_cents: 2000, frequency: 'monthly' }],
          budgets: [{ id: 'b_orig_1', category_id: 'cat_orig_1', limit_cents: 10000 }],
        },
        habits: {
          habits: [{ id: 'hab_orig_1', title: 'Daily Coding' }],
          occurrences: [{ id: 'occ_orig_1', habit_id: 'hab_orig_1', status: 'completed' }],
          routine_templates: [{ id: 'rt_orig_1', name: 'Evening Wrap' }],
          routine_items: [{ id: 'ri_orig_1', template_id: 'rt_orig_1', habit_id: 'hab_orig_1', title: 'Commit code' }],
        },
        focus_sessions: [{ id: 'fs_orig_1', task_id: 'task_orig_1', session_type: 'pomodoro' }],
        weekly_reviews: [{ id: 'wr_orig_1', week_start_date: '2026-09-07' }],
      };

      const targetUserId = 'target_user_888';
      const parsed = parseAndValidateBackupJson(JSON.stringify(rawBackup));
      assert.strictEqual(parsed.success, true);

      const reconciled = reconcileEntityGraph(parsed.data!, targetUserId, {
        remapUserId: true,
      });

      assert.strictEqual(reconciled.success, true);
      assert.strictEqual(reconciled.targetUserId, targetUserId);
      assert.strictEqual(reconciled.sourceUserId, 'source_user_999');

      // Verify remapped Goals -> Projects -> Tasks
      const newGoal = reconciled.entities.goals[0];
      const newProj = reconciled.entities.projects[0];
      const newTask = reconciled.entities.tasks[0];
      const newComm = reconciled.entities.commitments[0];
      const newCsq = reconciled.entities.consequenceDefinitions[0];

      assert.notStrictEqual(newGoal.id, 'goal_orig_1');
      assert.notStrictEqual(newProj.id, 'proj_orig_1');
      assert.notStrictEqual(newTask.id, 'task_orig_1');
      assert.notStrictEqual(newComm.id, 'comm_orig_1');

      // Check foreign key relational mapping
      assert.strictEqual(newProj.goal_id, newGoal.id);
      assert.strictEqual(newTask.project_id, newProj.id);
      assert.strictEqual(newTask.goal_id, newGoal.id);
      assert.strictEqual(newComm.task_id, newTask.id);
      assert.strictEqual(newComm.source_consequence_id, newCsq.id);

      // Check verification session and waiver foreign keys
      const newVs = reconciled.entities.verificationSessions[0];
      const newWv = reconciled.entities.waivers[0];
      assert.strictEqual(newVs.commitment_id, newComm.id);
      assert.strictEqual(newWv.commitment_id, newComm.id);
      assert.strictEqual(newWv.task_id, newTask.id);

      // Check finance categories links
      const newCat = reconciled.entities.financeCategories[0];
      const newTx = reconciled.entities.financeTransactions[0];
      const newRec = reconciled.entities.financeRecurringTransactions[0];
      const newBudget = reconciled.entities.financeBudgets[0];

      assert.strictEqual(newTx.category_id, newCat.id);
      assert.strictEqual(newRec.category_id, newCat.id);
      assert.strictEqual(newBudget.category_id, newCat.id);

      // Check habit and routine template links
      const newHab = reconciled.entities.habits[0];
      const newOcc = reconciled.entities.habitOccurrences[0];
      const newRt = reconciled.entities.routineTemplates[0];
      const newRi = reconciled.entities.routineItems[0];

      assert.strictEqual(newOcc.habit_id, newHab.id);
      assert.strictEqual(newRi.template_id, newRt.id);
      assert.strictEqual(newRi.habit_id, newHab.id);

      // Check focus sessions task link
      const newFs = reconciled.entities.focusSessions[0];
      assert.strictEqual(newFs.task_id, newTask.id);

      // Check summary entity counts
      assert.strictEqual(reconciled.summary.goalsCount, 1);
      assert.strictEqual(reconciled.summary.projectsCount, 1);
      assert.strictEqual(reconciled.summary.tasksCount, 1);
      assert.strictEqual(reconciled.summary.commitmentsCount, 1);
      assert.strictEqual(reconciled.summary.financeTransactionsCount, 1);
      assert.strictEqual(reconciled.summary.habitsCount, 1);
      assert.strictEqual(reconciled.summary.routineTemplatesCount, 1);
      assert.strictEqual(reconciled.summary.weeklyReviewsCount, 1);
      assert.ok(reconciled.summary.totalEntitiesCount >= 10);
    });

    it('performs full round-trip from export serializer to import reconciler', () => {
      const mockArchive: RawUserDataArchive = {
        userId: 'export_user_1',
        exportedAt: '2026-09-13T12:00:00.000Z',
        profile: { id: 'export_user_1', full_name: 'Jane Doe', timezone: 'America/New_York' },
        goals: [{ id: 'g_round_1', title: 'Publish Research Paper' }],
        projects: [{ id: 'p_round_1', goal_id: 'g_round_1', title: 'Literature Review' }],
        tasks: [{ id: 't_round_1', project_id: 'p_round_1', title: 'Synthesize Findings' }],
        commitments: [],
        verificationSessions: [],
        waivers: [],
        accountabilityEvents: [],
        consequenceDefinitions: [],
        calendarEvents: [],
        googleCalendarSyncState: null,
        financeCategories: [{ id: 'fc_1', name: 'Books' }],
        financeTransactions: [{ id: 'ft_1', category_id: 'fc_1', amount_cents: 4500 }],
        financeRecurringTransactions: [],
        financeBudgets: [],
        notifications: [],
        notificationChannels: [],
        externalProviders: [],
        externalProofEvidence: [],
        focusSessions: [{ id: 'fs_1', task_id: 't_round_1', duration_minutes: 45 }],
        habits: [{ id: 'h_1', title: 'Read 20 pages' }],
        habitOccurrences: [],
        routineTemplates: [],
        routineItems: [],
        weeklyReviews: [],
      };

      const exportedJson = serializeUserAccountJson(mockArchive);
      assert.ok(exportedJson);

      const parsed = parseAndValidateBackupJson(exportedJson);
      assert.strictEqual(parsed.success, true);
      assert.ok(parsed.data);

      const targetId = 'new_authenticated_user_2';
      const reconciled = reconcileEntityGraph(parsed.data!, targetId);

      assert.strictEqual(reconciled.success, true);
      assert.strictEqual(reconciled.targetUserId, targetId);
      assert.strictEqual(reconciled.entities.goals.length, 1);
      assert.strictEqual(reconciled.entities.projects.length, 1);
      assert.strictEqual(reconciled.entities.tasks.length, 1);
      assert.strictEqual(reconciled.entities.projects[0].goal_id, reconciled.entities.goals[0].id);
      assert.strictEqual(reconciled.entities.tasks[0].project_id, reconciled.entities.projects[0].id);
    });
  });
});

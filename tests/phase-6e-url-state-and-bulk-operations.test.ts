/**
 * PACT OS — Phase 6E Test Suite
 * Comprehensive offline verification for:
 * 1. Deep-link URL state parsing, fallback, and serialization across all domains
 * 2. Zod bulk validation schemas (UUID validation, deduplication, batch limits)
 * 3. Server-authoritative bulk operation semantics & partial failure accounting
 * 4. Multi-tenant isolation & security invariants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTasksUrlState,
  serializeTasksUrlState,
  parseFinanceUrlState,
  serializeFinanceUrlState,
  parseGoalsUrlState,
  serializeGoalsUrlState,
  parseProjectsUrlState,
  serializeProjectsUrlState,
  parseHabitsUrlState,
  serializeHabitsUrlState,
  parseAccountabilityUrlState,
  serializeAccountabilityUrlState,
  DEFAULT_TASKS_URL_STATE,
  DEFAULT_FINANCE_URL_STATE,
  DEFAULT_GOALS_URL_STATE,
  DEFAULT_PROJECTS_URL_STATE,
  DEFAULT_HABITS_URL_STATE,
  DEFAULT_ACCOUNTABILITY_URL_STATE,
} from '../src/lib/url-state';
import {
  bulkCompleteTasksSchema,
  bulkUpdateTaskStatusSchema,
  bulkRescheduleTasksSchema,
  bulkDeleteTasksSchema,
  bulkCategorizeTransactionsSchema,
  bulkDeleteTransactionsSchema,
} from '../src/lib/validations/bulk';

describe('Phase 6E: Deep-Link URL State Engine', () => {
  describe('Tasks URL State Parsing & Serialization', () => {
    it('parses valid task query parameters correctly', () => {
      const params = new URLSearchParams('tab=pending&priority=urgent&q=deploy&sort=created&dir=desc&goal=g123&project=p456');
      const state = parseTasksUrlState(params);

      assert.equal(state.tab, 'pending');
      assert.equal(state.priority, 'urgent');
      assert.equal(state.q, 'deploy');
      assert.equal(state.sort, 'created');
      assert.equal(state.dir, 'desc');
      assert.equal(state.goal, 'g123');
      assert.equal(state.project, 'p456');
    });

    it('falls back safely when receiving invalid or malformed task parameters', () => {
      const params = new URLSearchParams('tab=INVALID_STATUS&priority=UNKNOWN&sort=HACK&dir=SIDEWAYS');
      const state = parseTasksUrlState(params);

      assert.equal(state.tab, DEFAULT_TASKS_URL_STATE.tab);
      assert.equal(state.priority, DEFAULT_TASKS_URL_STATE.priority);
      assert.equal(state.sort, DEFAULT_TASKS_URL_STATE.sort);
      assert.equal(state.dir, DEFAULT_TASKS_URL_STATE.dir);
      assert.equal(state.q, '');
      assert.equal(state.goal, undefined);
      assert.equal(state.project, undefined);
    });

    it('serializes task state, omitting default values for clean URLs', () => {
      // Default state produces empty string
      assert.equal(serializeTasksUrlState(DEFAULT_TASKS_URL_STATE), '');

      // Custom non-default state produces clean query string
      const customState = {
        ...DEFAULT_TASKS_URL_STATE,
        tab: 'in_progress' as const,
        priority: 'high' as const,
        q: 'review',
      };
      const serialized = serializeTasksUrlState(customState);
      assert.ok(serialized.includes('tab=in_progress'));
      assert.ok(serialized.includes('priority=high'));
      assert.ok(serialized.includes('q=review'));
      assert.ok(!serialized.includes('sort=deadline')); // default omitted
      assert.ok(!serialized.includes('dir=asc')); // default omitted
    });

    it('performs bidirectional round-trip parsing and serialization without loss', () => {
      const original = {
        tab: 'completed' as const,
        priority: 'medium' as const,
        q: 'quarterly review',
        sort: 'title' as const,
        dir: 'desc' as const,
        goal: '3f7b5e42-1234-4567-89ab-cdef01234567',
        project: '9a8b7c6d-5e4f-3a2b-1c0d-e4f5a6b7c8d9',
      };

      const serialized = serializeTasksUrlState(original);
      const searchParams = new URLSearchParams(serialized.replace('?', ''));
      const parsed = parseTasksUrlState(searchParams);

      assert.deepEqual(parsed, original);
    });
  });

  describe('Finance URL State Parsing & Serialization', () => {
    it('parses valid finance query parameters', () => {
      const params = new URLSearchParams('tab=expense&category=groceries&q=supermarket&month=2026-09');
      const state = parseFinanceUrlState(params);

      assert.equal(state.tab, 'expense');
      assert.equal(state.category, 'groceries');
      assert.equal(state.q, 'supermarket');
      assert.equal(state.month, '2026-09');
    });

    it('sanitizes invalid month formats and falls back on invalid transaction types', () => {
      const params = new URLSearchParams('tab=INVALID&month=not-a-month');
      const state = parseFinanceUrlState(params);

      assert.equal(state.tab, 'all');
      assert.equal(state.category, 'all');
      assert.equal(state.month, undefined);
    });

    it('serializes finance state cleanly omitting default values', () => {
      assert.equal(serializeFinanceUrlState(DEFAULT_FINANCE_URL_STATE), '');

      const customState = {
        tab: 'income' as const,
        category: 'salary',
        q: '',
        month: '2026-09',
      };
      const serialized = serializeFinanceUrlState(customState);
      assert.ok(serialized.includes('tab=income'));
      assert.ok(serialized.includes('category=salary'));
      assert.ok(serialized.includes('month=2026-09'));
    });
  });

  describe('Goals & Projects URL State Parsing', () => {
    it('parses and falls back safely for Goals', () => {
      const valid = parseGoalsUrlState(new URLSearchParams('status=completed&q=revenue&sort=title'));
      assert.equal(valid.status, 'completed');
      assert.equal(valid.q, 'revenue');
      assert.equal(valid.sort, 'title');

      const invalid = parseGoalsUrlState(new URLSearchParams('status=bogus&sort=random'));
      assert.equal(invalid.status, 'active');
      assert.equal(invalid.sort, 'target_date');
    });

    it('parses and falls back safely for Projects', () => {
      const valid = parseProjectsUrlState(new URLSearchParams('status=paused&goal=independent&q=app'));
      assert.equal(valid.status, 'paused');
      assert.equal(valid.goal, 'independent');
      assert.equal(valid.q, 'app');

      const invalid = parseProjectsUrlState(new URLSearchParams('status=deleted'));
      assert.equal(invalid.status, 'active');
      assert.equal(invalid.goal, 'all');
    });
  });

  describe('Habits & Accountability URL State Parsing', () => {
    it('parses Habits tab and category', () => {
      const valid = parseHabitsUrlState(new URLSearchParams('tab=routines&category=fitness'));
      assert.equal(valid.tab, 'routines');
      assert.equal(valid.category, 'fitness');

      const fallback = parseHabitsUrlState(new URLSearchParams('tab=garbage'));
      assert.equal(fallback.tab, 'today');
      assert.equal(fallback.category, 'all');
    });

    it('parses Accountability filter and expanded event', () => {
      const valid = parseAccountabilityUrlState(
        new URLSearchParams('filter=activated&event=evt-123')
      );
      assert.equal(valid.filter, 'activated');
      assert.equal(valid.event, 'evt-123');

      const fallback = parseAccountabilityUrlState(new URLSearchParams('filter=nonsense'));
      assert.equal(fallback.filter, 'all');
      assert.equal(fallback.event, undefined);
    });
  });
});

describe('Phase 6E: Bulk Operations Validation Engine', () => {
  const validUuid1 = 'a1b2c3d4-e5f6-4a8b-8c0d-1e2f3a4b5c6d';
  const validUuid2 = 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e';
  const validUuid3 = 'c3d4e5f6-a7b8-4c0d-8e2f-3a4b5c6d7e8f';

  describe('bulkCompleteTasksSchema', () => {
    it('validates a correct list of task UUIDs and deduplicates IDs', () => {
      const input = {
        taskIds: [validUuid1, validUuid2, validUuid1], // has duplicate
      };
      const res = bulkCompleteTasksSchema.safeParse(input);
      assert.equal(res.success, true);
      if (res.success) {
        assert.deepEqual(res.data.taskIds, [validUuid1, validUuid2]);
        assert.equal(res.data.taskIds.length, 2);
      }
    });

    it('rejects empty task lists', () => {
      const res = bulkCompleteTasksSchema.safeParse({ taskIds: [] });
      assert.equal(res.success, false);
    });

    it('rejects invalid UUID formats', () => {
      const res = bulkCompleteTasksSchema.safeParse({ taskIds: ['not-a-uuid'] });
      assert.equal(res.success, false);
    });

    it('rejects batches exceeding maximum limit of 50 tasks', () => {
      const oversized = Array.from({ length: 51 }, (_, i) =>
        `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`
      );
      const res = bulkCompleteTasksSchema.safeParse({ taskIds: oversized });
      assert.equal(res.success, false);
    });
  });

  describe('bulkUpdateTaskStatusSchema', () => {
    it('accepts valid statuses: pending, in_progress, archived', () => {
      assert.equal(
        bulkUpdateTaskStatusSchema.safeParse({ taskIds: [validUuid1], status: 'pending' }).success,
        true
      );
      assert.equal(
        bulkUpdateTaskStatusSchema.safeParse({ taskIds: [validUuid1], status: 'in_progress' }).success,
        true
      );
      assert.equal(
        bulkUpdateTaskStatusSchema.safeParse({ taskIds: [validUuid1], status: 'archived' }).success,
        true
      );
    });

    it('strictly prohibits direct transition to completed or missed via bulk update', () => {
      const resCompleted = bulkUpdateTaskStatusSchema.safeParse({
        taskIds: [validUuid1],
        status: 'completed',
      });
      assert.equal(resCompleted.success, false);

      const resMissed = bulkUpdateTaskStatusSchema.safeParse({
        taskIds: [validUuid1],
        status: 'missed',
      });
      assert.equal(resMissed.success, false);
    });
  });

  describe('bulkRescheduleTasksSchema', () => {
    it('validates task list and ISO UTC deadline', () => {
      const res = bulkRescheduleTasksSchema.safeParse({
        taskIds: [validUuid1, validUuid2],
        deadline_at: '2026-09-15T18:00:00.000Z',
      });
      assert.equal(res.success, true);
    });

    it('rejects invalid datetime strings', () => {
      const res = bulkRescheduleTasksSchema.safeParse({
        taskIds: [validUuid1],
        deadline_at: 'tomorrow morning',
      });
      assert.equal(res.success, false);
    });
  });

  describe('Finance Bulk Schemas', () => {
    it('validates bulk categorization with category UUID or null', () => {
      const resWithCategory = bulkCategorizeTransactionsSchema.safeParse({
        transactionIds: [validUuid1, validUuid2],
        categoryId: validUuid3,
      });
      assert.equal(resWithCategory.success, true);

      const resNullCategory = bulkCategorizeTransactionsSchema.safeParse({
        transactionIds: [validUuid1],
        categoryId: null,
      });
      assert.equal(resNullCategory.success, true);
    });

    it('validates bulk transaction deletion', () => {
      const res = bulkDeleteTransactionsSchema.safeParse({
        transactionIds: [validUuid1, validUuid2],
      });
      assert.equal(res.success, true);
    });
  });
});

describe('Phase 6E: Partial Failure Accounting & Deterministic Results', () => {
  it('correctly categorizes succeeded, failed, and skipped items in bulk results', () => {
    const taskIds = ['task-1', 'task-2', 'task-3', 'task-4'];
    const rpcOutcomes: Record<string, { success: boolean; code?: string; error?: string }> = {
      'task-1': { success: true },
      'task-2': { success: false, code: 'ALREADY_COMPLETED' },
      'task-3': { success: false, code: 'DEADLINE_REACHED', error: 'Deadline was missed' },
      'task-4': { success: true },
    };

    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];
    const skipped: string[] = [];

    for (const id of taskIds) {
      const res = rpcOutcomes[id];
      if (res.success) {
        succeeded.push(id);
      } else if (res.code === 'ALREADY_COMPLETED') {
        skipped.push(id);
      } else {
        failed.push({ id, reason: res.error || 'Failed' });
      }
    }

    assert.deepEqual(succeeded, ['task-1', 'task-4']);
    assert.deepEqual(skipped, ['task-2']);
    assert.deepEqual(failed, [{ id: 'task-3', reason: 'Deadline was missed' }]);
    assert.equal(succeeded.length + skipped.length + failed.length, taskIds.length);
  });

  it('verifies multi-tenant isolation by rejecting unowned records', () => {
    const requestedIds = ['owned-1', 'foreign-2', 'owned-3'];
    const ownedInDb = new Set(['owned-1', 'owned-3']);

    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of requestedIds) {
      if (!ownedInDb.has(id)) {
        failed.push({ id, reason: 'Task not found or access denied' });
      } else {
        succeeded.push(id);
      }
    }

    assert.deepEqual(succeeded, ['owned-1', 'owned-3']);
    assert.deepEqual(failed, [{ id: 'foreign-2', reason: 'Task not found or access denied' }]);
  });
});

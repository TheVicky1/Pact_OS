/**
 * PACT Phase 9: Local-First Entity Cache & Deterministic Conflict Engine Tests
 * Authoritative verification of client storage tiering, version tracking, LWW conflict resolution,
 * idempotency, and strict server-authoritative consequence confidentiality.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  setCacheStorageAdapter,
  upsertCachedEntity,
  getCachedEntity,
  listCachedEntities,
  getDirtyEntities,
  markEntitySynced,
  removeCachedEntity,
  loadLocalCache,
  clearLocalCache,
} from '../src/lib/offline/local-cache';
import {
  resolveEntityConflict,
  isServerAuthoritativeType,
  isServerAuthoritativeField,
  sanitizeClientSyncPayload,
} from '../src/lib/offline/conflict-engine';
import {
  calculateBackoffDelay,
  processQueueSync,
  deriveOverallSyncState,
} from '../src/lib/offline/sync-engine';
import {
  createOfflineQueueItem,
  enqueueItem,
  dequeueItem,
  getPendingItems,
  getFailedItems,
  OfflineQueueItem,
} from '../src/lib/offline/queue';

// In-Memory test adapter
class MockStorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('PACT Phase 9: Local-First Entity Cache & Synchronization', () => {
  beforeEach(() => {
    setCacheStorageAdapter(new MockStorageAdapter());
    clearLocalCache();
  });

  describe('Local Entity Cache Tiering & Version Tracking', () => {
    it('initializes empty cache snapshot with version 2', () => {
      const snapshot = loadLocalCache();
      assert.equal(snapshot.version, 2);
      assert.deepEqual(snapshot.entities.tasks, []);
      assert.deepEqual(snapshot.entities.thoughts, []);
      assert.deepEqual(snapshot.entities.habits, []);
      assert.deepEqual(snapshot.entities.preferences, []);
    });

    it('upserts a new task entity with version 1 and dirty state', () => {
      const task = upsertCachedEntity('tasks', 'task-101', {
        title: 'Complete Phase 9 Architecture',
        priority: 'high',
      });

      assert.equal(task.id, 'task-101');
      assert.equal(task.version, 1);
      assert.equal(task.is_dirty, true);
      assert.equal(task.data.title, 'Complete Phase 9 Architecture');

      const retrieved = getCachedEntity('tasks', 'task-101');
      assert.ok(retrieved);
      assert.equal(retrieved?.data.priority, 'high');
    });

    it('increments version and updates timestamp on subsequent updates', () => {
      upsertCachedEntity('tasks', 'task-102', { title: 'Initial Title' });
      const updated = upsertCachedEntity('tasks', 'task-102', { title: 'Updated Title' });

      assert.equal(updated.version, 2);
      assert.equal(updated.data.title, 'Updated Title');
      assert.equal(updated.is_dirty, true);
    });

    it('retrieves dirty entities and cleanly marks them as synced', () => {
      upsertCachedEntity('tasks', 'task-201', { title: 'Clean Architecture' });
      upsertCachedEntity('thoughts', 'thought-201', { content: 'Deep focus note' });

      const dirty = getDirtyEntities();
      assert.equal(dirty.length, 2);

      const serverTimestamp = new Date().toISOString();
      const markSuccess = markEntitySynced('tasks', 'task-201', serverTimestamp);
      assert.equal(markSuccess, true);

      const updatedDirty = getDirtyEntities();
      assert.equal(updatedDirty.length, 1);
      assert.equal(updatedDirty[0].id, 'thought-201');
    });

    it('removes entities cleanly from local cache', () => {
      upsertCachedEntity('habits', 'habit-301', { name: 'Morning Review' });
      assert.equal(listCachedEntities('habits').length, 1);

      const removed = removeCachedEntity('habits', 'habit-301');
      assert.equal(removed, true);
      assert.equal(listCachedEntities('habits').length, 0);
    });
  });

  describe('Deterministic Last-Write-Wins (LWW) Conflict Engine', () => {
    it('resolves NO_CONFLICT when client is already synced and server has same timestamp', () => {
      const now = new Date().toISOString();
      const client = {
        id: 'task-401',
        type: 'tasks' as const,
        data: { title: 'Finish Audit' },
        version: 1,
        client_updated_at: now,
        server_updated_at: now,
        is_dirty: false,
      };

      const resolution = resolveEntityConflict(client, {
        id: 'task-401',
        updated_at: now,
        data: { title: 'Finish Audit' },
      });

      assert.equal(resolution.strategy, 'NO_CONFLICT');
      assert.equal(resolution.hasConflict, false);
    });

    it('applies CLIENT_WINS_LWW when client has newer timestamp for non-sensitive data', () => {
      const client = {
        id: 'task-402',
        type: 'tasks' as const,
        data: { title: 'Updated Offline Title', priority: 'urgent' },
        version: 2,
        client_updated_at: '2026-09-13T20:00:00.000Z',
        server_updated_at: '2026-09-13T19:00:00.000Z',
        is_dirty: true,
      };

      const resolution = resolveEntityConflict(client, {
        id: 'task-402',
        updated_at: '2026-09-13T19:30:00.000Z',
        data: { title: 'Older Server Title', priority: 'low' },
      });

      assert.equal(resolution.strategy, 'CLIENT_WINS_LWW');
      assert.equal(resolution.hasConflict, true);
      assert.equal(resolution.resolvedData.title, 'Updated Offline Title');
      assert.equal(resolution.resolvedData.priority, 'urgent');
    });

    it('applies SERVER_WINS_LWW when server has newer timestamp', () => {
      const client = {
        id: 'task-403',
        type: 'tasks' as const,
        data: { title: 'Stale Client Title' },
        version: 2,
        client_updated_at: '2026-09-13T18:00:00.000Z',
        server_updated_at: '2026-09-13T17:00:00.000Z',
        is_dirty: true,
      };

      const resolution = resolveEntityConflict(client, {
        id: 'task-403',
        updated_at: '2026-09-13T19:00:00.000Z',
        data: { title: 'Authoritative Newer Server Title' },
      });

      assert.equal(resolution.strategy, 'SERVER_WINS_LWW');
      assert.equal(resolution.hasConflict, true);
      assert.equal(resolution.resolvedData.title, 'Authoritative Newer Server Title');
    });

    it('strictly enforces server authority and rejects offline consequence mutations', () => {
      assert.equal(isServerAuthoritativeType('accountability_consequences'), true);
      assert.equal(isServerAuthoritativeType('partner_verifications'), true);
      assert.equal(isServerAuthoritativeField('consequence_status'), true);
      assert.equal(isServerAuthoritativeField('breach_declared_at'), true);

      const client = {
        id: 'consequence-999',
        type: 'accountability_consequences' as unknown as 'tasks',
        data: { consequence_status: 'forgiven', penalty_executed: false },
        version: 5,
        client_updated_at: '2026-09-13T22:00:00.000Z',
        server_updated_at: '2026-09-13T20:00:00.000Z',
        is_dirty: true,
      };

      const resolution = resolveEntityConflict(client, {
        id: 'consequence-999',
        updated_at: '2026-09-13T21:00:00.000Z',
        data: { consequence_status: 'pending_penalty', penalty_executed: false },
      });

      assert.equal(resolution.strategy, 'REJECTED_SERVER_AUTHORITATIVE');
      assert.equal(resolution.hasConflict, true);
      assert.equal(resolution.resolvedData.consequence_status, 'pending_penalty');
    });

    it('sanitizes client sync payloads to prevent consequence leakage', () => {
      const payload = {
        title: 'Review commitment',
        consequence_status: 'breached',
        __private_penalty_key: 'secret-123',
        notes: 'Safe user note',
      };

      const sanitized = sanitizeClientSyncPayload('tasks', payload);
      assert.equal(sanitized.title, 'Review commitment');
      assert.equal(sanitized.notes, 'Safe user note');
      assert.equal('consequence_status' in sanitized, false);
      assert.equal('__private_penalty_key' in sanitized, false);
    });
  });

  describe('Sync Queue State Machine & Exponential Backoff', () => {
    it('calculates exponential backoff delays accurately', () => {
      assert.equal(calculateBackoffDelay(0), 1000);
      assert.equal(calculateBackoffDelay(1), 2000);
      assert.equal(calculateBackoffDelay(2), 4000);
      assert.equal(calculateBackoffDelay(3), 8000);
      assert.equal(calculateBackoffDelay(10), 30000); // capped at maxDelay
    });

    it('manages queue item lifecycle, idempotency, and retries', async () => {
      let queue = [
        createOfflineQueueItem('quick_task', { title: 'First Task', deadline_at: '2026-09-15T12:00:00Z' }, 'uuid-1'),
        createOfflineQueueItem('quick_thought', { content: 'Great idea' }, 'uuid-2'),
      ] as OfflineQueueItem[];

      // Re-adding duplicate item with same idempotency key is a no-op
      const duplicate = createOfflineQueueItem('quick_task', { title: 'Duplicate', deadline_at: '2026-09-15T12:00:00Z' }, 'uuid-1');
      queue = enqueueItem(queue, duplicate);
      assert.equal(queue.length, 2);

      // Process sync with mock dispatcher
      const summary = await processQueueSync(queue, async (item) => {
        if (item.id === 'uuid-1') {
          return { success: true };
        }
        return { success: false, error: 'Temporary network timeout' };
      });

      assert.equal(summary.processedCount, 2);
      assert.equal(summary.succeededCount, 1);
      assert.equal(summary.failedCount, 1);

      const pending = getPendingItems(summary.updatedQueue);
      assert.equal(pending.length, 1);
      assert.equal(pending[0].id, 'uuid-2');
      assert.equal(pending[0].retry_count, 1);
    });

    it('derives overall UI sync state accurately', () => {
      const item1 = createOfflineQueueItem('quick_task', { title: 'A', deadline_at: '2026-09-15T12:00:00Z' });
      assert.equal(deriveOverallSyncState(false, [item1]), 'offline');
      assert.equal(deriveOverallSyncState(true, [item1]), 'pending');

      item1.status = 'syncing';
      assert.equal(deriveOverallSyncState(true, [item1]), 'syncing');

      item1.status = 'failed';
      item1.retry_count = 3;
      assert.equal(deriveOverallSyncState(true, [item1]), 'failed');

      item1.status = 'synced';
      assert.equal(deriveOverallSyncState(true, [item1]), 'synced');
    });
  });
});

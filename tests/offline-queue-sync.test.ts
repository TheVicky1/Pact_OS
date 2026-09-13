import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOfflineQueueItem,
  enqueueItem,
  dequeueItem,
  updateItemStatus,
  getPendingItems,
  getFailedItems,
  generateClientUuid,
} from '../src/lib/offline/queue';
import {
  calculateBackoffDelay,
  processQueueSync,
  validateOfflinePayload,
} from '../src/lib/offline/sync-engine';

describe('Phase 8: Offline Queue & Sync Engine', () => {
  it('generates valid RFC 4122 UUIDs and creates structured offline queue items', () => {
    const uuid = generateClientUuid();
    assert.match(
      uuid,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'UUID must conform to RFC 4122 v4'
    );

    const item = createOfflineQueueItem('quick_task', {
      title: 'Write offline tests',
      deadline_at: new Date().toISOString(),
      priority: 'high',
    });

    assert.equal(item.type, 'quick_task');
    assert.equal(item.status, 'pending');
    assert.equal(item.retry_count, 0);
    assert.equal(item.last_error, null);
    assert.ok(item.idempotency_key.startsWith('offline_quick_task_'));
  });

  it('enforces idempotency and duplicate rejection in queue operations', () => {
    const item1 = createOfflineQueueItem('quick_thought', { content: 'Idea 1' }, 'test-uuid-1');
    const item2 = createOfflineQueueItem('quick_thought', { content: 'Idea 2' }, 'test-uuid-2');
    const duplicateItem1 = createOfflineQueueItem('quick_thought', { content: 'Idea 1 modified' }, 'test-uuid-1');

    let queue = enqueueItem([], item1);
    queue = enqueueItem(queue, item2);
    assert.equal(queue.length, 2);

    // Enqueue duplicate with identical idempotency key
    queue = enqueueItem(queue, duplicateItem1);
    assert.equal(queue.length, 2, 'Duplicate item with same idempotency key must not be added');

    // Dequeue item1
    queue = dequeueItem(queue, 'test-uuid-1');
    assert.equal(queue.length, 1);
    assert.equal(queue[0].id, 'test-uuid-2');
  });

  it('calculates deterministic exponential backoff delays', () => {
    assert.equal(calculateBackoffDelay(0), 1000);
    assert.equal(calculateBackoffDelay(1), 2000);
    assert.equal(calculateBackoffDelay(2), 4000);
    assert.equal(calculateBackoffDelay(3), 8000);
    assert.equal(calculateBackoffDelay(4), 16000);
    assert.equal(calculateBackoffDelay(5), 30000); // Capped at 30s
    assert.equal(calculateBackoffDelay(10), 30000);
  });

  it('reconciles state machine during synchronization with mock dispatcher', async () => {
    const itemSuccess = createOfflineQueueItem('quick_task', {
      title: 'Sync Success Task',
      deadline_at: new Date().toISOString(),
    }, 'item-success');

    const itemFail = createOfflineQueueItem('quick_task', {
      title: 'Sync Fail Task',
      deadline_at: new Date().toISOString(),
    }, 'item-fail');

    const queue = [itemSuccess, itemFail];

    const mockDispatcher = async (item: any) => {
      if (item.id === 'item-success') {
        return { success: true };
      }
      return { success: false, error: 'Database constraint error' };
    };

    const summary = await processQueueSync(queue, mockDispatcher);

    assert.equal(summary.processedCount, 2);
    assert.equal(summary.succeededCount, 1);
    assert.equal(summary.failedCount, 1);

    const syncedItem = summary.updatedQueue.find((i) => i.id === 'item-success');
    const failedItem = summary.updatedQueue.find((i) => i.id === 'item-fail');

    assert.equal(syncedItem?.status, 'synced');
    assert.equal(failedItem?.status, 'failed');
    assert.equal(failedItem?.retry_count, 1);
    assert.equal(failedItem?.last_error, 'Database constraint error');
  });

  it('validates offline payloads against type contracts', () => {
    const validTask = createOfflineQueueItem('quick_task', {
      title: 'Valid Task',
      deadline_at: new Date().toISOString(),
    });
    assert.equal(validateOfflinePayload(validTask), true);

    const invalidTask = createOfflineQueueItem('quick_task', {
      title: '   ',
      deadline_at: new Date().toISOString(),
    });
    assert.equal(validateOfflinePayload(invalidTask), false);

    const validExpense = createOfflineQueueItem('quick_expense', {
      amount_cents: 2500,
      date_str: '2026-09-13',
    });
    assert.equal(validateOfflinePayload(validExpense), true);

    const invalidExpense = createOfflineQueueItem('quick_expense', {
      amount_cents: 0,
      date_str: '2026-09-13',
    });
    assert.equal(validateOfflinePayload(invalidExpense), false);
  });
});

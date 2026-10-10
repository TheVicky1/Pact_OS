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
import type { OfflineQueueItem } from '../src/lib/offline/queue';
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

/**
 * Issue #509: explicit coverage for the exponential backoff retry strategy used by
 * the offline sync queue (`calculateBackoffDelay`, `baseDelay * 2^attempt`, max cap).
 * The assertions below pin the documented progression, the cap boundary, and the
 * interaction between `retry_count` and retry scheduling.
 */
describe('Offline sync — exponential backoff retry strategy', () => {
  const MAX_BACKOFF_MS = 30000;
  const BASE_DELAY_MS = 1000;

  const baseTaskPayload = () => ({
    title: 'Backoff retry task',
    deadline_at: new Date().toISOString(),
  });

  it('doubles the delay for attempts 1, 2 and 3', () => {
    assert.equal(calculateBackoffDelay(1), 2000);
    assert.equal(calculateBackoffDelay(2), 4000);
    assert.equal(calculateBackoffDelay(3), 8000);

    // Each step is exactly twice the previous one (exponential progression).
    assert.equal(calculateBackoffDelay(2), calculateBackoffDelay(1) * 2);
    assert.equal(calculateBackoffDelay(3), calculateBackoffDelay(2) * 2);
    assert.equal(calculateBackoffDelay(4), calculateBackoffDelay(3) * 2);
  });

  it('clamps the delay at the 30s maximum backoff cap', () => {
    // 2^4 * 1000 = 16000 is the last step that is still below the cap.
    assert.equal(calculateBackoffDelay(4), 16000);
    // 2^5 * 1000 = 32000 would exceed the cap, so it is clamped to 30000.
    assert.equal(calculateBackoffDelay(5), MAX_BACKOFF_MS);
    // Every later attempt stays pinned at the cap.
    for (const attempt of [6, 7, 10, 25, 40]) {
      assert.equal(
        calculateBackoffDelay(attempt),
        MAX_BACKOFF_MS,
        `attempt ${attempt} must be capped at ${MAX_BACKOFF_MS}ms`
      );
    }
  });

  it('stays monotonically non-decreasing and within [base, cap] bounds', () => {
    let previous = 0;
    for (let attempt = 0; attempt <= 20; attempt++) {
      const delay = calculateBackoffDelay(attempt);
      assert.ok(
        delay >= previous,
        `attempt ${attempt} (${delay}ms) must not be shorter than the previous delay (${previous}ms)`
      );
      assert.ok(delay >= BASE_DELAY_MS, `attempt ${attempt} must not go below the base delay`);
      assert.ok(delay <= MAX_BACKOFF_MS, `attempt ${attempt} must not exceed the cap`);
      previous = delay;
    }
  });

  it('treats negative retry counts as the first attempt', () => {
    // retry_count is never negative in the queue, but the helper must stay safe
    // rather than producing a sub-millisecond or negative delay.
    assert.equal(calculateBackoffDelay(-1), BASE_DELAY_MS);
    assert.equal(calculateBackoffDelay(-10), BASE_DELAY_MS);
    assert.equal(calculateBackoffDelay(0), BASE_DELAY_MS);
  });

  it('derives the retry delay from the queue item retry_count after each failure', async () => {
    const failingDispatcher = async () => ({ success: false, error: 'Network unreachable' });

    let queue: OfflineQueueItem[] = [createOfflineQueueItem('quick_task', baseTaskPayload(), 'backoff-item')];
    const observedDelays: number[] = [];

    for (let attempt = 1; attempt <= 3; attempt++) {
      const summary = await processQueueSync(queue, failingDispatcher);
      const item = summary.updatedQueue.find((i) => i.id === 'backoff-item')!;

      assert.equal(item.status, 'failed');
      assert.equal(item.retry_count, attempt, `retry_count must increment to ${attempt}`);
      observedDelays.push(calculateBackoffDelay(item.retry_count));
      queue = summary.updatedQueue;
    }

    assert.deepEqual(observedDelays, [2000, 4000, 8000]);
  });

  it('keeps the capped delay for an item that exhausts its retry budget', async () => {
    const failingDispatcher = async () => ({ success: false, error: 'Persistent failure' });

    let queue: OfflineQueueItem[] = [createOfflineQueueItem('quick_task', baseTaskPayload(), 'exhausted-item')];

    for (let attempt = 0; attempt < 3; attempt++) {
      queue = (await processQueueSync(queue, failingDispatcher)).updatedQueue;
    }

    const item = queue.find((i) => i.id === 'exhausted-item')!;
    assert.equal(item.retry_count, 3);
    // No longer eligible for another sync pass; it is a terminal failure now.
    assert.equal(getPendingItems(queue, 3).length, 0);
    assert.equal(getFailedItems(queue, 3).length, 1);
    // Attempts beyond the retry budget remain capped at 30s.
    assert.equal(calculateBackoffDelay(item.retry_count + 2), MAX_BACKOFF_MS);

    // Another sync pass schedules nothing: the item is a terminal failure.
    const nextPass = await processQueueSync(queue, failingDispatcher);
    assert.equal(nextPass.processedCount, 0);
    assert.equal(nextPass.updatedQueue.find((i) => i.id === 'exhausted-item')?.retry_count, 3);
  });
});

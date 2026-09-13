/**
 * PACT Phase 8: Pure Deterministic Offline Sync Engine
 * Reconciles offline pending queues against backend services with exponential backoff and idempotency.
 */

import {
  OfflineQueueItem,
  QuickTaskPayload,
  QuickExpensePayload,
  updateItemStatus,
  getPendingItems,
} from './queue';

export interface SyncDispatchResult {
  success: boolean;
  error?: string;
}

export type OfflineDispatcher = (
  item: OfflineQueueItem
) => Promise<SyncDispatchResult>;

export interface SyncProcessSummary {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  updatedQueue: OfflineQueueItem[];
}

/**
 * Calculates exponential backoff in milliseconds.
 * 0 retries -> 1000ms
 * 1 retry -> 2000ms
 * 2 retries -> 4000ms
 * Max: 30000ms
 */
export function calculateBackoffDelay(retryCount: number): number {
  const base = 1000;
  const maxDelay = 30000;
  return Math.min(base * Math.pow(2, Math.max(0, retryCount)), maxDelay);
}

/**
 * Pure function: Synchronizes all eligible pending items in the offline queue.
 * Updates item statuses and retry counts without mutating the original array.
 */
export async function processQueueSync(
  currentQueue: OfflineQueueItem[],
  dispatcher: OfflineDispatcher,
  maxRetries: number = 3
): Promise<SyncProcessSummary> {
  const eligibleItems = getPendingItems(currentQueue, maxRetries);
  let updatedQueue = [...currentQueue];
  let succeededCount = 0;
  let failedCount = 0;

  for (const item of eligibleItems) {
    // 1. Mark item as syncing
    updatedQueue = updateItemStatus(updatedQueue, item.id, {
      status: 'syncing',
    });

    try {
      // 2. Dispatch to server action/handler
      const result = await dispatcher(item);

      if (result.success) {
        // 3. Mark as synced
        updatedQueue = updateItemStatus(updatedQueue, item.id, {
          status: 'synced',
          last_error: null,
        });
        succeededCount++;
      } else {
        // 4. Mark as failed with incremented retry count
        const nextRetry = item.retry_count + 1;
        updatedQueue = updateItemStatus(updatedQueue, item.id, {
          status: 'failed',
          retry_count: nextRetry,
          last_error: result.error || 'Server rejected offline item.',
        });
        failedCount++;
      }
    } catch (err: unknown) {
      const nextRetry = item.retry_count + 1;
      const errorMsg = err instanceof Error ? err.message : 'Network/Sync execution error';
      updatedQueue = updateItemStatus(updatedQueue, item.id, {
        status: 'failed',
        retry_count: nextRetry,
        last_error: errorMsg,
      });
      failedCount++;
    }
  }

  return {
    processedCount: eligibleItems.length,
    succeededCount,
    failedCount,
    updatedQueue,
  };
}

/**
 * Validates payload schema before enqueueing.
 */
export function validateOfflinePayload(item: OfflineQueueItem): boolean {
  if (!item.id || !item.type || !item.idempotency_key) {
    return false;
  }

  if (item.type === 'quick_task') {
    const p = item.payload as QuickTaskPayload;
    return typeof p.title === 'string' && p.title.trim().length > 0 && typeof p.deadline_at === 'string';
  }

  if (item.type === 'quick_expense') {
    const p = item.payload as QuickExpensePayload;
    return typeof p.amount_cents === 'number' && p.amount_cents > 0 && typeof p.date_str === 'string';
  }

  if (item.type === 'quick_thought') {
    const p = item.payload as { content: string };
    return typeof p.content === 'string' && p.content.trim().length > 0;
  }

  return false;
}

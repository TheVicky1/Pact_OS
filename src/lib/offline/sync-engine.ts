/**
 * PACT Phase 9: Pure Deterministic Offline Sync Engine
 * Reconciles offline pending queues and local entity caches against backend services
 * with exponential backoff, conflict detection, and idempotency.
 */

import {
  OfflineQueueItem,
  QuickTaskPayload,
  QuickExpensePayload,
  updateItemStatus,
  getPendingItems,
} from './queue';
import {
  CachedEntity,
  getDirtyEntities,
  markEntitySynced,
} from './local-cache';
import {
  resolveEntityConflict,
  ConflictResolutionResult,
} from './conflict-engine';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'pending' | 'conflict' | 'failed';

export interface SyncDispatchResult {
  success: boolean;
  error?: string;
  serverUpdatedAt?: string;
  conflict?: boolean;
}

export type OfflineDispatcher = (
  item: OfflineQueueItem
) => Promise<SyncDispatchResult>;

export type EntitySyncDispatcher = (
  entity: CachedEntity
) => Promise<{
  success: boolean;
  serverRecord?: { id: string; updated_at: string; data: Record<string, unknown> };
  error?: string;
}>;

export interface SyncProcessSummary {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  conflictCount: number;
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
  let conflictCount = 0;

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
        if (result.conflict) {
          conflictCount++;
        }
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
    conflictCount,
    updatedQueue,
  };
}

/**
 * Pure function: Synchronizes dirty cached entities against server endpoints with conflict detection.
 */
export async function processEntityCacheSync(
  dispatcher: EntitySyncDispatcher
): Promise<{
  synced: number;
  conflicts: number;
  failed: number;
  resolutions: ConflictResolutionResult[];
}> {
  const dirtyEntities = getDirtyEntities();
  let synced = 0;
  let conflicts = 0;
  let failed = 0;
  const resolutions: ConflictResolutionResult[] = [];

  for (const entity of dirtyEntities) {
    try {
      const res = await dispatcher(entity);
      if (res.success && res.serverRecord) {
        const conflictResolution = resolveEntityConflict(entity, res.serverRecord);
        resolutions.push(conflictResolution);

        if (conflictResolution.hasConflict) {
          conflicts++;
        }

        if (conflictResolution.strategy !== 'REJECTED_SERVER_AUTHORITATIVE') {
          markEntitySynced(entity.type, entity.id, res.serverRecord.updated_at);
          synced++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return {
    synced,
    conflicts,
    failed,
    resolutions,
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

/**
 * Determines overall sync state for UI indicators.
 */
export function deriveOverallSyncState(
  isOnline: boolean,
  queue: OfflineQueueItem[]
): SyncState {
  if (!isOnline) return 'offline';
  if (queue.some((i) => i.status === 'syncing')) return 'syncing';
  if (queue.some((i) => i.status === 'failed' && i.retry_count >= 3)) return 'failed';
  if (queue.some((i) => i.status === 'pending')) return 'pending';
  return 'synced';
}

/**
 * PACT Phase 8: Offline Queue Data Structures & State Machine
 * Deterministic queue management for tasks, thoughts, and financial expenses captured offline.
 */

export type OfflineItemType = 'quick_task' | 'quick_thought' | 'quick_expense';
export type OfflineItemStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QuickTaskPayload {
  title: string;
  deadline_at: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  description?: string | null;
  project_id?: string | null;
  goal_id?: string | null;
}

export interface QuickThoughtPayload {
  content: string;
  tags?: string[];
}

export interface QuickExpensePayload {
  amount_cents: number;
  category_id?: string | null;
  category_name?: string | null;
  note?: string | null;
  date_str: string;
}

export type OfflinePayload = QuickTaskPayload | QuickThoughtPayload | QuickExpensePayload;

export interface OfflineQueueItem<T = OfflinePayload> {
  id: string; // RFC 4122 UUID v4
  type: OfflineItemType;
  payload: T;
  status: OfflineItemStatus;
  client_timestamp: string; // ISO 8601 UTC
  retry_count: number;
  last_error: string | null;
  idempotency_key: string;
}

/**
 * Generate standard RFC 4122 UUID v4
 */
export function generateClientUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback RFC 4122 compliant UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a structured OfflineQueueItem with deterministic idempotency key.
 */
export function createOfflineQueueItem<T extends OfflinePayload>(
  type: OfflineItemType,
  payload: T,
  customId?: string
): OfflineQueueItem<T> {
  const id = customId || generateClientUuid();
  const timestamp = new Date().toISOString();
  return {
    id,
    type,
    payload,
    status: 'pending',
    client_timestamp: timestamp,
    retry_count: 0,
    last_error: null,
    idempotency_key: `offline_${type}_${id}`,
  };
}

/**
 * Pure helper: Enqueues a new item, avoiding exact duplicate idempotency keys.
 */
export function enqueueItem(
  queue: OfflineQueueItem[],
  newItem: OfflineQueueItem
): OfflineQueueItem[] {
  const exists = queue.some((item) => item.idempotency_key === newItem.idempotency_key);
  if (exists) {
    return queue;
  }
  return [...queue, newItem];
}

/**
 * Pure helper: Removes an item by ID from the queue.
 */
export function dequeueItem(queue: OfflineQueueItem[], id: string): OfflineQueueItem[] {
  return queue.filter((item) => item.id !== id);
}

/**
 * Pure helper: Updates the status and error details of an item in the queue.
 */
export function updateItemStatus(
  queue: OfflineQueueItem[],
  id: string,
  updates: Partial<Pick<OfflineQueueItem, 'status' | 'retry_count' | 'last_error'>>
): OfflineQueueItem[] {
  return queue.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        ...updates,
      };
    }
    return item;
  });
}

/**
 * Filters items ready for synchronization (status is 'pending' or 'failed' with retry capacity).
 */
export function getPendingItems(
  queue: OfflineQueueItem[],
  maxRetries: number = 3
): OfflineQueueItem[] {
  return queue.filter(
    (item) => item.status === 'pending' || (item.status === 'failed' && item.retry_count < maxRetries)
  );
}

/**
 * Filters items that have permanently failed after max retries.
 */
export function getFailedItems(
  queue: OfflineQueueItem[],
  maxRetries: number = 3
): OfflineQueueItem[] {
  return queue.filter(
    (item) => item.status === 'failed' && item.retry_count >= maxRetries
  );
}

/**
 * PACT Phase 8: Durable Client-Side Offline Storage
 * High-durability client storage abstraction with localStorage persistence and in-memory fallback.
 */

import { OfflineQueueItem } from './queue';

const STORAGE_KEY = 'pact_offline_sync_queue_v1';

export interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

class MemoryStorageAdapter implements StorageAdapter {
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

let activeAdapter: StorageAdapter = new MemoryStorageAdapter();

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const testKey = '__pact_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    activeAdapter = window.localStorage;
  } catch {
    // In private browsing or quota-exceeded modes, fall back to MemoryStorageAdapter
    activeAdapter = new MemoryStorageAdapter();
  }
}

/**
 * Set custom storage adapter (useful for testing or custom environments).
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}

/**
 * Loads the current offline queue from durable storage.
 */
export function loadOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = activeAdapter.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as OfflineQueueItem[];
    }
    return [];
  } catch (error) {
    console.warn('[PACT Offline Storage] Failed to parse offline queue, initializing empty:', error);
    return [];
  }
}

/**
 * Persists the offline queue to durable storage.
 */
export function persistOfflineQueue(queue: OfflineQueueItem[]): boolean {
  try {
    activeAdapter.setItem(STORAGE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('[PACT Offline Storage] Failed to persist offline queue:', error);
    return false;
  }
}

/**
 * Clears the stored offline queue.
 */
export function clearStoredOfflineQueue(): void {
  try {
    activeAdapter.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[PACT Offline Storage] Failed to clear offline queue:', error);
  }
}

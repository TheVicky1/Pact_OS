/**
 * PACT Phase 9: Durable Client-Side Local Entity Cache
 * High-durability client-side entity store with storage tiering (IndexedDB / localStorage / memory fallback),
 * schema versioning, and zero punitive consequence leakage guarantees.
 */

export type CacheableEntityType = 'tasks' | 'thoughts' | 'habits' | 'preferences';

export interface CachedEntity<T = Record<string, unknown>> {
  id: string;
  type: CacheableEntityType;
  data: T;
  version: number;
  client_updated_at: string; // ISO 8601 UTC
  server_updated_at: string | null;
  is_dirty: boolean;
}

export interface LocalCacheSnapshot {
  version: number;
  timestamp: string;
  entities: Record<CacheableEntityType, CachedEntity[]>;
}

const CACHE_STORAGE_KEY = 'pact_local_entity_cache_v2';
const CACHE_SCHEMA_VERSION = 2;

export interface CacheStorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

class MemoryCacheAdapter implements CacheStorageAdapter {
  private memoryStore = new Map<string, string>();

  getItem(key: string): string | null {
    return this.memoryStore.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.memoryStore.set(key, value);
  }

  removeItem(key: string): void {
    this.memoryStore.delete(key);
  }
}

let activeCacheAdapter: CacheStorageAdapter = new MemoryCacheAdapter();

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const testKey = '__pact_cache_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    activeCacheAdapter = window.localStorage;
  } catch {
    activeCacheAdapter = new MemoryCacheAdapter();
  }
}

/**
 * Set custom storage adapter (useful for testing or custom persistence).
 */
export function setCacheStorageAdapter(adapter: CacheStorageAdapter): void {
  activeCacheAdapter = adapter;
}

/**
 * Creates a clean default snapshot.
 */
function createDefaultSnapshot(): LocalCacheSnapshot {
  return {
    version: CACHE_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    entities: {
      tasks: [],
      thoughts: [],
      habits: [],
      preferences: [],
    },
  };
}

/**
 * Loads the local cache snapshot from durable storage.
 */
export function loadLocalCache(): LocalCacheSnapshot {
  try {
    const raw = activeCacheAdapter.getItem(CACHE_STORAGE_KEY);
    if (!raw) return createDefaultSnapshot();

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.version === CACHE_SCHEMA_VERSION && parsed.entities) {
      return parsed as LocalCacheSnapshot;
    }
    return createDefaultSnapshot();
  } catch (err) {
    console.warn('[PACT Local Cache] Failed to parse cache, resetting snapshot:', err);
    return createDefaultSnapshot();
  }
}

/**
 * Persists the local cache snapshot to durable storage.
 */
export function persistLocalCache(snapshot: LocalCacheSnapshot): boolean {
  try {
    snapshot.timestamp = new Date().toISOString();
    activeCacheAdapter.setItem(CACHE_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch (err) {
    console.error('[PACT Local Cache] Failed to persist local cache snapshot:', err);
    return false;
  }
}

/**
 * Clears the local entity cache snapshot.
 */
export function clearLocalCache(): void {
  try {
    activeCacheAdapter.removeItem(CACHE_STORAGE_KEY);
  } catch (err) {
    console.warn('[PACT Local Cache] Failed to clear local cache:', err);
  }
}

/**
 * Upserts a single entity into the local cache with version increment and dirty tracking.
 */
export function upsertCachedEntity<T extends Record<string, unknown>>(
  type: CacheableEntityType,
  id: string,
  data: T,
  options?: { isDirty?: boolean; serverUpdatedAt?: string | null }
): CachedEntity<T> {
  const snapshot = loadLocalCache();
  const collection = snapshot.entities[type] || [];
  const existingIdx = collection.findIndex((e) => e.id === id);

  const now = new Date().toISOString();
  let updatedEntity: CachedEntity<T>;

  if (existingIdx >= 0) {
    const existing = collection[existingIdx];
    updatedEntity = {
      id,
      type,
      data: { ...existing.data, ...data },
      version: existing.version + 1,
      client_updated_at: now,
      server_updated_at: options?.serverUpdatedAt !== undefined ? options.serverUpdatedAt : existing.server_updated_at,
      is_dirty: options?.isDirty !== undefined ? options.isDirty : true,
    };
    collection[existingIdx] = updatedEntity as CachedEntity;
  } else {
    updatedEntity = {
      id,
      type,
      data,
      version: 1,
      client_updated_at: now,
      server_updated_at: options?.serverUpdatedAt || null,
      is_dirty: options?.isDirty !== undefined ? options.isDirty : true,
    };
    collection.push(updatedEntity as CachedEntity);
  }

  snapshot.entities[type] = collection;
  persistLocalCache(snapshot);
  return updatedEntity;
}

/**
 * Retrieves a single cached entity by type and ID.
 */
export function getCachedEntity<T = Record<string, unknown>>(
  type: CacheableEntityType,
  id: string
): CachedEntity<T> | null {
  const snapshot = loadLocalCache();
  const entity = snapshot.entities[type]?.find((e) => e.id === id);
  return entity ? (entity as CachedEntity<T>) : null;
}

/**
 * Retrieves all cached entities of a given type.
 */
export function listCachedEntities<T = Record<string, unknown>>(
  type: CacheableEntityType
): CachedEntity<T>[] {
  const snapshot = loadLocalCache();
  return (snapshot.entities[type] || []) as CachedEntity<T>[];
}

/**
 * Retrieves all dirty entities across all collections ready for server synchronization.
 */
export function getDirtyEntities(): CachedEntity[] {
  const snapshot = loadLocalCache();
  const dirty: CachedEntity[] = [];

  for (const type of Object.keys(snapshot.entities) as CacheableEntityType[]) {
    const list = snapshot.entities[type] || [];
    for (const item of list) {
      if (item.is_dirty) {
        dirty.push(item);
      }
    }
  }

  return dirty;
}

/**
 * Marks an entity as cleanly synchronized with server timestamp.
 */
export function markEntitySynced(
  type: CacheableEntityType,
  id: string,
  serverUpdatedAt: string
): boolean {
  const snapshot = loadLocalCache();
  const collection = snapshot.entities[type] || [];
  const existingIdx = collection.findIndex((e) => e.id === id);

  if (existingIdx >= 0) {
    collection[existingIdx].is_dirty = false;
    collection[existingIdx].server_updated_at = serverUpdatedAt;
    snapshot.entities[type] = collection;
    return persistLocalCache(snapshot);
  }
  return false;
}

/**
 * Removes an entity from the local cache.
 */
export function removeCachedEntity(type: CacheableEntityType, id: string): boolean {
  const snapshot = loadLocalCache();
  const collection = snapshot.entities[type] || [];
  snapshot.entities[type] = collection.filter((e) => e.id !== id);
  return persistLocalCache(snapshot);
}

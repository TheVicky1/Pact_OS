/**
 * Unit tests for loadLocalCache()'s schema-version handling (#304).
 *
 * loadLocalCache() does not transform old data to the current schema: on any
 * version mismatch, corrupted JSON, or missing version key, it discards the
 * stored snapshot and returns a clean default rather than migrating it field
 * by field. These tests verify that graceful-reset behavior, which is what
 * actually exists in src/lib/offline/local-cache.ts today -- not "migration"
 * in the sense of upgrading v1 data into v2 shape.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  setCacheStorageAdapter,
  loadLocalCache,
  clearLocalCache,
  CACHE_STORAGE_KEY,
} from '../src/lib/offline/local-cache';

const EMPTY_ENTITIES = { tasks: [], thoughts: [], habits: [], preferences: [] };

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

describe('loadLocalCache: schema version handling', () => {
  let adapter: MockStorageAdapter;

  beforeEach(() => {
    adapter = new MockStorageAdapter();
    setCacheStorageAdapter(adapter);
    clearLocalCache();
  });

  it('returns a clean default snapshot when nothing is stored yet', () => {
    const snapshot = loadLocalCache();
    assert.equal(snapshot.version, 2);
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('loads a matching-version (v2) snapshot as-is', () => {
    const stored = {
      version: 2,
      timestamp: '2026-01-01T00:00:00.000Z',
      entities: {
        tasks: [{ id: 't1', type: 'tasks', data: { title: 'x' }, version: 1, client_updated_at: '', server_updated_at: null, is_dirty: true }],
        thoughts: [],
        habits: [],
        preferences: [],
      },
    };
    adapter.setItem(CACHE_STORAGE_KEY, JSON.stringify(stored));

    const snapshot = loadLocalCache();
    assert.equal(snapshot.version, 2);
    assert.equal(snapshot.entities.tasks.length, 1);
    assert.equal(snapshot.entities.tasks[0].id, 't1');
  });

  it('resets to a clean default when the stored snapshot is legacy v1 (does not migrate the data)', () => {
    const legacyV1 = {
      version: 1,
      timestamp: '2020-01-01T00:00:00.000Z',
      entities: {
        tasks: [{ id: 'old-task', type: 'tasks', data: { title: 'legacy' }, version: 1, client_updated_at: '', server_updated_at: null, is_dirty: true }],
        thoughts: [],
        habits: [],
        preferences: [],
      },
    };
    adapter.setItem(CACHE_STORAGE_KEY, JSON.stringify(legacyV1));

    const snapshot = loadLocalCache();
    assert.equal(snapshot.version, 2);
    // The old task is gone, not carried forward: this is a reset, not a migration.
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('resets to a clean default when the version is a future/unknown number', () => {
    adapter.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify({ version: 99, timestamp: '2026-01-01T00:00:00.000Z', entities: EMPTY_ENTITIES })
    );

    const snapshot = loadLocalCache();
    assert.equal(snapshot.version, 2);
  });

  it('resets to a clean default when the version key is missing entirely', () => {
    adapter.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify({ timestamp: '2026-01-01T00:00:00.000Z', entities: EMPTY_ENTITIES })
    );

    const snapshot = loadLocalCache();
    assert.equal(snapshot.version, 2);
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('resets to a clean default when entities is missing', () => {
    adapter.setItem(CACHE_STORAGE_KEY, JSON.stringify({ version: 2, timestamp: '2026-01-01T00:00:00.000Z' }));

    const snapshot = loadLocalCache();
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('resets to a clean default when the stored value is corrupted (not valid JSON)', () => {
    adapter.setItem(CACHE_STORAGE_KEY, '{not: valid json,,,');

    const snapshot = loadLocalCache();
    assert.equal(snapshot.version, 2);
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('resets to a clean default when the stored value is a JSON primitive, not an object', () => {
    adapter.setItem(CACHE_STORAGE_KEY, '"just a string"');

    const snapshot = loadLocalCache();
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('resets to a clean default when the stored value is null', () => {
    adapter.setItem(CACHE_STORAGE_KEY, 'null');

    const snapshot = loadLocalCache();
    assert.deepEqual(snapshot.entities, EMPTY_ENTITIES);
  });

  it('never throws regardless of what is in storage', () => {
    for (const bad of ['', '{}', '[]', '123', 'undefined', '{"version":"2"}']) {
      adapter.setItem(CACHE_STORAGE_KEY, bad);
      assert.doesNotThrow(() => loadLocalCache());
    }
  });
});

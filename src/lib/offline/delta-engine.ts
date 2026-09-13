/**
 * PACT Phase 13: Multi-Device Delta Replication Engine
 * Lightweight, deterministic delta-based replication protocol for multi-device synchronization.
 * Supports Lamport logical clocks, monotonic sync cursors, operation deduplication, tombstones,
 * and zero punitive consequence leakage guarantees.
 */

import { isServerAuthoritativeField, isServerAuthoritativeType } from './conflict-engine';

export type ReplicationEntityType =
  | 'tasks'
  | 'thoughts'
  | 'habits'
  | 'focus_logs'
  | 'sunset_drafts'
  | 'preferences';

export type DeltaAction = 'UPSERT' | 'DELETE';

export interface SyncDelta {
  opId: string; // Unique operation ID (e.g., op_xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  deviceId: string; // Unique originating device identifier
  entityType: ReplicationEntityType;
  entityId: string; // Primary key of the entity
  action: DeltaAction;
  version: number;
  logicalClock: number; // Lamport timestamp
  clientTimestamp: string; // ISO 8601 UTC
  payload: Record<string, unknown>; // Changed fields or full record (empty if DELETE)
  tombstone: boolean;
}

export interface DeltaSyncBatchRequest {
  deviceId: string;
  deviceName?: string;
  clientType?: 'web_desktop' | 'web_mobile' | 'pwa' | 'native_companion';
  sinceCursor: string | null; // Server timestamp cursor or ISO string
  deltas: SyncDelta[];
}

export interface DeltaSyncBatchResponse {
  success: boolean;
  newCursor: string;
  appliedOpIds: string[];
  rejectedOpIds: Array<{ opId: string; reason: string }>;
  serverDeltas: SyncDelta[];
  conflictsResolved: number;
  serverTimestamp: string;
}

const ALLOWED_REPLICATION_TYPES = new Set<string>([
  'tasks',
  'thoughts',
  'habits',
  'focus_logs',
  'sunset_drafts',
  'preferences',
]);

/**
 * Validates if an entity type is safe for client-initiated multi-device replication.
 */
export function isSafeReplicationType(type: string): boolean {
  if (isServerAuthoritativeType(type)) {
    return false;
  }
  return ALLOWED_REPLICATION_TYPES.has(type);
}

/**
 * Generates an RFC 4122 compliant UUID v4 string for operation IDs and device IDs.
 */
export function generateReplicationUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitizes delta payload to ensure zero private consequences or server-authoritative fields.
 */
export function sanitizeDeltaPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!isServerAuthoritativeField(key) && !key.startsWith('__private_') && !key.startsWith('consequence_')) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Creates a structured SyncDelta with Lamport clock and payload sanitization.
 */
export function createSyncDelta(params: {
  deviceId: string;
  entityType: ReplicationEntityType;
  entityId: string;
  action: DeltaAction;
  version: number;
  logicalClock: number;
  payload?: Record<string, unknown>;
  opId?: string;
  clientTimestamp?: string;
}): SyncDelta {
  const opId = params.opId || `op_${generateReplicationUuid()}`;
  const clientTimestamp = params.clientTimestamp || new Date().toISOString();
  const isDelete = params.action === 'DELETE';
  const cleanPayload = isDelete ? {} : sanitizeDeltaPayload(params.payload || {});

  return {
    opId,
    deviceId: params.deviceId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    version: Math.max(1, params.version),
    logicalClock: Math.max(1, params.logicalClock),
    clientTimestamp,
    payload: cleanPayload,
    tombstone: isDelete,
  };
}

/**
 * Deterministically merges two deltas for the same entity across devices.
 * Implements deterministic convergence:
 * 1. Higher Lamport logicalClock wins.
 * 2. If logicalClock ties, higher clientTimestamp wins.
 * 3. If clientTimestamp ties, deterministic deviceId tie-breaker (lexicographical comparison).
 */
export function mergeDeltas(deltaA: SyncDelta, deltaB: SyncDelta): {
  winningDelta: SyncDelta;
  mergedPayload: Record<string, unknown>;
  isConflict: boolean;
} {
  if (deltaA.entityId !== deltaB.entityId) {
    throw new Error(`Cannot merge deltas for distinct entity IDs: ${deltaA.entityId} vs ${deltaB.entityId}`);
  }

  // Handle deletions: Tombstone with higher or equal clock wins
  if (deltaA.tombstone || deltaB.tombstone) {
    const winning = compareDeltas(deltaA, deltaB) >= 0 ? deltaA : deltaB;
    return {
      winningDelta: winning,
      mergedPayload: {},
      isConflict: true,
    };
  }

  // Field-level merge for collaborative safe entities
  const mergedPayload: Record<string, unknown> = { ...deltaA.payload };
  let isConflict = false;

  const compareResult = compareDeltas(deltaA, deltaB);
  const primary = compareResult >= 0 ? deltaA : deltaB;
  const secondary = compareResult < 0 ? deltaA : deltaB;

  for (const [key, secVal] of Object.entries(secondary.payload)) {
    if (primary.payload[key] === undefined) {
      mergedPayload[key] = secVal;
    } else if (JSON.stringify(primary.payload[key]) !== JSON.stringify(secVal)) {
      // Divergence detected - primary wins
      mergedPayload[key] = primary.payload[key];
      isConflict = true;
    }
  }

  return {
    winningDelta: primary,
    mergedPayload,
    isConflict,
  };
}

/**
 * Comparison helper for deterministic delta ordering.
 * Returns > 0 if A > B, < 0 if A < B, 0 if equal.
 */
export function compareDeltas(a: SyncDelta, b: SyncDelta): number {
  if (a.logicalClock !== b.logicalClock) {
    return a.logicalClock - b.logicalClock;
  }
  const timeA = new Date(a.clientTimestamp).getTime();
  const timeB = new Date(b.clientTimestamp).getTime();
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  // Deterministic device ID tie-breaker
  return a.deviceId.localeCompare(b.deviceId);
}

/**
 * Calculates updated Lamport clock given local clock and received remote delta clock.
 */
export function calculateNextLamportClock(localClock: number, receivedClock: number): number {
  return Math.max(localClock, receivedClock) + 1;
}

/**
 * PACT Phase 9: Pure Deterministic Offline Conflict Engine
 * Implements deterministic Last-Write-Wins (LWW) conflict detection, safe field-level merging,
 * and strict server-authoritative security boundaries.
 */

import { CachedEntity, CacheableEntityType } from './local-cache';

export type ConflictResolutionStrategy =
  | 'NO_CONFLICT'
  | 'CLIENT_WINS_LWW'
  | 'SERVER_WINS_LWW'
  | 'SAFE_FIELD_MERGE'
  | 'REJECTED_SERVER_AUTHORITATIVE'
  | 'MANUAL_RESOLUTION_REQUIRED';

export interface ConflictResolutionResult<T = Record<string, unknown>> {
  strategy: ConflictResolutionStrategy;
  resolvedData: T;
  hasConflict: boolean;
  reason: string;
  mergedAt: string; // ISO 8601 UTC
}

/**
 * Restricted domain tables/fields that CANNOT be overridden by offline client state.
 * These are strictly server-authoritative.
 */
const SERVER_AUTHORITATIVE_TYPES = new Set<string>([
  'accountability_consequences',
  'accountability_verifications',
  'financial_transactions',
  'partner_verifications',
  'auth_sessions',
]);

const SERVER_AUTHORITATIVE_FIELDS = new Set<string>([
  'consequence_status',
  'breach_declared_at',
  'partner_id',
  'amount_cents_verified',
  'verification_status',
  'penalty_executed',
]);

/**
 * Checks whether an entity type is strictly server-authoritative.
 */
export function isServerAuthoritativeType(type: string): boolean {
  return SERVER_AUTHORITATIVE_TYPES.has(type);
}

/**
 * Checks whether a field is strictly server-authoritative.
 */
export function isServerAuthoritativeField(field: string): boolean {
  return SERVER_AUTHORITATIVE_FIELDS.has(field);
}

/**
 * Pure function: Resolves conflicts between client cached entity and server state using deterministic LWW.
 */
export function resolveEntityConflict<T extends Record<string, unknown>>(
  clientEntity: CachedEntity<T>,
  serverRecord: {
    id: string;
    updated_at: string;
    data: T;
    is_deleted?: boolean;
    status?: string;
  }
): ConflictResolutionResult<T> {
  const mergedAt = new Date().toISOString();

  // 1. Check if entity type is server-authoritative
  if (isServerAuthoritativeType(clientEntity.type)) {
    return {
      strategy: 'REJECTED_SERVER_AUTHORITATIVE',
      resolvedData: serverRecord.data,
      hasConflict: true,
      reason: `Entity type '${clientEntity.type}' is strictly server-authoritative and cannot be modified offline.`,
      mergedAt,
    };
  }

  // 2. Check if server entity was deleted/archived permanently
  if (serverRecord.is_deleted || serverRecord.status === 'archived') {
    return {
      strategy: 'SERVER_WINS_LWW',
      resolvedData: serverRecord.data,
      hasConflict: true,
      reason: 'Server entity has been closed, archived, or deleted.',
      mergedAt,
    };
  }

  // 3. Compare timestamps for deterministic Last-Write-Wins (LWW)
  const clientTime = new Date(clientEntity.client_updated_at).getTime();
  const serverTime = new Date(serverRecord.updated_at).getTime();

  // If client timestamp is equal to or older than server and not dirty, no conflict
  if (!clientEntity.is_dirty && clientTime <= serverTime) {
    return {
      strategy: 'NO_CONFLICT',
      resolvedData: serverRecord.data,
      hasConflict: false,
      reason: 'Client entity is already synchronized with server record.',
      mergedAt,
    };
  }

  // 4. Safe field-level merge for clean divergence
  const mergedPayload: Record<string, unknown> = { ...serverRecord.data };
  let hasForbiddenFieldOverride = false;
  let overriddenFieldCount = 0;

  for (const [key, clientValue] of Object.entries(clientEntity.data)) {
    // Check for server-authoritative fields
    if (isServerAuthoritativeField(key)) {
      hasForbiddenFieldOverride = true;
      continue; // keep server value
    }

    const serverValue = serverRecord.data[key];

    if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
      if (clientTime > serverTime) {
        // Client write is newer
        mergedPayload[key] = clientValue;
        overriddenFieldCount++;
      }
    }
  }

  if (hasForbiddenFieldOverride && overriddenFieldCount === 0) {
    return {
      strategy: 'REJECTED_SERVER_AUTHORITATIVE',
      resolvedData: serverRecord.data,
      hasConflict: true,
      reason: 'Client mutation contained server-authoritative fields that were safely rejected.',
      mergedAt,
    };
  }

  if (clientTime >= serverTime) {
    return {
      strategy: overriddenFieldCount > 0 ? 'CLIENT_WINS_LWW' : 'NO_CONFLICT',
      resolvedData: mergedPayload as T,
      hasConflict: overriddenFieldCount > 0,
      reason: `Client state applied deterministically via Last-Write-Wins (${overriddenFieldCount} fields updated).`,
      mergedAt,
    };
  }

  return {
    strategy: 'SERVER_WINS_LWW',
    resolvedData: serverRecord.data,
    hasConflict: true,
    reason: 'Server record has newer timestamp than client mutation.',
    mergedAt,
  };
}

/**
 * Validates whether a local mutation can be safely dispatched to server without consequence leakage.
 */
export function sanitizeClientSyncPayload<T extends Record<string, unknown>>(
  type: CacheableEntityType,
  data: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Strip private internal consequence tokens or server-authoritative fields
    if (!isServerAuthoritativeField(key) && !key.startsWith('__private_')) {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

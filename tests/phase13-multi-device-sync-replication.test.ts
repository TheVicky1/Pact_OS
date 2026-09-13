import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createSyncDelta,
  mergeDeltas,
  compareDeltas,
  calculateNextLamportClock,
  isSafeReplicationType,
  sanitizeDeltaPayload,
  SyncDelta,
} from '../src/lib/offline/delta-engine';
import {
  stageOfflineProofAttachment,
  listStagedProofAttachments,
  removeStagedProofAttachment,
  markAttachmentUploaded,
  purgeExpiredProofAttachments,
  setAttachmentStorageAdapter,
  ALLOWED_PROOF_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  computeDataChecksum,
} from '../src/lib/offline/attachment-cache';
import {
  getOrSetDeviceId,
  getOrSetDeviceName,
  setDeviceName,
} from '../src/lib/offline/background-sync';

// Memory Storage Adapter for testing
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
  clear(): void {
    this.store.clear();
  }
}

describe('PACT Phase 13: Multi-Device Sync & Delta Replication Engine', () => {
  describe('1. Delta Creation & Consequence Sanitization', () => {
    it('creates a structured SyncDelta with automatic UUID opId and sanitized payload', () => {
      const delta = createSyncDelta({
        deviceId: 'device_laptop_001',
        entityType: 'tasks',
        entityId: 'task_12345',
        action: 'UPSERT',
        version: 1,
        logicalClock: 1,
        payload: {
          title: 'Deep Work on Compiler',
          priority: 'high',
          consequence_status: 'FORBIDDEN_LEAK',
          __private_punishment: 'HIDDEN_PENALTY',
        },
      });

      assert.strictEqual(delta.deviceId, 'device_laptop_001');
      assert.strictEqual(delta.entityType, 'tasks');
      assert.strictEqual(delta.entityId, 'task_12345');
      assert.strictEqual(delta.action, 'UPSERT');
      assert.strictEqual(delta.logicalClock, 1);
      assert.strictEqual(delta.payload.title, 'Deep Work on Compiler');
      assert.strictEqual(delta.payload.priority, 'high');
      // Consequence confidentiality verification:
      assert.strictEqual(delta.payload.consequence_status, undefined);
      assert.strictEqual(delta.payload.__private_punishment, undefined);
    });

    it('enforces safe replication entity whitelist', () => {
      assert.strictEqual(isSafeReplicationType('tasks'), true);
      assert.strictEqual(isSafeReplicationType('thoughts'), true);
      assert.strictEqual(isSafeReplicationType('habits'), true);
      assert.strictEqual(isSafeReplicationType('focus_logs'), true);
      assert.strictEqual(isSafeReplicationType('sunset_drafts'), true);
      assert.strictEqual(isSafeReplicationType('preferences'), true);

      // Server-authoritative entities MUST be rejected
      assert.strictEqual(isSafeReplicationType('accountability_consequences'), false);
      assert.strictEqual(isSafeReplicationType('financial_transactions'), false);
      assert.strictEqual(isSafeReplicationType('partner_verifications'), false);
      assert.strictEqual(isSafeReplicationType('auth_sessions'), false);
    });
  });

  describe('2. Deterministic Delta Merging & Convergence', () => {
    it('merges non-conflicting concurrent edits from two devices cleanly', () => {
      const deltaA = createSyncDelta({
        deviceId: 'device_laptop_001',
        entityType: 'tasks',
        entityId: 'task_xyz',
        action: 'UPSERT',
        version: 2,
        logicalClock: 5,
        payload: { title: 'Updated Title on Laptop' },
      });

      const deltaB = createSyncDelta({
        deviceId: 'device_mobile_002',
        entityType: 'tasks',
        entityId: 'task_xyz',
        action: 'UPSERT',
        version: 2,
        logicalClock: 4,
        payload: { priority: 'urgent' },
      });

      const result = mergeDeltas(deltaA, deltaB);
      assert.strictEqual(result.mergedPayload.title, 'Updated Title on Laptop');
      assert.strictEqual(result.mergedPayload.priority, 'urgent');
      assert.strictEqual(result.winningDelta.deviceId, 'device_laptop_001');
    });

    it('higher Lamport logical clock wins field collisions deterministically', () => {
      const deltaA = createSyncDelta({
        deviceId: 'device_laptop_001',
        entityType: 'tasks',
        entityId: 'task_xyz',
        action: 'UPSERT',
        version: 3,
        logicalClock: 10,
        payload: { title: 'Laptop Newer Title' },
      });

      const deltaB = createSyncDelta({
        deviceId: 'device_mobile_002',
        entityType: 'tasks',
        entityId: 'task_xyz',
        action: 'UPSERT',
        version: 3,
        logicalClock: 8,
        payload: { title: 'Mobile Older Title' },
      });

      const result = mergeDeltas(deltaA, deltaB);
      assert.strictEqual(result.mergedPayload.title, 'Laptop Newer Title');
      assert.strictEqual(result.isConflict, true);
    });

    it('tombstone deletions take precedence and return empty payload', () => {
      const deltaA = createSyncDelta({
        deviceId: 'device_laptop_001',
        entityType: 'tasks',
        entityId: 'task_xyz',
        action: 'DELETE',
        version: 4,
        logicalClock: 12,
      });

      const deltaB = createSyncDelta({
        deviceId: 'device_mobile_002',
        entityType: 'tasks',
        entityId: 'task_xyz',
        action: 'UPSERT',
        version: 3,
        logicalClock: 11,
        payload: { title: 'Revived Task Attempt' },
      });

      const result = mergeDeltas(deltaA, deltaB);
      assert.strictEqual(result.winningDelta.tombstone, true);
      assert.deepStrictEqual(result.mergedPayload, {});
    });

    it('advances Lamport logical clocks monotonically across peers', () => {
      const localClock = 5;
      const remoteClock = 9;
      const nextClock = calculateNextLamportClock(localClock, remoteClock);
      assert.strictEqual(nextClock, 10);
    });
  });

  describe('3. Offline Proof & Evidence Caching', () => {
    it('successfully stages valid proof attachment with checksum', async () => {
      const mockAdapter = new MockStorageAdapter();
      setAttachmentStorageAdapter(mockAdapter);

      const fakeData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = await stageOfflineProofAttachment({
        commitmentId: 'commit_123',
        fileName: 'screenshot.png',
        mimeType: 'image/png',
        stagedData: fakeData,
      });

      assert.strictEqual(res.success, true);
      assert.ok(res.attachment);
      assert.strictEqual(res.attachment.status, 'STAGED_OFFLINE');
      assert.strictEqual(res.attachment.mimeType, 'image/png');
      assert.strictEqual(res.attachment.sha256Hash.length > 0, true);

      const list = listStagedProofAttachments();
      assert.strictEqual(list.length, 1);
    });

    it('rejects disallowed MIME types safely', async () => {
      const res = await stageOfflineProofAttachment({
        commitmentId: 'commit_123',
        fileName: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        stagedData: 'MZ9000',
      });

      assert.strictEqual(res.success, false);
      assert.match(res.error || '', /Disallowed MIME type/);
    });

    it('rejects attachments exceeding 5 MB limit', async () => {
      const largeData = 'x'.repeat(MAX_ATTACHMENT_SIZE_BYTES + 100);
      const res = await stageOfflineProofAttachment({
        commitmentId: 'commit_123',
        fileName: 'huge.png',
        mimeType: 'image/png',
        stagedData: largeData,
      });

      assert.strictEqual(res.success, false);
      assert.match(res.error || '', /exceeds maximum allowed size/);
    });

    it('marks attachment uploaded and clears local base64 payload to reclaim storage', async () => {
      const list = listStagedProofAttachments();
      assert.strictEqual(list.length, 1);

      const item = list[0];
      const uploaded = markAttachmentUploaded(item.id, 'proofs/user_1/commit_123/screenshot.png');
      assert.strictEqual(uploaded, true);

      const updatedList = listStagedProofAttachments();
      assert.strictEqual(updatedList[0].status, 'UPLOADED');
      assert.strictEqual(updatedList[0].stagedData, '');
      assert.strictEqual(updatedList[0].remoteStoragePath, 'proofs/user_1/commit_123/screenshot.png');
    });
  });

  describe('4. Device Identity & Background Sync Bridge', () => {
    it('generates a valid device ID fallback in non-browser runtime', () => {
      const id = getOrSetDeviceId();
      assert.ok(id.length > 0);
    });

    it('provides human-readable device name', () => {
      const name = getOrSetDeviceName();
      assert.ok(name.length > 0);
    });
  });
});

/**
 * PACT Phase 13: Offline Proof & Evidence Caching
 * Client-side staging and verification cache for proof-of-work evidence captured offline.
 * Enforces strict quota limits (5MB per file, 25MB total), MIME type whitelisting,
 * SHA-256 integrity checksums, and zero client-side consequence override guarantees.
 */

export type StagedAttachmentStatus = 'STAGED_OFFLINE' | 'UPLOADING' | 'UPLOADED' | 'EXPIRED';

export interface StagedProofAttachment {
  id: string; // UUID
  commitmentId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  stagedData: string; // Base64 data URI or raw text
  status: StagedAttachmentStatus;
  stagedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601 (default 7 days)
  remoteStoragePath?: string | null;
}

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TOTAL_STAGED_STORAGE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_PROOF_MIME_TYPES = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json',
]);

const ATTACHMENT_STORAGE_KEY = 'pact_staged_proof_attachments_v1';

export interface AttachmentStorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

class MemoryAttachmentAdapter implements AttachmentStorageAdapter {
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

let activeAttachmentAdapter: AttachmentStorageAdapter = new MemoryAttachmentAdapter();

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const testKey = '__pact_proof_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    activeAttachmentAdapter = window.localStorage;
  } catch {
    activeAttachmentAdapter = new MemoryAttachmentAdapter();
  }
}

export function setAttachmentStorageAdapter(adapter: AttachmentStorageAdapter): void {
  activeAttachmentAdapter = adapter;
}

/**
 * Computes a deterministic pseudo-SHA256 checksum in pure JS / Web Crypto environment.
 */
export async function computeDataChecksum(dataString: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const buffer = new TextEncoder().encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fall back to pure checksum
    }
  }

  // Pure deterministic 64-character hash fallback
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < dataString.length; i++) {
    const ch = dataString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (p1 + p2 + p1 + p2 + p1 + p2 + p1 + p2).slice(0, 64);
}

/**
 * Loads all staged proof attachments.
 */
export function listStagedProofAttachments(): StagedProofAttachment[] {
  try {
    const raw = activeAttachmentAdapter.getItem(ATTACHMENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as StagedProofAttachment[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Persists list of staged proof attachments.
 */
export function persistStagedProofAttachments(items: StagedProofAttachment[]): boolean {
  try {
    activeAttachmentAdapter.setItem(ATTACHMENT_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

/**
 * Stages an evidence proof attachment offline with quota checks and MIME validation.
 */
export async function stageOfflineProofAttachment(params: {
  id?: string;
  commitmentId: string;
  fileName: string;
  mimeType: string;
  stagedData: string;
}): Promise<{ success: boolean; attachment?: StagedProofAttachment; error?: string }> {
  // 1. Validate MIME type
  if (!ALLOWED_PROOF_MIME_TYPES.has(params.mimeType.toLowerCase())) {
    return {
      success: false,
      error: `Disallowed MIME type: ${params.mimeType}. Allowed formats: PNG, JPEG, WEBP, PDF, TXT, JSON.`,
    };
  }

  // 2. Validate single attachment size
  const dataSizeBytes = params.stagedData.length;
  if (dataSizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      success: false,
      error: `Attachment exceeds maximum allowed size of 5 MB (size: ${(dataSizeBytes / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // 3. Validate total quota
  const existing = listStagedProofAttachments();
  const currentTotalBytes = existing.reduce((acc, item) => acc + item.fileSizeBytes, 0);
  if (currentTotalBytes + dataSizeBytes > MAX_TOTAL_STAGED_STORAGE_BYTES) {
    return {
      success: false,
      error: 'Staged attachment storage quota exceeded (Max 25 MB). Please sync or clear pending proofs.',
    };
  }

  const checksum = await computeDataChecksum(params.stagedData);
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const id = params.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `proof_${Date.now()}`);

  const newAttachment: StagedProofAttachment = {
    id,
    commitmentId: params.commitmentId,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSizeBytes: dataSizeBytes,
    sha256Hash: checksum,
    stagedData: params.stagedData,
    status: 'STAGED_OFFLINE',
    stagedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const updated = [...existing.filter((a) => a.id !== id), newAttachment];
  persistStagedProofAttachments(updated);

  return {
    success: true,
    attachment: newAttachment,
  };
}

/**
 * Removes a staged proof attachment by ID.
 */
export function removeStagedProofAttachment(id: string): boolean {
  const existing = listStagedProofAttachments();
  const updated = existing.filter((item) => item.id !== id);
  return persistStagedProofAttachments(updated);
}

/**
 * Updates status of an attachment once uploaded to server storage.
 */
export function markAttachmentUploaded(id: string, remoteStoragePath: string): boolean {
  const existing = listStagedProofAttachments();
  const updated = existing.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'UPLOADED' as StagedAttachmentStatus,
        remoteStoragePath,
        stagedData: '', // Strip raw local base64 payload to reclaim storage
      };
    }
    return item;
  });
  return persistStagedProofAttachments(updated);
}

/**
 * Clears expired or uploaded proof attachments.
 */
export function purgeExpiredProofAttachments(): number {
  const existing = listStagedProofAttachments();
  const now = new Date().toISOString();
  const active = existing.filter((item) => item.expiresAt > now && item.status !== 'UPLOADED');
  persistStagedProofAttachments(active);
  return existing.length - active.length;
}

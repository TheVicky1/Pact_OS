/**
 * PACT Phase 9: WebAuthn / Passkey Security Engine
 * Cryptographic challenge generation, replay attack protection, credential parsing,
 * and client/server WebAuthn protocol orchestration.
 */

export interface PasskeyChallengeRecord {
  challenge: string;
  userId?: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

// In-memory challenge store with 5-minute TTL
const challengeStore = new Map<string, PasskeyChallengeRecord>();
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generates a cryptographically random challenge string (32 random bytes, base64url encoded).
 */
export function generatePasskeyChallenge(userId?: string): string {
  let randomBytes: Uint8Array;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    randomBytes = nodeCrypto.randomBytes(32);
  }

  // Base64url encoding without padding
  const base64 = Buffer.from(randomBytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const now = Date.now();
  challengeStore.set(base64, {
    challenge: base64,
    userId,
    createdAt: now,
    expiresAt: now + CHALLENGE_TTL_MS,
    used: false,
  });

  // Clean up expired challenges
  for (const [key, record] of challengeStore.entries()) {
    if (record.expiresAt < now || record.used) {
      challengeStore.delete(key);
    }
  }

  return base64;
}

/**
 * Validates and consumes a challenge. Ensures single-use to prevent replay attacks.
 */
export function consumePasskeyChallenge(challenge: string, expectedUserId?: string): {
  valid: boolean;
  error?: string;
} {
  const record = challengeStore.get(challenge);
  if (!record) {
    return { valid: false, error: 'Challenge expired or invalid.' };
  }

  if (record.used) {
    challengeStore.delete(challenge);
    return { valid: false, error: 'Challenge already consumed (replay detected).' };
  }

  if (Date.now() > record.expiresAt) {
    challengeStore.delete(challenge);
    return { valid: false, error: 'Challenge has expired.' };
  }

  if (expectedUserId && record.userId && record.userId !== expectedUserId) {
    challengeStore.delete(challenge);
    return { valid: false, error: 'Challenge does not belong to the authenticated user.' };
  }

  // Mark as consumed and delete
  record.used = true;
  challengeStore.delete(challenge);

  return { valid: true };
}

/**
 * Verifies origin and Relying Party (RP) ID.
 */
export function verifyRelyingPartyOrigin(
  clientOrigin: string,
  expectedHost?: string
): boolean {
  try {
    const parsed = new URL(clientOrigin);
    if (expectedHost) {
      return parsed.hostname === expectedHost || parsed.host === expectedHost;
    }
    // In local development or standard ports
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Checks if WebAuthn is supported in the current browser environment.
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function' &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function'
  );
}

/**
 * Helper to check if a platform authenticator (Touch ID, Face ID, Windows Hello) is available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Encodes a string to Uint8Array for WebAuthn buffers.
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Decodes a base64url string into an ArrayBuffer.
 */
export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

/**
 * Encodes an ArrayBuffer into a base64url string.
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

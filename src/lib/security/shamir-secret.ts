/**
 * Galois Field GF(2^8 = 256) Arithmetic and Shamir's Secret Sharing (2-of-3) Threshold Key Splitter.
 * Target: src/lib/security/shamir-secret.ts
 *
 * Implements pure GF(256) arithmetic using irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11b),
 * generator 3, and log/exp lookup tables. Zero external dependencies.
 */

export interface SecretShare {
  shareIndex: number; // 1, 2, or 3 (x-coordinate)
  shareDataHex: string; // y-coordinates encoded in hex
}

// ---------------------------------------------------------------------------
// GF(256) Tables & Arithmetic
// ---------------------------------------------------------------------------
const GF_POLYNOMIAL = 0x11b; // x^8 + x^4 + x^3 + x + 1
const GF_SIZE = 256;

const EXP_TABLE = new Uint8Array(GF_SIZE * 2);
const LOG_TABLE = new Uint8Array(GF_SIZE);

// Precompute log and exp tables using generator 3
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    // Multiply by 3 in GF(256): 3*x = (2*x) ^ x
    let x2 = x << 1;
    if (x2 & 0x100) {
      x2 ^= GF_POLYNOMIAL;
    }
    x = x2 ^ x;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
  LOG_TABLE[0] = 0; // log(0) undefined, sentinel
})();

export function gfAdd(a: number, b: number): number {
  return (a ^ b) & 0xff;
}

export function gfSub(a: number, b: number): number {
  return (a ^ b) & 0xff;
}

export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

export function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256)');
  if (a === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + 255 - LOG_TABLE[b]];
}

// ---------------------------------------------------------------------------
// Helpers: Hex & UTF-8 Conversion
// ---------------------------------------------------------------------------
function isHex(str: string): boolean {
  return str.length > 0 && str.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(str);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function utf8ToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  return Uint8Array.from(Buffer.from(str, 'utf-8'));
}

function bytesToUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  return Buffer.from(bytes).toString('utf-8');
}

// Secure random byte generator
function getRandomByte(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }
  return Math.floor(Math.random() * 256);
}

// ---------------------------------------------------------------------------
// Shamir Secret Sharing
// ---------------------------------------------------------------------------

/**
 * Split a UTF-8 or hex encoded secret into threshold shares over GF(256).
 * Default: 3 shares total, 2 required to reconstruct (2-of-3 threshold).
 */
export function splitSecret(
  secretUtf8OrHex: string,
  totalShares: number = 3,
  threshold: number = 2
): SecretShare[] {
  if (!secretUtf8OrHex) {
    throw new Error('Secret cannot be empty');
  }
  if (threshold < 2) {
    throw new Error('Threshold must be at least 2');
  }
  if (totalShares < threshold) {
    throw new Error('Total shares cannot be less than threshold');
  }
  if (totalShares > 255) {
    throw new Error('Total shares cannot exceed 255 in GF(256)');
  }

  // Detect format: If string is prefixed with hex metadata or valid hex format,
  // we record whether input was raw hex or text.
  let secretBytes: Uint8Array;
  let isInputHex = false;

  if (isHex(secretUtf8OrHex)) {
    secretBytes = hexToBytes(secretUtf8OrHex);
    isInputHex = true;
  } else {
    secretBytes = utf8ToBytes(secretUtf8OrHex);
    isInputHex = false;
  }

  // Prepend 1 byte format tag: 0x01 = hex input, 0x02 = utf8 input
  const payload = new Uint8Array(secretBytes.length + 1);
  payload[0] = isInputHex ? 0x01 : 0x02;
  payload.set(secretBytes, 1);

  const secretLen = payload.length;
  // share y-coordinates: totalShares arrays of length secretLen
  const shareBuffers: Uint8Array[] = Array.from({ length: totalShares }, () => new Uint8Array(secretLen));

  // For each byte in payload, construct random polynomial of degree (threshold - 1):
  // f(x) = secret + a_1*x + a_2*x^2 + ... + a_{k-1}*x^{k-1}
  for (let i = 0; i < secretLen; i++) {
    const coeffs = new Uint8Array(threshold);
    coeffs[0] = payload[i]; // f(0) = secret byte
    for (let d = 1; d < threshold; d++) {
      coeffs[d] = getRandomByte();
    }

    // Evaluate f(x) for each share index x in 1..totalShares
    for (let s = 0; s < totalShares; s++) {
      const x = s + 1; // x-coordinate (1, 2, 3...)
      let y = coeffs[0];
      let xPower = 1;
      for (let d = 1; d < threshold; d++) {
        xPower = gfMul(xPower, x);
        y = gfAdd(y, gfMul(coeffs[d], xPower));
      }
      shareBuffers[s][i] = y;
    }
  }

  const result: SecretShare[] = [];
  for (let s = 0; s < totalShares; s++) {
    result.push({
      shareIndex: s + 1,
      shareDataHex: bytesToHex(shareBuffers[s]),
    });
  }

  return result;
}

/**
 * Reconstruct original secret string from k >= threshold shares using Lagrange interpolation.
 */
export function reconstructSecret(
  shares: SecretShare[]
): string {
  if (!shares || shares.length === 0) {
    throw new Error('Insufficient shares to reconstruct secret');
  }

  // Check unique share indices
  const seenIndices = new Set<number>();
  for (const s of shares) {
    if (!s.shareIndex || s.shareIndex < 1 || s.shareIndex > 255) {
      throw new Error(`Invalid share index: ${s.shareIndex}`);
    }
    if (seenIndices.has(s.shareIndex)) {
      throw new Error(`Duplicate share index detected: ${s.shareIndex}`);
    }
    seenIndices.add(s.shareIndex);
  }

  const k = shares.length;
  if (k < 2) {
    throw new Error('Insufficient shares to reconstruct secret');
  }

  // Validate lengths
  const len = shares[0].shareDataHex.length;
  if (len === 0 || len % 2 !== 0) {
    throw new Error('Invalid share data length');
  }
  for (let i = 1; i < k; i++) {
    if (shares[i].shareDataHex.length !== len) {
      throw new Error('Inconsistent share data lengths');
    }
  }

  const byteLen = len / 2;
  const shareByteArrays = shares.map((s) => hexToBytes(s.shareDataHex));
  const xs = shares.map((s) => s.shareIndex);

  // Precompute Lagrange basis polynomials at x = 0:
  // l_j(0) = \prod_{m \neq j} \frac{0 - x_m}{x_j - x_m} = \prod_{m \neq j} \frac{x_m}{x_j \oplus x_m}
  const lagrangeWeights = new Uint8Array(k);
  for (let j = 0; j < k; j++) {
    let weight = 1;
    for (let m = 0; m < k; m++) {
      if (m === j) continue;
      const num = xs[m];
      const den = gfSub(xs[j], xs[m]);
      const term = gfDiv(num, den);
      weight = gfMul(weight, term);
    }
    lagrangeWeights[j] = weight;
  }

  // Reconstruct secret bytes f(0) = \sum_{j=0}^{k-1} y_j * l_j(0)
  const reconstructedPayload = new Uint8Array(byteLen);
  for (let b = 0; b < byteLen; b++) {
    let sum = 0;
    for (let j = 0; j < k; j++) {
      const y = shareByteArrays[j][b];
      sum = gfAdd(sum, gfMul(y, lagrangeWeights[j]));
    }
    reconstructedPayload[b] = sum;
  }

  // Format tag
  const formatTag = reconstructedPayload[0];
  const secretBytes = reconstructedPayload.subarray(1);

  if (formatTag === 0x01) {
    return bytesToHex(secretBytes);
  } else if (formatTag === 0x02) {
    try {
      return bytesToUtf8(secretBytes);
    } catch {
      // Fallback to hex if corrupted
      return bytesToHex(secretBytes);
    }
  } else {
    // If format tag unrecognized, attempt UTF-8 decode or hex fallback
    try {
      return bytesToUtf8(secretBytes);
    } catch {
      return bytesToHex(secretBytes);
    }
  }
}

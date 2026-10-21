/**
 * Comparison helpers that avoid early exits based on differing byte values.
 *
 * These are best-effort JavaScript implementations, not a cryptographic timing
 * guarantee: JIT compilation, allocation, Unicode normalization, and encoding
 * can vary in cost. Input lengths are not hidden. Use native cryptographic
 * verification APIs where a strict timing-security boundary is required.
 */

/** Controls canonical Unicode normalization before UTF-8 comparison. */
export interface TimingSafeCompareOptions {
  /** Apply NFC normalization before encoding. Defaults to true. */
  normalizeUnicode?: boolean;
}

/**
 * Compare every byte of the first buffer without exiting on a differing byte.
 * For unequal lengths, compare against a zero-filled dummy of the first buffer's
 * length and still return false. Work scales with a.length; unequal-length
 * allocation and the surrounding runtime are not guaranteed timing-safe.
 * Neither input is modified, and typed-array view offsets are respected.
 */
export function timingSafeBufferEqual(a: Uint8Array, b: Uint8Array): boolean {
  const lenDiff = Number(a.length !== b.length);
  const comparison = lenDiff === 0 ? b : new Uint8Array(a.length);
  let diff = 0;

  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ comparison[i];
  }

  return diff === 0 && lenDiff === 0;
}

/**
 * Compare NFC-normalized UTF-8 strings by accumulating byte differences.
 * Set normalizeUnicode to false to compare their unnormalized UTF-8 encodings.
 * TextEncoder replaces unpaired UTF-16 surrogates with U+FFFD, so this compares
 * encoded text rather than exact UTF-16 code units for malformed strings.
 */
export function constantTimeEqual(
  a: string,
  b: string,
  options: TimingSafeCompareOptions = {},
): boolean {
  const { normalizeUnicode = true } = options;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(normalizeUnicode ? a.normalize('NFC') : a);
  const bufB = encoder.encode(normalizeUnicode ? b.normalize('NFC') : b);
  return timingSafeBufferEqual(bufA, bufB);
}

/**
 * Select a string using bit masks rather than a condition-dependent branch.
 * Visits both candidates up to their maximum UTF-16 length and preserves the
 * selected string exactly, including null characters and unpaired surrogates.
 * The returned length is observable; slicing and JS execution are not guaranteed
 * constant-time. This does not conceal the condition from a returned value.
 */
export function timingSafeSelect(condition: boolean, ifTrue: string, ifFalse: string): string {
  const mask = -Number(condition);
  const length = Math.max(ifTrue.length, ifFalse.length);
  let selected = '';

  for (let i = 0; i < length; i++) {
    // Out-of-range charCodeAt returns NaN; bitwise conversion pads it with zero.
    const trueCode = ifTrue.charCodeAt(i) | 0;
    const falseCode = ifFalse.charCodeAt(i) | 0;
    selected += String.fromCharCode((trueCode & mask) | (falseCode & ~mask));
  }

  const selectedLength = (ifTrue.length & mask) | (ifFalse.length & ~mask);
  return selected.slice(0, selectedLength);
}

'use client';

/**
 * Browser-local storage is finite. When `localStorage.setItem`, `sessionStorage`,
 * or an IndexedDB transaction writes past the origin's quota, browsers throw a
 * `DOMException` with a `QuotaExceededError` name and code `22`. This module
 * provides a single, defensive predicate that recognises that failure across
 * the three major engines (Blink, Gecko and WebKit) without depending on any
 * particular error constructor, so it stays safe to call on unknown values
 * (e.g. a rejected promise's `reason`, a `catch` block argument, or `unknown`
 * flowing through an error boundary).
 */

/** `DOMException.QUOTA_EXCEEDED_ERR` — the historical numeric code for the error. */
export const QUOTA_EXCEEDED_CODE = 22;

/**
 * Message patterns browsers emit when an origin exhausts its storage quota.
 * Engine-specific wording varies, so each is matched case-insensitively.
 * Ordered roughly from most to least specific; each pattern alone is enough
 * to classify the error.
 */
const QUOTA_MESSAGE_PATTERNS: readonly RegExp[] = [
  /quota\s+(?:has\s+been\s+)?exceeded/i, // Blink/Gecko/WebKit: "The quota has been exceeded"
  /exceeded\s+the\s+(?:storage\s+)?quota/i, // Blink: "Setting the value ... exceeded the quota"
  /QuotaExceededError/i, // WebKit: "QuotaExceededError: DOM Exception 22"
];

/**
 * A minimal structural view of the fields we inspect on an error-like object.
 * Real `DOMException`s carry `name`, `message` and `code`; a wrapped or
 * serialised error may carry only a subset, so every field is optional.
 */
interface ErrorLike {
  code?: unknown;
  name?: unknown;
  message?: unknown;
}

/**
 * Returns `true` when `error` represents a browser storage quota exhaustion
 * failure, across Chrome/Edge (Blink), Firefox (Gecko) and Safari (WebKit).
 *
 * Detection order:
 *   1. numeric `code === 22` (`DOMException.QUOTA_EXCEEDED_ERR`), or
 *   2. a `name` mentioning "quota" (e.g. `QuotaExceededError`,
 *      `NS_ERROR_DOM_QUOTA_REACHED`), or
 *   3. a `message` matching any known engine phrasing.
 *
 * Anything that is not an object (or a `null`) returns `false`, so the
 * predicate is safe on `unknown` inputs.
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as ErrorLike;

  if (typeof candidate.code === 'number' && candidate.code === QUOTA_EXCEEDED_CODE) {
    return true;
  }

  if (typeof candidate.name === 'string' && /quota/i.test(candidate.name)) {
    return true;
  }

  if (
    typeof candidate.message === 'string' &&
    QUOTA_MESSAGE_PATTERNS.some((pattern) => pattern.test(candidate.message as string))
  ) {
    return true;
  }

  return false;
}

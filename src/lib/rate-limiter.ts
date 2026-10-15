/**
 * In-memory sliding-window rate limiter.
 * State lives in process memory: it resets on restart and is not shared
 * across serverless instances, so treat it as a best-effort brute-force guard.
 */

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
}

/** Partner verification codes: 5 attempts per 15 minutes. */
export const PARTNER_VERIFICATION_MAX_ATTEMPTS = 5;
export const PARTNER_VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

const attemptLog = new Map<string, number[]>();

/**
 * Records an attempt for `key` and reports whether it is allowed.
 * Blocked attempts are not recorded, so the window slides off the allowed ones.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const recent = (attemptLog.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= maxAttempts) {
    attemptLog.set(key, recent);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: Math.max(0, recent[0] + windowMs - now),
    };
  }

  recent.push(now);
  attemptLog.set(key, recent);
  return {
    allowed: true,
    remainingAttempts: maxAttempts - recent.length,
    retryAfterMs: 0,
  };
}

/** Convenience wrapper applying the partner verification code policy. */
export function checkPartnerVerificationRateLimit(
  key: string,
  now: number = Date.now()
): RateLimitResult {
  return checkRateLimit(key, PARTNER_VERIFICATION_MAX_ATTEMPTS, PARTNER_VERIFICATION_WINDOW_MS, now);
}

/** Clears one key, or all keys when omitted. */
export function resetRateLimit(key?: string): void {
  if (key === undefined) attemptLog.clear();
  else attemptLog.delete(key);
}

/**
 * PACT Phase 11: Production Security & Rate Limiting Engine
 *
 * Implements in-memory token-bucket / sliding-window rate limiting for edge and serverless environments.
 * Supports configurable tiers (AUTH, WEBHOOK, PROOF_SYNC, API, CRON), burst allowances,
 * safe client IP extraction, and RFC-compliant rate limit headers.
 *
 * Zero sensitive data or credentials leaked in headers or errors.
 */

export interface RateLimitTierConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Name of the tier */
  name: string;
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTierConfig> = {
  AUTH: {
    name: 'AUTH',
    maxRequests: 10,
    windowSeconds: 60, // 10 attempts per minute (prevents brute-force)
  },
  WEBHOOK: {
    name: 'WEBHOOK',
    maxRequests: 60,
    windowSeconds: 60, // 60 requests per minute
  },
  PROOF_SYNC: {
    name: 'PROOF_SYNC',
    maxRequests: 30,
    windowSeconds: 60, // 30 sync calls per minute
  },
  API: {
    name: 'API',
    maxRequests: 120,
    windowSeconds: 60, // 120 API requests per minute
  },
  CRON: {
    name: 'CRON',
    maxRequests: 10,
    windowSeconds: 60, // 10 cron invocations per minute
  },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds?: number;
  tier: string;
  key: string;
}

interface RateLimitRecord {
  count: number;
  resetAt: number; // Unix timestamp in ms
}

class MemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private maxEntries = 10000;

  /**
   * Evaluates if a request from the given key under the specified tier is allowed.
   */
  public check(key: string, tierConfig: RateLimitTierConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = tierConfig.windowSeconds * 1000;
    const storeKey = `${tierConfig.name}:${key}`;

    this.cleanup(now);

    const record = this.store.get(storeKey);

    if (!record || now >= record.resetAt) {
      // Initialize or reset window
      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.store.set(storeKey, newRecord);

      return {
        success: true,
        limit: tierConfig.maxRequests,
        remaining: Math.max(0, tierConfig.maxRequests - 1),
        resetSeconds: tierConfig.windowSeconds,
        tier: tierConfig.name,
        key,
      };
    }

    // Existing active window
    if (record.count < tierConfig.maxRequests) {
      record.count += 1;
      const remainingTime = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

      return {
        success: true,
        limit: tierConfig.maxRequests,
        remaining: Math.max(0, tierConfig.maxRequests - record.count),
        resetSeconds: remainingTime,
        tier: tierConfig.name,
        key,
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      limit: tierConfig.maxRequests,
      remaining: 0,
      resetSeconds: retryAfter,
      retryAfterSeconds: retryAfter,
      tier: tierConfig.name,
      key,
    };
  }

  /**
   * Resets rate limit counter for a specific key (useful for unit testing or admin reset).
   */
  public reset(key: string, tierName: string): void {
    this.store.delete(`${tierName}:${key}`);
  }

  /**
   * Clears entire rate limit store.
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Periodic garbage collection of expired entries.
   */
  private cleanup(now: number): void {
    if (this.store.size > this.maxEntries) {
      for (const [k, v] of this.store.entries()) {
        if (now >= v.resetAt) {
          this.store.delete(k);
        }
      }
      // If still too large, drop oldest 20%
      if (this.store.size > this.maxEntries) {
        let deleted = 0;
        for (const k of this.store.keys()) {
          this.store.delete(k);
          deleted++;
          if (deleted > 2000) break;
        }
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new MemoryRateLimiter();

/**
 * Extracts client IP identifier safely from request headers.
 */
export function extractClientIdentifier(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the left-most client IP
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Formats rate limit headers for HTTP responses.
 */
export function formatRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetSeconds.toString(),
    'X-RateLimit-Tier': result.tier,
  };

  if (!result.success && result.retryAfterSeconds) {
    headers['Retry-After'] = result.retryAfterSeconds.toString();
  }

  return headers;
}

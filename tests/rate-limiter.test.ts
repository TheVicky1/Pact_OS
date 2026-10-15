import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  checkPartnerVerificationRateLimit,
  resetRateLimit,
  PARTNER_VERIFICATION_MAX_ATTEMPTS,
  PARTNER_VERIFICATION_WINDOW_MS,
} from "../src/lib/rate-limiter";

beforeEach(() => resetRateLimit());

test("allows attempts under the limit and counts down remaining", () => {
  for (let i = 1; i <= 3; i++) {
    const r = checkRateLimit("a", 3, 1000, 0);
    assert.equal(r.allowed, true);
    assert.equal(r.remainingAttempts, 3 - i);
    assert.equal(r.retryAfterMs, 0);
  }
});

test("blocks once the limit is exceeded and reports retryAfterMs", () => {
  checkRateLimit("a", 2, 1000, 0);
  checkRateLimit("a", 2, 1000, 200);
  const r = checkRateLimit("a", 2, 1000, 500);
  assert.deepEqual(r, { allowed: false, remainingAttempts: 0, retryAfterMs: 500 });
});

test("blocked attempts do not extend the lockout", () => {
  checkRateLimit("a", 1, 1000, 0);
  checkRateLimit("a", 1, 1000, 900);
  assert.equal(checkRateLimit("a", 1, 1000, 1000).allowed, true);
});

test("resets after the sliding window passes", () => {
  checkRateLimit("a", 2, 1000, 0);
  checkRateLimit("a", 2, 1000, 100);
  assert.equal(checkRateLimit("a", 2, 1000, 999).allowed, false);
  const r = checkRateLimit("a", 2, 1000, 1000);
  assert.equal(r.allowed, true);
  assert.equal(r.remainingAttempts, 0);
});

test("tracks keys independently", () => {
  checkRateLimit("a", 1, 1000, 0);
  assert.equal(checkRateLimit("a", 1, 1000, 1).allowed, false);
  assert.equal(checkRateLimit("b", 1, 1000, 1).allowed, true);
});

test("resetRateLimit clears a key", () => {
  checkRateLimit("a", 1, 1000, 0);
  resetRateLimit("a");
  assert.equal(checkRateLimit("a", 1, 1000, 1).allowed, true);
});

test("partner verification policy is 5 attempts per 15 minutes", () => {
  assert.equal(PARTNER_VERIFICATION_MAX_ATTEMPTS, 5);
  assert.equal(PARTNER_VERIFICATION_WINDOW_MS, 15 * 60 * 1000);
  for (let i = 0; i < 5; i++) assert.equal(checkPartnerVerificationRateLimit("s", 0).allowed, true);
  const blocked = checkPartnerVerificationRateLimit("s", 1000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, PARTNER_VERIFICATION_WINDOW_MS - 1000);
});

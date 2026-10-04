import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenBucketLimiter } from '../src/lib/security/rate-limiter';

function fakeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

test('Token Bucket Rate Limiter', async (t) => {
  await t.test('allows a burst up to capacity, then rejects with Retry-After', () => {
    const clock = fakeClock();
    const limiter = new TokenBucketLimiter(3, 1, clock.now);

    assert.deepEqual(limiter.consume('ip'), { allowed: true, remaining: 2, retryAfterSeconds: 0 });
    assert.deepEqual(limiter.consume('ip'), { allowed: true, remaining: 1, retryAfterSeconds: 0 });
    assert.deepEqual(limiter.consume('ip'), { allowed: true, remaining: 0, retryAfterSeconds: 0 });
    assert.deepEqual(limiter.consume('ip'), { allowed: false, remaining: 0, retryAfterSeconds: 1 });
  });

  await t.test('refills continuously over time and never exceeds capacity', () => {
    const clock = fakeClock();
    const limiter = new TokenBucketLimiter(2, 0.5, clock.now); // 1 token per 2s

    limiter.consume('ip');
    limiter.consume('ip');
    assert.equal(limiter.consume('ip').allowed, false);

    clock.advance(1000); // +0.5 token
    const halfway = limiter.consume('ip');
    assert.equal(halfway.allowed, false);
    assert.equal(halfway.retryAfterSeconds, 1);

    clock.advance(1000); // +0.5 token → 1 token
    assert.equal(limiter.consume('ip').allowed, true);

    clock.advance(60_000); // long idle → capped at capacity
    assert.equal(limiter.consume('ip').remaining, 1);
    assert.equal(limiter.consume('ip').remaining, 0);
    assert.equal(limiter.consume('ip').allowed, false);
  });

  await t.test('tracks keys independently', () => {
    const limiter = new TokenBucketLimiter(1, 1, fakeClock().now);
    assert.equal(limiter.consume('a').allowed, true);
    assert.equal(limiter.consume('a').allowed, false);
    assert.equal(limiter.consume('b').allowed, true);
  });

  await t.test('consumes multiple tokens and rejects without draining on failure', () => {
    const limiter = new TokenBucketLimiter(5, 1, fakeClock().now);
    assert.deepEqual(limiter.consume('ip', 4), { allowed: true, remaining: 1, retryAfterSeconds: 0 });
    assert.deepEqual(limiter.consume('ip', 3), { allowed: false, remaining: 1, retryAfterSeconds: 2 });
    assert.equal(limiter.consume('ip', 1).allowed, true, 'Failed request must not consume tokens');
  });

  await t.test('rejects invalid token counts and configuration', () => {
    const limiter = new TokenBucketLimiter(5, 1);
    assert.throws(() => limiter.consume('ip', 0), RangeError);
    assert.throws(() => limiter.consume('ip', -1), RangeError);
    assert.throws(() => limiter.consume('ip', NaN), RangeError);
    assert.throws(() => limiter.consume('ip', 6), RangeError);
    assert.throws(() => new TokenBucketLimiter(0, 1), RangeError);
    assert.throws(() => new TokenBucketLimiter(5, 0), RangeError);
  });

  await t.test('clear() resets all buckets', () => {
    const limiter = new TokenBucketLimiter(1, 1, fakeClock().now);
    limiter.consume('ip');
    limiter.clear();
    assert.equal(limiter.consume('ip').allowed, true);
  });
});

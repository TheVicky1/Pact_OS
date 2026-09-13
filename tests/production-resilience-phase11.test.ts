import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rateLimiter,
  RATE_LIMIT_TIERS,
  extractClientIdentifier,
  formatRateLimitHeaders,
} from '../src/lib/security/rate-limiter';
import { sanitizeLogData } from '../src/lib/observability/logger';
import { telemetry } from '../src/lib/observability/telemetry';
import { notificationDispatcher } from '../src/lib/notifications/notification-dispatcher';

test('Phase 11 — Production Resilience, Rate Limiting & Enterprise Observability', async (t) => {
  await t.test('1. Rate Limiting Engine — allows requests within tier limits and tracks token exhaustion', () => {
    rateLimiter.clear();
    const testKey = 'user_test_1';
    const tier = RATE_LIMIT_TIERS.AUTH; // 10 req / 60s

    const r1 = rateLimiter.check(testKey, tier);
    assert.equal(r1.success, true);
    assert.equal(r1.limit, 10);
    assert.equal(r1.remaining, 9);
    assert.equal(r1.tier, 'AUTH');

    const r2 = rateLimiter.check(testKey, tier);
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 8);
  });

  await t.test('1. Rate Limiting Engine — rejects requests exceeding limit and issues Retry-After', () => {
    rateLimiter.clear();
    const testKey = 'user_test_abuse';
    const tier = { name: 'BURST_TEST', maxRequests: 3, windowSeconds: 10 };

    rateLimiter.check(testKey, tier);
    rateLimiter.check(testKey, tier);
    const r3 = rateLimiter.check(testKey, tier);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);

    const r4 = rateLimiter.check(testKey, tier);
    assert.equal(r4.success, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.retryAfterSeconds && r4.retryAfterSeconds > 0);

    const headers = formatRateLimitHeaders(r4);
    assert.equal(headers['X-RateLimit-Limit'], '3');
    assert.equal(headers['X-RateLimit-Remaining'], '0');
    assert.ok(headers['Retry-After']);
  });

  await t.test('1. Rate Limiting Engine — extracts client IP safely from proxy headers', () => {
    const h1 = new Headers({ 'x-forwarded-for': '203.0.113.195, 70.41.3.18' });
    assert.equal(extractClientIdentifier(h1), '203.0.113.195');

    const h2 = new Headers({ 'cf-connecting-ip': '198.51.100.44' });
    assert.equal(extractClientIdentifier(h2), '198.51.100.44');

    const h3 = new Headers({ 'x-real-ip': '192.0.2.1' });
    assert.equal(extractClientIdentifier(h3), '192.0.2.1');

    const h4 = new Headers({});
    assert.equal(extractClientIdentifier(h4), '127.0.0.1');
  });

  await t.test('2. Privacy-Safe Structured Logger — redacts sensitive bearer tokens and private keys', () => {
    const rawText = 'User signed in with Bearer eyJhbGciOiJIUzI1NiJ9.abc and key=sk_live_99999secret';
    const sanitized = sanitizeLogData(rawText);
    assert.ok(typeof sanitized === 'string');
    assert.ok(!sanitized.includes('eyJhbGciOiJIUzI1NiJ9'));
    assert.ok(!sanitized.includes('sk_live_99999secret'));
    assert.ok(sanitized.includes('[REDACTED_CONFIDENTIAL]'));
  });

  await t.test('2. Privacy-Safe Structured Logger — redacts consequence statements and secret fields in objects', () => {
    const payload = {
      userId: 'usr_123',
      action: 'COMMITMENT_BREACH',
      consequence_text: 'Forfeit $50 to charity',
      user_secret_token: 'secret_value_xyz',
      public_data: 'Goal: Run 5km',
    };

    const sanitized = sanitizeLogData(payload) as Record<string, unknown>;
    assert.equal(sanitized.userId, 'usr_123');
    assert.equal(sanitized.public_data, 'Goal: Run 5km');
    assert.equal(sanitized.consequence_text, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.user_secret_token, '[REDACTED_CONFIDENTIAL]');
  });

  await t.test('3. Notification Priority Dispatcher — enqueues and tracks priority queue', () => {
    notificationDispatcher.clear();

    const lowId = notificationDispatcher.enqueue(
      { userId: 'u1', type: 'system', title: 'Low alert', body: 'Body' },
      'LOW'
    );
    const critId = notificationDispatcher.enqueue(
      { userId: 'u2', type: 'task_deadline_approaching', title: 'Critical alert', body: 'Body' },
      'CRITICAL'
    );

    assert.ok(lowId);
    assert.ok(critId);

    const stats = notificationDispatcher.getQueueStats();
    assert.equal(stats.pending, 2);
    assert.equal(stats.deadLetters, 0);
  });

  await t.test('3. Notification Priority Dispatcher — processes batch delivery successfully', async () => {
    notificationDispatcher.clear();

    notificationDispatcher.enqueue(
      { userId: 'u1', type: 'system', title: 'Test 1', body: 'Msg' },
      'NORMAL'
    );

    const result = await notificationDispatcher.processBatch(async () => {
      return [{ channel: 'in_app', success: true, isConfigured: true }];
    });

    assert.equal(result.processed, 1);
    assert.equal(result.delivered, 1);
    assert.equal(result.failed, 0);

    const stats = notificationDispatcher.getQueueStats();
    assert.equal(stats.pending, 0);
  });

  await t.test('3. Notification Priority Dispatcher — moves failed items to dead-letter queue', async () => {
    notificationDispatcher.clear();

    notificationDispatcher.enqueue(
      { userId: 'u1', type: 'system', title: 'Will Fail', body: 'Msg' },
      'LOW'
    );

    const dlResult = await notificationDispatcher.processBatch(async (item) => {
      item.attempts = item.maxAttempts; // simulate reaching max retry attempts
      return [{ channel: 'email', success: false, isConfigured: true, error: 'Permanent failure' }];
    });

    assert.equal(dlResult.deadLettered, 1);
    const deadLetters = notificationDispatcher.getDeadLetters();
    assert.equal(deadLetters.length, 1);
    assert.ok(deadLetters[0]?.finalError.includes('Permanent failure'));
  });

  await t.test('4. Telemetry & Metrics Tracker — tracks route requests, latencies, and errors', () => {
    telemetry.reset();

    telemetry.recordRequest('/api/health', 15, false);
    telemetry.recordRequest('/api/health', 25, false);
    telemetry.recordRequest('/api/finance/webhook', 80, true);

    const summary = telemetry.getSummary();
    assert.equal(summary.totalRequests, 3);
    assert.equal(summary.errorCount, 1);
    assert.equal(summary.routes['/api/health']?.count, 2);
    assert.equal(summary.routes['/api/health']?.avgLatencyMs, 20);
    assert.equal(summary.routes['/api/finance/webhook']?.count, 1);
  });
});

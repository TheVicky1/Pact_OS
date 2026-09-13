import assert from 'node:assert';
import { GET, HEAD } from '../src/app/api/health/route';

/**
 * Phase 5T — Health & Readiness Endpoint Contract Tests
 * Verifies GET /api/health and HEAD /api/health behavior and confidentiality.
 */
async function runHealthEndpointTests() {
  console.log('================================================================');
  console.log('  PACT Phase 5T — Operational Health & Readiness Test Suite');
  console.log('================================================================\n');

  // 1. Test GET /api/health status code and payload structure
  console.log('1. Testing GET /api/health response format...');
  const getRes = await GET();
  assert.strictEqual(getRes.status, 200, 'GET /api/health must return HTTP 200 OK');
  
  const body = await getRes.json();
  assert.strictEqual(body.status, 'healthy', 'status must be "healthy"');
  assert.strictEqual(typeof body.uptime, 'number', 'uptime must be a number');
  assert.strictEqual(body.version, '0.1.0', 'version must match canonical package.json');
  assert.ok(body.timestamp, 'timestamp must be present');
  assert.strictEqual(body.checks?.runtime, 'ok', 'runtime check must be "ok"');
  console.log('✅ GET /api/health returns valid JSON structure with status="healthy".');

  // 2. Test Confidentiality & Zero Secret Leakage Invariants
  console.log('\n2. Testing confidentiality and zero secret exposure...');
  const bodyStr = JSON.stringify(body);
  assert.strictEqual(bodyStr.includes('SUPABASE_SERVICE_ROLE_KEY'), false, 'Must not leak service role key name');
  assert.strictEqual(bodyStr.includes('CRON_SECRET'), false, 'Must not leak cron secret name');
  assert.strictEqual(bodyStr.includes('password'), false, 'Must not leak password fields');
  assert.strictEqual(bodyStr.includes('secret'), false, 'Must not leak secret keys');
  console.log('✅ Health response guarantees zero credential or sensitive token leakage.');

  // 3. Test Cache-Control headers
  console.log('\n3. Testing Cache-Control anti-caching headers...');
  const cacheHeader = getRes.headers.get('Cache-Control');
  assert.ok(cacheHeader?.includes('no-store'), 'Cache-Control must specify no-store');
  assert.ok(cacheHeader?.includes('no-cache'), 'Cache-Control must specify no-cache');
  console.log('✅ Cache-Control headers prevent stale proxy or browser caching.');

  // 4. Test HEAD /api/health lightweight ping
  console.log('\n4. Testing HEAD /api/health lightweight ping...');
  const headRes = await HEAD();
  assert.strictEqual(headRes.status, 200, 'HEAD /api/health must return HTTP 200 OK');
  const headBody = await headRes.text();
  assert.strictEqual(headBody, '', 'HEAD request must return an empty body');
  console.log('✅ HEAD /api/health returns HTTP 200 with empty body for uptime probes.');

  console.log('\n================================================================');
  console.log('🎉 ALL OPERATIONAL HEALTH & READINESS TESTS PASSED CLEANLY');
  console.log('================================================================');
}

runHealthEndpointTests().catch((err) => {
  console.error('Health endpoint test failure:', err);
  process.exit(1);
});

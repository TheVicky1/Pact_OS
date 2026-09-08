import assert from 'node:assert';
import { validateSafeRedirect } from '../src/lib/auth/redirect';

/**
 * Phase 2I Google OAuth & Safe Redirect Unit & Security Test Suite
 */
function runOAuthValidationTests() {
  console.log('================================================================');
  console.log('  PACT Phase 2I — OAuth & Safe Redirect Security Unit Test Suite');
  console.log('================================================================\n');

  // 1. Testing valid internal relative paths
  console.log('1. Testing valid internal application paths...');
  assert.strictEqual(validateSafeRedirect('/app'), '/app', 'Valid /app allowed');
  assert.strictEqual(validateSafeRedirect('/app/goals'), '/app/goals', 'Valid /app/goals allowed');
  assert.strictEqual(validateSafeRedirect('/app/projects?id=123'), '/app/projects?id=123', 'Valid query path allowed');
  assert.strictEqual(validateSafeRedirect('/profile'), '/profile', 'Valid /profile allowed');
  console.log('✅ Valid internal application paths verified.');

  // 2. Testing null, undefined, empty inputs
  console.log('\n2. Testing missing/empty input fallbacks...');
  assert.strictEqual(validateSafeRedirect(null), '/app', 'Null input returns default /app fallback');
  assert.strictEqual(validateSafeRedirect(undefined), '/app', 'Undefined input returns default fallback');
  assert.strictEqual(validateSafeRedirect(''), '/app', 'Empty string returns default fallback');
  assert.strictEqual(validateSafeRedirect(null, '/profile'), '/profile', 'Custom fallback respected');
  console.log('✅ Fallback mechanism verified.');

  // 3. Testing Open Redirect Attacks
  console.log('\n3. Testing Open Redirect Attack Defense...');
  
  // External protocol URLs
  assert.strictEqual(validateSafeRedirect('https://evil.com'), '/app', 'Blocked https://evil.com');
  assert.strictEqual(validateSafeRedirect('http://evil.com'), '/app', 'Blocked http://evil.com');
  assert.strictEqual(validateSafeRedirect('ftp://evil.com'), '/app', 'Blocked ftp://evil.com');

  // Protocol-relative URLs
  assert.strictEqual(validateSafeRedirect('//evil.com'), '/app', 'Blocked //evil.com');
  assert.strictEqual(validateSafeRedirect('/\\evil.com'), '/app', 'Blocked /\\evil.com');
  assert.strictEqual(validateSafeRedirect('//google.com/app'), '/app', 'Blocked //google.com/app');

  // Unallowed local paths
  assert.strictEqual(validateSafeRedirect('/admin'), '/app', 'Blocked unauthorized /admin path');
  assert.strictEqual(validateSafeRedirect('/api/secret'), '/app', 'Blocked /api/secret path');

  // Control character & scheme injection
  assert.strictEqual(validateSafeRedirect('/app\r\nHeader-Inject'), '/app', 'Blocked CRLF injection');
  assert.strictEqual(validateSafeRedirect('/http:evil.com'), '/app', 'Blocked colon scheme injection');
  assert.strictEqual(validateSafeRedirect('javascript:alert(1)'), '/app', 'Blocked javascript scheme');

  console.log('✅ Open Redirect Defense verified (10/10 attack vectors blocked).');

  console.log('\n================================================================');
  console.log('🎉 ALL OAUTH & SAFE REDIRECT SECURITY TESTS PASSED CLEANLY');
  console.log('================================================================\n');
}

runOAuthValidationTests();

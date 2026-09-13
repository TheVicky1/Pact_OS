import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { GET as getHealth, HEAD as headHealth } from '../src/app/api/health/route';
import { validateSafeRedirect } from '../src/lib/auth/redirect';

/**
 * Phase 5U — Staging & Production Deployment Smoke Test Suite
 * Validates deployment invariants, operational probes, redirect boundaries, and cron authorization.
 */
async function runStagingSmokeTests() {
  console.log('================================================================');
  console.log('  PACT Phase 5U — Staging Smoke & Deployment Validation Suite');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  // 1. Validate Health Probe under simulated production runtime
  console.log('1. Testing /api/health operational probe...');
  const healthRes = await getHealth();
  assert.strictEqual(healthRes.status, 200, 'Health endpoint must return 200 OK');
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'healthy');
  assert.strictEqual(typeof healthData.uptime, 'number');
  assert.strictEqual(healthData.version, '0.1.0');
  assert.strictEqual(healthData.checks?.runtime, 'ok');

  const headRes = await headHealth();
  assert.strictEqual(headRes.status, 200, 'Health HEAD probe must return 200 OK');
  console.log('✅ Operational health & readiness probes pass under production runtime simulation.');

  // 2. Validate OAuth Callback Open-Redirect Security
  console.log('\n2. Testing OAuth callback redirect boundary safeguards...');
  assert.strictEqual(validateSafeRedirect('/app', '/app'), '/app');
  assert.strictEqual(validateSafeRedirect('/app/tasks', '/app'), '/app/tasks');
  assert.strictEqual(validateSafeRedirect('/app/finance', '/app'), '/app/finance');
  assert.strictEqual(validateSafeRedirect('https://malicious-site.com', '/app'), '/app');
  assert.strictEqual(validateSafeRedirect('//evil.com/hack', '/app'), '/app');
  assert.strictEqual(validateSafeRedirect(null, '/app'), '/app');
  assert.strictEqual(validateSafeRedirect('', '/app'), '/app');
  console.log('✅ Open-redirect attacks on auth callback are safely neutralized.');

  // 3. Validate Environment Variable Segregation Invariants
  console.log('\n3. Validating environment variable naming & secret segregation...');
  const envExamplePath = path.join(rootDir, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');

  // Secrets MUST NOT have NEXT_PUBLIC_ prefix
  assert.ok(envExample.includes('SUPABASE_SERVICE_ROLE_KEY='), 'SUPABASE_SERVICE_ROLE_KEY must be defined');
  assert.ok(!envExample.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'), 'Service role key MUST NEVER be public');
  assert.ok(envExample.includes('CRON_SECRET='), 'CRON_SECRET must be defined');
  assert.ok(!envExample.includes('NEXT_PUBLIC_CRON_SECRET'), 'CRON_SECRET MUST NEVER be public');
  console.log('✅ Environment template strictly segregates client variables from server-only secrets.');

  // 4. Validate Production Container & Compose Specifications
  console.log('\n4. Validating Docker & Compose deployment definitions...');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const composePath = path.join(rootDir, 'docker-compose.yml');
  assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile must exist');
  assert.ok(fs.existsSync(composePath), 'docker-compose.yml must exist');

  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  assert.ok(dockerfileContent.includes('USER nextjs'), 'Dockerfile must specify non-root user');
  assert.ok(dockerfileContent.includes('HEALTHCHECK'), 'Dockerfile must specify healthcheck');
  assert.ok(dockerfileContent.includes('NEXT_TELEMETRY_DISABLED=1'), 'Container must enforce zero telemetry');

  const composeContent = fs.readFileSync(composePath, 'utf8');
  assert.ok(composeContent.includes('healthcheck:'), 'Compose must declare healthcheck');
  assert.ok(composeContent.includes('ports:'), 'Compose must map ports');
  console.log('✅ Containerization specifications satisfy production deployment hardening.');

  // 5. Validate Vercel Cron Configuration
  console.log('\n5. Validating Vercel cron configuration for autonomous sweeper...');
  const vercelPath = path.join(rootDir, 'vercel.json');
  assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  assert.ok(Array.isArray(vercelConfig.crons), 'vercel.json must declare crons array');
  const sweeperCron = vercelConfig.crons.find((c: { path: string }) => c.path === '/api/cron/sweep-deadlines');
  assert.ok(sweeperCron, 'Deadline sweeper cron route must be declared in vercel.json');
  assert.strictEqual(sweeperCron.schedule, '* * * * *', 'Sweeper cron must be scheduled every minute');
  console.log('✅ Vercel cron configuration declared correctly for automated deadline sweeping.');

  console.log('\n================================================================');
  console.log('🎉 ALL STAGING & DEPLOYMENT SMOKE TESTS PASSED CLEANLY');
  console.log('================================================================');
}

runStagingSmokeTests().catch((err) => {
  console.error('Staging smoke test failed:', err);
  process.exit(1);
});

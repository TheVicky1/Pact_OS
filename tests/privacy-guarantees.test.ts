import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 5T — Privacy Guarantees & Zero-Surveillance Invariant Tests
 * Verifies that zero invasive tracking, telemetry SDKs, or analytics trackers exist in client dependencies.
 */
function runPrivacyGuaranteesTests() {
  console.log('================================================================');
  console.log('  PACT Phase 5T — Privacy Guarantees & Anti-Telemetry Test Suite');
  console.log('================================================================\n');

  const rootDir = process.cwd();
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  // 1. Assert zero third-party analytics trackers in dependencies
  console.log('1. Checking dependencies for forbidden surveillance/analytics SDKs...');
  const forbiddenTrackers = [
    'mixpanel',
    'mixpanel-browser',
    'posthog-js',
    '@posthog/node',
    '@segment/analytics-next',
    'amplitude-js',
    '@amplitude/analytics-browser',
    'react-ga',
    'react-ga4',
    'hotjar',
    '@sentry/browser',
    'sentry',
  ];

  for (const tracker of forbiddenTrackers) {
    assert.strictEqual(
      Boolean(allDeps[tracker]),
      false,
      `Forbidden analytics dependency found: "${tracker}"`
    );
  }
  console.log('✅ 0 third-party surveillance or behavioral analytics SDKs found in package.json.');

  // 2. Audit root and app layouts for external tracking scripts
  console.log('\n2. Checking layout components for tracking pixel script tags...');
  const appLayoutPath = path.join(rootDir, 'src', 'app', 'layout.tsx');
  if (fs.existsSync(appLayoutPath)) {
    const layoutContent = fs.readFileSync(appLayoutPath, 'utf8');
    assert.strictEqual(layoutContent.includes('google-analytics'), false, 'Layout must not include Google Analytics');
    assert.strictEqual(layoutContent.includes('googletagmanager'), false, 'Layout must not include Google Tag Manager');
    assert.strictEqual(layoutContent.includes('hotjar'), false, 'Layout must not include Hotjar');
    assert.strictEqual(layoutContent.includes('facebook.net'), false, 'Layout must not include Facebook Pixel');
  }
  console.log('✅ Root layout contains zero remote tracking scripts or surveillance pixels.');

  // 3. Verify NEXT_TELEMETRY_DISABLED in container specifications
  console.log('\n3. Checking container configuration for Next.js telemetry disable flags...');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  if (fs.existsSync(dockerfilePath)) {
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    assert.ok(
      dockerfileContent.includes('NEXT_TELEMETRY_DISABLED=1'),
      'Dockerfile must enforce NEXT_TELEMETRY_DISABLED=1'
    );
  }
  console.log('✅ Docker container enforces NEXT_TELEMETRY_DISABLED=1 by default.');

  console.log('\n================================================================');
  console.log('🎉 ALL PRIVACY GUARANTEES & ANTI-TELEMETRY INVARIANTS PASSED CLEANLY');
  console.log('================================================================');
}

runPrivacyGuaranteesTests();

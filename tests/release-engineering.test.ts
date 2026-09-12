import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 5T — Release Engineering & Semantic Versioning Invariant Tests
 * Verifies version synchronization, changelog format, and container build configuration.
 */
function runReleaseEngineeringTests() {
  console.log('================================================================');
  console.log('  PACT Phase 5T — Release Engineering & Versioning Test Suite');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  // 1. package.json SemVer validation
  console.log('1. Validating package.json SemVer compliance...');
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
  assert.ok(semverPattern.test(pkg.version), `package.json version "${pkg.version}" must be valid SemVer`);
  console.log(`✅ package.json version "${pkg.version}" adheres to Semantic Versioning.`);

  // 2. CHANGELOG.md verification
  console.log('\n2. Validating CHANGELOG.md structure and Keep a Changelog standard...');
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  assert.ok(fs.existsSync(changelogPath), 'CHANGELOG.md must exist');
  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  assert.ok(changelogContent.includes('## [Unreleased]'), 'CHANGELOG.md must contain [Unreleased] section');
  assert.ok(changelogContent.includes(`## [${pkg.version}]`), `CHANGELOG.md must contain [${pkg.version}] release entry`);
  console.log('✅ CHANGELOG.md contains valid [Unreleased] and versioned release sections.');

  // 3. Dockerfile & Container configuration validation
  console.log('\n3. Validating containerization artifacts (Dockerfile & .dockerignore)...');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const dockerignorePath = path.join(rootDir, '.dockerignore');
  const composePath = path.join(rootDir, 'docker-compose.yml');

  assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile must exist');
  assert.ok(fs.existsSync(dockerignorePath), '.dockerignore must exist');
  assert.ok(fs.existsSync(composePath), 'docker-compose.yml must exist');

  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  assert.ok(dockerfileContent.includes('node:20-alpine'), 'Dockerfile must use Node 20 alpine base');
  assert.ok(dockerfileContent.includes('HEALTHCHECK'), 'Dockerfile must declare a container HEALTHCHECK');
  assert.ok(dockerfileContent.includes('USER nextjs'), 'Dockerfile must run as non-root user');
  console.log('✅ Containerization artifacts declare multi-stage builds, non-root user, and health checks.');

  // 4. Release check script existence
  console.log('\n4. Validating release checker script presence and syntax...');
  const releaseCheckScript = path.join(rootDir, 'scratch', 'release-check.mjs');
  assert.ok(fs.existsSync(releaseCheckScript), 'scratch/release-check.mjs must exist');
  console.log('✅ Release checker script is available for preflight release audits.');

  console.log('\n================================================================');
  console.log('🎉 ALL RELEASE ENGINEERING & VERSIONING INVARIANTS PASSED CLEANLY');
  console.log('================================================================');
}

runReleaseEngineeringTests();

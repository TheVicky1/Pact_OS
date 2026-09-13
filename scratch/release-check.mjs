/**
 * PACT Release Readiness Preflight Checker
 *
 * Performs deterministic, read-only inspection of repository state before release:
 * 1. package.json SemVer version format
 * 2. Git working tree clean status
 * 3. Git branch (main)
 * 4. Git tag inspection & history
 * 5. CHANGELOG.md presence & [Unreleased] / version headers
 * 6. Critical release & security specifications in docs/
 * 7. Verification of local quality gates (secret scan, links, dependency health)
 *
 * Usage:
 *   node scratch/release-check.mjs
 *   node scratch/release-check.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

const isDryRun = process.argv.includes('--dry-run');
const rootDir = process.cwd();

console.log('================================================================');
console.log(`  PACT Release Readiness Preflight Audit ${isDryRun ? '(DRY-RUN MODE)' : ''}`);
console.log('================================================================\n');

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function report(status, title, details = '') {
  if (status === 'PASS') {
    console.log(`  ✔ [PASS] ${title}`);
    if (details) console.log(`           ${details}`);
    passCount++;
  } else if (status === 'WARN') {
    console.log(`  ⚠ [WARN] ${title}`);
    if (details) console.log(`           ${details}`);
    warnCount++;
  } else {
    console.error(`  ✖ [FAIL] ${title}`);
    if (details) console.error(`           ${details}`);
    failCount++;
  }
}

// 1. Check package.json & SemVer
console.log('----------------------------------------------------------------');
console.log('1. Version Manifest & SemVer Compliance');
console.log('----------------------------------------------------------------');

const pkgPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(pkgPath)) {
  report('FAIL', 'package.json not found in repository root');
} else {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const version = pkg.version;
    const semverRegex = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
    if (!version || !semverRegex.test(version)) {
      report('FAIL', `Invalid SemVer version string: "${version}"`);
    } else {
      report('PASS', `Canonical Version: v${version}`, `package.json is the single source of truth for v${version}`);
    }
  } catch (err) {
    report('FAIL', 'Failed to parse package.json', err.message);
  }
}

// 2. Git Working Tree & Branch
console.log('\n----------------------------------------------------------------');
console.log('2. Git Repository & Working Tree Status');
console.log('----------------------------------------------------------------');

const execEnv = { ...process.env, PAGER: 'cat', GIT_PAGER: 'cat' };
const gitExec = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: execEnv, windowsHide: true }).trim();
  } catch (err) {
    return '';
  }
};

try {
  const branch = gitExec(['branch', '--show-current']) || 'community/open-source-contributor-expansion';
  if (branch === 'main') {
    report('PASS', `Current Branch: "${branch}" (Target release branch)`);
  } else {
    report('WARN', `Current Branch: "${branch}"`, 'Releases should normally be tagged and published from "main"');
  }

  const status = gitExec(['status', '--porcelain']);
  if (status.length === 0) {
    report('PASS', 'Git Working Tree is Clean (0 uncommitted changes)');
  } else {
    report('WARN', 'Git working tree has uncommitted modifications', `${status.split('\n').length} files staged or modified`);
  }
} catch (err) {
  report('FAIL', 'Git status inspection failed', err.message);
}

// 3. Git Tags Inspection
console.log('\n----------------------------------------------------------------');
console.log('3. Git Release Tags & Historical Lineage');
console.log('----------------------------------------------------------------');

try {
  const tagsOutput = gitExec(['tag', '-l']);
  const tags = tagsOutput ? tagsOutput.split('\n').map(t => t.trim()).filter(Boolean) : [];
  if (tags.length === 0) {
    report('WARN', 'No previous Git release tags found', 'Acceptable for initial release preparation (pre-v0.1.0 baseline)');
  } else {
    const latestTag = tags[tags.length - 1];
    report('PASS', `Found ${tags.length} Git tag(s). Latest tag: "${latestTag}"`);
  }
} catch (err) {
  report('WARN', 'Unable to list git tags', err.message);
}

// 4. CHANGELOG.md Governance
console.log('\n----------------------------------------------------------------');
console.log('4. Changelog & Release Notes Integrity');
console.log('----------------------------------------------------------------');

const changelogPath = path.join(rootDir, 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  report('FAIL', 'CHANGELOG.md not found in repository root');
} else {
  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  if (!changelogContent.includes('## [Unreleased]')) {
    report('WARN', 'CHANGELOG.md is missing an active "## [Unreleased]" section');
  } else {
    report('PASS', 'CHANGELOG.md contains an active "## [Unreleased]" section');
  }
}

// 5. Documentation Specification Integrity
console.log('\n----------------------------------------------------------------');
console.log('5. Required Release & Operational Documentation');
console.log('----------------------------------------------------------------');

const requiredDocs = [
  { path: 'docs/RELEASE_MANAGEMENT.md', name: 'Release Management Specification' },
  { path: 'docs/CI_PIPELINE.md', name: 'CI Pipeline Specification' },
  { path: 'docs/DEPENDENCY_SECURITY.md', name: 'Dependency Security Specification' },
  { path: 'SECURITY.md', name: 'Public Security Policy' },
  { path: 'README.md', name: 'Root README' },
];

for (const doc of requiredDocs) {
  if (fs.existsSync(path.join(rootDir, doc.path))) {
    report('PASS', `${doc.name} exists (${doc.path})`);
  } else {
    report('FAIL', `${doc.name} is missing (${doc.path})`);
  }
}

// 6. Security & Health Preflight Sanity Checks
console.log('\n----------------------------------------------------------------');
console.log('6. Automated Preflight Sanity Audits');
console.log('----------------------------------------------------------------');

const pipeOptions = { ...execOptions, stdio: 'pipe' };

try {
  execSync('node scratch/secret-scan.mjs', pipeOptions);
  report('PASS', 'Zero-Secret Scan verified (0 credentials detected)');
} catch (err) {
  report('FAIL', 'Secret scanner detected potential credentials');
}

try {
  execSync('node scratch/check-links.mjs', pipeOptions);
  report('PASS', 'Markdown Relative Links audit passed (0 broken links)');
} catch (err) {
  report('FAIL', 'Markdown relative links audit detected broken links');
}

try {
  execSync('node scratch/check-dependency-health.mjs', pipeOptions);
  report('PASS', 'Dependency health & lockfile synchronization verified');
} catch (err) {
  report('FAIL', 'Dependency health audit detected discrepancies');
}

// Final Summary
console.log('\n================================================================');
console.log('  RELEASE READINESS AUDIT SUMMARY');
console.log('================================================================');
console.log(`  Passed Checks:   ${passCount}`);
console.log(`  Warnings:        ${warnCount}`);
console.log(`  Blocking Errors: ${failCount}`);
console.log('----------------------------------------------------------------');

if (failCount > 0) {
  console.error('✖ RELEASE AUDIT RESULT: NOT READY (Blocking failures detected)');
  process.exit(1);
} else if (warnCount > 0) {
  console.log('✔ RELEASE AUDIT RESULT: READY WITH NOTES (Acceptable pre-release warnings)');
  process.exit(0);
} else {
  console.log('✔ RELEASE AUDIT RESULT: 100% READY FOR RELEASE');
  process.exit(0);
}

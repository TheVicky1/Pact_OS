import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const testDir = path.resolve(process.cwd(), 'tests');
const nodeBin = process.execPath;
const jitiCli = path.resolve(process.cwd(), 'node_modules/jiti/lib/jiti-cli.mjs');

// Authoritative offline unit, domain, security, and integration test suites (48 suites)
const liveDbTests = new Set([
  'live-supabase-connection.test.ts',
  'core-domain-adversarial.test.ts',
]);

const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.ts'))
  .filter(f => !liveDbTests.has(f));

console.log(`================================================================`);
console.log(`  PACT Test Runner: Running ${files.length} Authoritative Test Suites`);
console.log(`================================================================\n`);

let passed = 0;
let failed = 0;
const results = [];

for (const file of files) {
  const filePath = path.join(testDir, file);
  console.log(`\n------------------------------------------------------------`);
  console.log(`▶ Running Suite: ${file}`);
  console.log(`------------------------------------------------------------`);
  
  const start = Date.now();
  const res = spawnSync(nodeBin, [jitiCli, filePath], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  const duration = Date.now() - start;

  if (res.status === 0) {
    console.log(`✔ ${file} PASSED (${duration}ms)`);
    passed++;
    results.push({ file, status: 'PASS', duration });
  } else {
    console.error(`✖ ${file} FAILED with exit code ${res.status} (${duration}ms)`);
    failed++;
    results.push({ file, status: 'FAIL', duration });
  }
}

console.log(`\n================================================================`);
console.log(`  TEST SUMMARY`);
console.log(`================================================================`);
for (const r of results) {
  console.log(`  ${r.status === 'PASS' ? '✔' : '✖'} ${r.file} [${r.status}] (${r.duration}ms)`);
}
console.log(`----------------------------------------------------------------`);
console.log(`Total Suites: ${files.length} | Passed: ${passed} | Failed: ${failed}`);
console.log(`================================================================\n`);

process.exit(failed > 0 ? 1 : 0);

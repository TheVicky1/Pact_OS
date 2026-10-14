import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Issue #308 — Web Vitals Playbook documentation contract.
 *
 * The playbook only does its job if it exists, covers the metrics the issue
 * names, stays grounded in the primitives this repository actually ships, and
 * remains reachable from the documentation index. These assertions pin that
 * contract so a rename, a dropped section, or an orphaned file fails the suite
 * instead of silently rotting.
 */

const rootDir = process.cwd();
const playbookPath = path.join(rootDir, 'docs', 'WEB_VITALS_PLAYBOOK.md');

test('Web Vitals Playbook — documentation contract', async (t) => {
  await t.test('the playbook exists', () => {
    assert.ok(
      fs.existsSync(playbookPath),
      'docs/WEB_VITALS_PLAYBOOK.md must exist',
    );
  });

  const playbook = fs.readFileSync(playbookPath, 'utf8');

  await t.test('covers LCP, INP and CLS', () => {
    for (const metric of ['LCP', 'INP', 'CLS']) {
      assert.ok(playbook.includes(metric), `playbook must cover ${metric}`);
    }
  });

  await t.test('documents the LCP tactics the issue names', () => {
    assert.match(playbook, /image preloading/i, 'playbook must cover image preloading');
    assert.match(playbook, /font-display:\s*swap/i, 'playbook must cover font display swap');
    assert.match(playbook, /containment/i, 'playbook must cover layout containment');
  });

  await t.test('documents the INP tactics the issue names', () => {
    assert.match(playbook, /task splitting/i, 'playbook must cover task splitting');
    assert.match(playbook, /debounc/i, 'playbook must cover debouncing');
    assert.match(playbook, /main[- ]thread/i, 'playbook must cover main-thread responsiveness');
  });

  await t.test('stays grounded in the repository primitives it references', () => {
    for (const file of [
      'src/lib/observability/render-budget.ts',
      'src/lib/idle-task.ts',
      'src/hooks/useIdleTask.ts',
      'src/hooks/use-url-state.ts',
      'src/app/layout.tsx',
    ]) {
      assert.ok(playbook.includes(file), `playbook must reference ${file}`);
      assert.ok(fs.existsSync(path.join(rootDir, file)), `${file} must exist`);
    }
  });

  await t.test('is linked from the documentation index and the root README', () => {
    const docsIndex = fs.readFileSync(path.join(rootDir, 'docs', 'README.md'), 'utf8');
    const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');

    assert.ok(
      docsIndex.includes('WEB_VITALS_PLAYBOOK.md'),
      'docs/README.md must link the playbook',
    );
    assert.ok(
      readme.includes('docs/WEB_VITALS_PLAYBOOK.md'),
      'README.md must link the playbook',
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 8: PWA Manifest & Service Worker Compliance', () => {
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
  const swPath = path.resolve(process.cwd(), 'public/sw.js');

  it('verifies manifest.json exists and adheres to PWA v2 specification', () => {
    assert.equal(fs.existsSync(manifestPath), true, 'manifest.json must exist in public/');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    assert.equal(manifest.name, 'PACT OS');
    assert.equal(manifest.short_name, 'PACT');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.orientation, 'portrait-primary');
    assert.equal(manifest.start_url, '/app');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.background_color, '#09090b');
    assert.equal(manifest.theme_color, '#d4af37');
    assert.ok(Array.isArray(manifest.categories), 'Manifest must declare categories');
    assert.ok(manifest.categories.includes('productivity'));

    // Validate Icons
    assert.ok(Array.isArray(manifest.icons), 'Manifest must declare icons');
    assert.ok(manifest.icons.length >= 2, 'Manifest must have at least 192x192 and 512x512 icons');
    const sizes = manifest.icons.map((i: any) => i.sizes);
    assert.ok(sizes.includes('192x192'), '192x192 icon required');
    assert.ok(sizes.includes('512x512'), '512x512 icon required');

    // Validate Shortcuts
    assert.ok(Array.isArray(manifest.shortcuts), 'Manifest must declare app shortcuts');
    assert.ok(manifest.shortcuts.length >= 2, 'Manifest should provide quick app shortcuts');
    const shortcutUrls = manifest.shortcuts.map((s: any) => s.url);
    assert.ok(shortcutUrls.includes('/app/focus'), 'Focus Timer shortcut must exist');
  });

  it('verifies Service Worker sw.js implements security and caching policies', () => {
    assert.equal(fs.existsSync(swPath), true, 'sw.js must exist in public/');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Caching policy assertions
    assert.ok(swContent.includes('pact-static-v1'), 'SW must declare cache versioning');
    assert.ok(swContent.includes('install'), 'SW must handle install event');
    assert.ok(swContent.includes('activate'), 'SW must handle activate event');
    assert.ok(swContent.includes('fetch'), 'SW must handle fetch event');

    // Zero private data caching invariant
    assert.ok(
      swContent.includes('/api/') || swContent.includes('supabase.co'),
      'SW must explicitly filter out authenticated API/Supabase traffic from caching'
    );
  });
});

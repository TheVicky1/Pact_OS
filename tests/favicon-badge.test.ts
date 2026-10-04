/**
 * Unit tests for the favicon badge utility's canvas and DOM-mutation logic.
 * Exercises formatBadgeCount, drawFaviconBadge and applyFaviconBadge directly,
 * against plain-object stubs satisfying FaviconCanvas/FaviconTarget, rather
 * than a real canvas (which would need a DOM-emulation dependency this
 * project doesn't have).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBadgeCount,
  drawFaviconBadge,
  applyFaviconBadge,
  DEFAULT_FAVICON_HREF,
  FaviconCanvas,
  FaviconTarget,
} from '../src/utils/favicon-badge';

type Call = { method: string; args: unknown[] };

function createStubCanvas(): FaviconCanvas & { calls: Call[] } {
  const calls: Call[] = [];
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    clearRect: (...args: unknown[]) => calls.push({ method: 'clearRect', args }),
    beginPath: (...args: unknown[]) => calls.push({ method: 'beginPath', args }),
    arc: (...args: unknown[]) => calls.push({ method: 'arc', args }),
    fill: (...args: unknown[]) => calls.push({ method: 'fill', args }),
    fillText: (...args: unknown[]) => calls.push({ method: 'fillText', args }),
  };
  return {
    width: 32,
    height: 32,
    calls,
    getContext: () => ctx,
    toDataURL: () => 'data:image/png;base64,stub',
  };
}

function createStubDocument(initialHref = DEFAULT_FAVICON_HREF): FaviconTarget & { link: { href: string } } {
  const link = { href: initialHref };
  return {
    link,
    querySelector(selector: string) {
      return selector === "link[rel~='icon']" ? link : null;
    },
    createElement() {
      return createStubCanvas();
    },
  };
}

describe('formatBadgeCount', () => {
  it('shows the exact count under the cap', () => {
    assert.equal(formatBadgeCount(1), '1');
    assert.equal(formatBadgeCount(42), '42');
    assert.equal(formatBadgeCount(99), '99');
  });

  it('caps the display at "99+" above the cap', () => {
    assert.equal(formatBadgeCount(100), '99+');
    assert.equal(formatBadgeCount(1000), '99+');
  });
});

describe('drawFaviconBadge', () => {
  it('clears the canvas, fills a circle, then draws the count text on top', () => {
    const canvas = createStubCanvas();
    drawFaviconBadge(canvas, 3);

    const methods = canvas.calls.map((c) => c.method);
    assert.deepEqual(methods, ['clearRect', 'beginPath', 'arc', 'fill', 'fillText']);
  });

  it('draws the circle centered and sized to the canvas', () => {
    const canvas = createStubCanvas();
    drawFaviconBadge(canvas, 5);

    const arcCall = canvas.calls.find((c) => c.method === 'arc');
    assert.deepEqual(arcCall?.args, [16, 16, 16, 0, Math.PI * 2]);
  });

  it('draws the formatted count as the badge text', () => {
    const canvas = createStubCanvas();
    drawFaviconBadge(canvas, 150);

    const textCall = canvas.calls.find((c) => c.method === 'fillText');
    assert.equal(textCall?.args[0], '99+');
  });

  it('returns the canvas data URL', () => {
    const canvas = createStubCanvas();
    assert.equal(drawFaviconBadge(canvas, 1), 'data:image/png;base64,stub');
  });
});

describe('applyFaviconBadge', () => {
  it('sets the favicon href to the badge data URL when there are unread items', () => {
    const doc = createStubDocument();
    applyFaviconBadge(doc, 4);
    assert.equal(doc.link.href, 'data:image/png;base64,stub');
  });

  it('restores the original favicon href when the count drops to zero', () => {
    const doc = createStubDocument();
    applyFaviconBadge(doc, 4);
    applyFaviconBadge(doc, 0);
    assert.equal(doc.link.href, DEFAULT_FAVICON_HREF);
  });

  it('restores a caller-supplied original href, not just the default', () => {
    const doc = createStubDocument('/icon.png');
    applyFaviconBadge(doc, 4);
    applyFaviconBadge(doc, 0, '/icon.png');
    assert.equal(doc.link.href, '/icon.png');
  });

  it('also restores on a negative count', () => {
    const doc = createStubDocument();
    applyFaviconBadge(doc, 4);
    applyFaviconBadge(doc, -1);
    assert.equal(doc.link.href, DEFAULT_FAVICON_HREF);
  });

  it('does nothing when there is no icon link element', () => {
    const doc: FaviconTarget = {
      querySelector: () => null,
      createElement: () => createStubCanvas(),
    };
    assert.doesNotThrow(() => applyFaviconBadge(doc, 4));
  });

  it('updates the badge across consecutive calls, simulating the count changing', () => {
    const doc = createStubDocument();
    applyFaviconBadge(doc, 1);
    const first = doc.link.href;
    applyFaviconBadge(doc, 2);
    assert.equal(doc.link.href, first); // both are the stub data URL; the real canvas content differs
    applyFaviconBadge(doc, 0);
    assert.equal(doc.link.href, DEFAULT_FAVICON_HREF);
  });
});

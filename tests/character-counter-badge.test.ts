
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, {
  jsx: true,
  alias: { '@': path.resolve('src') },
});

const { CharacterCounterBadge } = jiti(
  '../src/components/ui/character-counter-badge.tsx',
) as typeof import('../src/components/ui/character-counter-badge');

function renderBadge(props: {
  currentLength: number;
  maxLength: number;
  warningThreshold?: number;
  isFocused?: boolean;
}) {
  return renderToStaticMarkup(
    React.createElement(CharacterCounterBadge, props),
  );
}

describe('CharacterCounterBadge', () => {
  it('shows the count with a neutral badge below the warning threshold', () => {
    const html = renderBadge({ currentLength: 50, maxLength: 100 });

    assert.ok(html.includes('50 / 100'));
    assert.ok(html.includes('bg-zinc-800/70'));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes('aria-live="polite"'));
  });

  it('uses a warning badge at 80 percent of the limit', () => {
    const html = renderBadge({ currentLength: 80, maxLength: 100 });

    assert.ok(html.includes('bg-amber-950/40'));
    assert.ok(html.includes('80 / 100'));
  });

  it('uses a danger badge when the limit is exceeded', () => {
    const html = renderBadge({ currentLength: 101, maxLength: 100 });

    assert.ok(html.includes('bg-red-950/40'));
    assert.ok(html.includes('101 / 100'));
  });

  it('hides the badge when empty and unfocused', () => {
    const html = renderBadge({
      currentLength: 0,
      maxLength: 100,
      isFocused: false,
    });

    assert.equal(html, '');
  });

  it('shows the badge when empty but focused', () => {
    const html = renderBadge({
      currentLength: 0,
      maxLength: 100,
      isFocused: true,
    });

    assert.ok(html.includes('0 / 100'));
  });
});

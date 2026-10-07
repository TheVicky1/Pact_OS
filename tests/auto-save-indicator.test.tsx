import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { jsx: true, alias: { '@': path.resolve('src') } });
const {
  AutoSaveIndicator,
  formatRelativeTime,
} = jiti('../src/components/settings/auto-save-indicator.tsx') as typeof import('../src/components/settings/auto-save-indicator');

describe('AutoSaveIndicator Component', () => {
  it('renders idle status state correctly with text and icon', () => {
    const html = renderToStaticMarkup(React.createElement(AutoSaveIndicator, { status: 'idle' }));
    assert.match(html, /Idle/);
    assert.match(html, /data-testid="icon-idle"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /role="status"/);
  });

  it('renders saving status state correctly with spinner icon', () => {
    const html = renderToStaticMarkup(React.createElement(AutoSaveIndicator, { status: 'saving' }));
    assert.match(html, /Saving\.\.\./);
    assert.match(html, /data-testid="icon-saving"/);
    assert.match(html, /animate-spin/);
  });

  it('renders saved status state correctly with checkmark icon', () => {
    const html = renderToStaticMarkup(React.createElement(AutoSaveIndicator, { status: 'saved' }));
    assert.match(html, /Saved/);
    assert.match(html, /data-testid="icon-saved"/);
  });

  it('renders error status state correctly with alert icon', () => {
    const html = renderToStaticMarkup(React.createElement(AutoSaveIndicator, { status: 'error' }));
    assert.match(html, /Failed to save/);
    assert.match(html, /data-testid="icon-error"/);
  });

  it('ensures container has required aria-live="polite" attribute across all states', () => {
    for (const status of ['idle', 'saving', 'saved', 'error'] as const) {
      const html = renderToStaticMarkup(React.createElement(AutoSaveIndicator, { status }));
      assert.match(html, /aria-live="polite"/, `Status ${status} must have aria-live="polite"`);
      assert.match(html, /role="status"/, `Status ${status} must have role="status"`);
    }
  });

  it('displays formatted relative time tooltip on hover when saved with lastSavedAt', () => {
    const now = new Date();
    const twoSecAgo = new Date(now.getTime() - 2000);
    const html = renderToStaticMarkup(
      React.createElement(AutoSaveIndicator, { status: 'saved', lastSavedAt: twoSecAgo })
    );

    assert.match(html, /Saved 2 seconds ago/);
    assert.match(html, /role="tooltip"/);
    assert.match(html, /title="Saved 2 seconds ago"/);
  });

  it('does not render tooltip when lastSavedAt is missing or status is not saved', () => {
    const htmlWithoutDate = renderToStaticMarkup(
      React.createElement(AutoSaveIndicator, { status: 'saved' })
    );
    assert.ok(!htmlWithoutDate.includes('role="tooltip"'));

    const htmlSavingWithDate = renderToStaticMarkup(
      React.createElement(AutoSaveIndicator, { status: 'saving', lastSavedAt: new Date() })
    );
    assert.ok(!htmlSavingWithDate.includes('role="tooltip"'));
  });

  it('merges custom className prop correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(AutoSaveIndicator, { status: 'saved', className: 'custom-indicator-class' })
    );
    assert.match(html, /custom-indicator-class/);
  });
});

describe('formatRelativeTime helper', () => {
  it('formats recent timestamps accurately', () => {
    const now = new Date('2026-10-07T12:00:00Z');

    assert.equal(formatRelativeTime(now, now), 'Saved just now');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 1000), now), 'Saved just now');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 2000), now), 'Saved 2 seconds ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 45000), now), 'Saved 45 seconds ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 60000), now), 'Saved 1 minute ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 300000), now), 'Saved 5 minutes ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 3600000), now), 'Saved 1 hour ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 7200000), now), 'Saved 2 hours ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 86400000), now), 'Saved 1 day ago');
    assert.equal(formatRelativeTime(new Date(now.getTime() - 172800000), now), 'Saved 2 days ago');
  });
});

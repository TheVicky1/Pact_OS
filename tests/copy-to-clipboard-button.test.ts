/**
 * Unit tests for CopyToClipboardButton.
 * The copy/feedback-timer logic lives in copyWithFeedback and is exercised directly
 * with a mocked Clipboard API and mocked timers; markup is checked via SSR
 * (mounting would need a DOM-emulation dependency this project doesn't have).
 */

import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { jsx: true, alias: { '@': path.resolve('src') } });
const { CopyToClipboardButton, copyWithFeedback, COPY_FEEDBACK_MS } = jiti(
  '../src/components/ui/copy-to-clipboard-button.tsx'
) as typeof import('../src/components/ui/copy-to-clipboard-button');

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { clipboard: { writeText: mock.fn(writeText) } },
    configurable: true,
  });
  return (globalThis.navigator.clipboard.writeText as unknown as ReturnType<typeof mock.fn>).mock;
}

describe('copyWithFeedback', () => {
  beforeEach(() => mock.timers.enable({ apis: ['setTimeout'] }));
  afterEach(() => mock.timers.reset());

  it('writes the exact text to the clipboard', async () => {
    const calls = stubClipboard(async () => {});
    assert.equal(await copyWithFeedback('https://pact.os/invite/abc', () => {}, {}), true);
    assert.equal(calls.callCount(), 1);
    assert.deepEqual(calls.calls[0].arguments, ['https://pact.os/invite/abc']);
  });

  it('shows the copied state, then restores it after the feedback window', async () => {
    stubClipboard(async () => {});
    const states: boolean[] = [];
    await copyWithFeedback('x', (c) => states.push(c), {});
    assert.deepEqual(states, [true]);

    mock.timers.tick(COPY_FEEDBACK_MS - 1);
    assert.deepEqual(states, [true], 'still showing the check icon just before the timeout');

    mock.timers.tick(1);
    assert.deepEqual(states, [true, false], 'restored to the copy icon after the timeout');
  });

  it('a second copy restarts the feedback window instead of resetting early', async () => {
    stubClipboard(async () => {});
    const states: boolean[] = [];
    const timer = {};
    await copyWithFeedback('x', (c) => states.push(c), timer);
    mock.timers.tick(1500);
    await copyWithFeedback('x', (c) => states.push(c), timer);
    mock.timers.tick(1500);
    assert.deepEqual(states, [true, true], 'first timer must have been cancelled');
    mock.timers.tick(500);
    assert.deepEqual(states, [true, true, false]);
  });

  it('returns false and leaves state untouched when the clipboard rejects', async () => {
    stubClipboard(async () => {
      throw new Error('NotAllowedError');
    });
    const states: boolean[] = [];
    assert.equal(await copyWithFeedback('x', (c) => states.push(c), {}), false);
    mock.timers.tick(COPY_FEEDBACK_MS);
    assert.deepEqual(states, []);
  });

  it('returns false when the Clipboard API is unavailable (insecure context)', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    assert.equal(await copyWithFeedback('x', () => assert.fail('must not set state'), {}), false);
  });
});

describe('CopyToClipboardButton markup', () => {
  const render = (props: React.ComponentProps<typeof CopyToClipboardButton>) =>
    renderToStaticMarkup(React.createElement(CopyToClipboardButton, props));

  it('icon-only button is a keyboard-focusable <button> labelled "Copy to clipboard" with the copy icon', () => {
    const html = render({ textToCopy: 'abc' });
    assert.match(html, /<button[^>]*type="button"/);
    assert.match(html, /aria-label="Copy to clipboard"/);
    assert.match(html, /lucide-copy/);
    assert.doesNotMatch(html, /lucide-check/);
  });

  it('renders a visible label and uses it as the accessible name', () => {
    const html = render({ textToCopy: 'abc', label: 'Copy link' });
    assert.match(html, /aria-label="Copy link"/);
    assert.match(html, /<span>Copy link<\/span>/);
  });

  it('has an empty polite live region ready to announce success', () => {
    const html = render({ textToCopy: 'abc', successMessage: 'Link copied', className: 'ml-2' });
    assert.match(html, /<span role="status" aria-live="polite"[^>]*><\/span>/);
    assert.match(html, /class="inline-flex items-center gap-2 ml-2"/);
  });
});

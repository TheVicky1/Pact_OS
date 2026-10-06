/**
 * Unit tests for SearchInput's clear button and Escape-to-clear behaviour.
 * SearchInput is stateless, so it is called directly and its handlers invoked
 * (mounting it would need a DOM-emulation dependency this project doesn't have).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { jsx: true, alias: { '@': path.resolve('src') } });
const { SearchInput } = jiti('../src/components/ui/search-input.tsx') as typeof import('../src/components/ui/search-input');

type Props = React.ComponentProps<typeof SearchInput>;
type Children = [React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>> | ''];

function setup(value: string, extra: Partial<Props> = {}) {
  const calls: string[] = [];
  const props: Props = { value, onChange: (v) => calls.push(v), ...extra };
  const root = SearchInput(props) as React.ReactElement<{ children: Children }>;
  const [input, button] = root.props.children;
  return { props, calls, input, button };
}

function keyDown(key: string) {
  let prevented = false;
  return { event: { key, preventDefault: () => (prevented = true) } as unknown as React.KeyboardEvent<HTMLInputElement>, wasPrevented: () => prevented };
}

describe('SearchInput', () => {
  it('hides the clear button when the query is empty', () => {
    assert.equal(setup('').button, '');
    assert.ok(!renderToStaticMarkup(React.createElement(SearchInput, setup('').props)).includes('Clear search'));
  });

  it('shows an accessible clear button when the query is non-empty', () => {
    const html = renderToStaticMarkup(React.createElement(SearchInput, setup('focus').props));
    assert.match(html, /<button type="button" aria-label="Clear search"/);
    assert.match(html, /type="search"/);
    assert.match(html, /value="focus"/);
  });

  it('clicking the clear button resets the query', () => {
    const { button, calls } = setup('deep work');
    assert.ok(button);
    button.props.onClick?.({} as React.MouseEvent<HTMLButtonElement>);
    assert.deepEqual(calls, ['']);
  });

  it('Escape resets a non-empty query and prevents the default action', () => {
    const { input, calls } = setup('deep work');
    const { event, wasPrevented } = keyDown('Escape');
    input.props.onKeyDown?.(event);
    assert.deepEqual(calls, ['']);
    assert.equal(wasPrevented(), true);
  });

  it('Escape on an empty query does nothing, so parent Escape handlers (e.g. modals) still run', () => {
    const { input, calls } = setup('');
    const { event, wasPrevented } = keyDown('Escape');
    input.props.onKeyDown?.(event);
    assert.deepEqual(calls, []);
    assert.equal(wasPrevented(), false);
  });

  it('other keys do not clear, and a caller onKeyDown is still invoked', () => {
    const seen: string[] = [];
    const { input, calls } = setup('abc', { onKeyDown: (e) => seen.push(e.key) });
    input.props.onKeyDown?.(keyDown('Enter').event);
    input.props.onKeyDown?.(keyDown('Escape').event);
    assert.deepEqual(calls, ['']);
    assert.deepEqual(seen, ['Enter', 'Escape']);
  });

  it('typing forwards the raw string value to onChange', () => {
    const { input, calls } = setup('');
    input.props.onChange?.({ target: { value: 'hab' } } as React.ChangeEvent<HTMLInputElement>);
    assert.deepEqual(calls, ['hab']);
  });
});

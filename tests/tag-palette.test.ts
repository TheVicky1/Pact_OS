import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTagColorPalette } from '../src/lib/focus/tag-palette';

const FALLBACK_TEXT = 'text-zinc-400';

describe('getTagColorPalette', () => {
  it('returns the identical palette for identical tag names', () => {
    assert.deepEqual(getTagColorPalette('coding'), getTagColorPalette('coding'));
    assert.deepEqual(getTagColorPalette('deep-work'), getTagColorPalette('deep-work'));
  });

  it('is case-insensitive and ignores surrounding whitespace', () => {
    const base = getTagColorPalette('writing');
    assert.deepEqual(getTagColorPalette('WRITING'), base);
    assert.deepEqual(getTagColorPalette('  Writing  '), base);
  });

  it('ignores a leading # so #coding and coding share a color', () => {
    assert.deepEqual(getTagColorPalette('#coding'), getTagColorPalette('coding'));
    assert.deepEqual(getTagColorPalette('  #Deep-Work'), getTagColorPalette('deep-work'));
  });

  it('returns the neutral fallback for empty or non-string input', () => {
    const invalid: unknown[] = ['', '   ', '#', '##  ', null, undefined, 42, {}, []];
    for (const value of invalid) {
      assert.equal(getTagColorPalette(value as string).text, FALLBACK_TEXT);
    }
  });

  it('keeps colors stable across versions (pinned values)', () => {
    // 'a' = 97 -> 97 % 8 = 1 (emerald); 'b' = 98 -> 2 (sky)
    // 'ab' = 97 * 31 + 98 = 3105 -> 3105 % 8 = 1 (emerald)
    assert.equal(getTagColorPalette('a').text, 'text-emerald-400');
    assert.equal(getTagColorPalette('b').text, 'text-sky-400');
    assert.equal(getTagColorPalette('ab').text, 'text-emerald-400');
  });

  it('returns valid Tailwind class tokens for bg, text, and border', () => {
    for (const tag of ['coding', 'writing', 'deep-work', 'reading', '', 'a', 'b', 'c']) {
      const token = getTagColorPalette(tag);
      assert.match(token.bg, /^bg-[a-z]+-\d{2,3}\/\d{1,3}$/);
      assert.match(token.text, /^text-[a-z]+-\d{2,3}$/);
      assert.match(token.border, /^border-[a-z]+-\d{2,3}\/\d{1,3}$/);
    }
  });

  it('spreads different tags across multiple palettes', () => {
    const used = new Set<string>();
    for (let i = 0; i < 50; i++) {
      used.add(getTagColorPalette(`tag-${i}`).text);
    }
    assert.ok(used.size >= 4, `expected at least 4 palettes, got ${used.size}`);
  });

  it('does not let callers mutate the shared palette', () => {
    const token = getTagColorPalette('coding');
    assert.equal(Object.isFrozen(token), true);
  });
});
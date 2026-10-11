import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/lib/utils/slugify';

describe('slugify utility', () => {
  it('converts basic text to lowercase hyphenated slug', () => {
    assert.strictEqual(slugify('Hello World PACT'), 'hello-world-pact');
  });

  it('strips accents and diacritics cleanly', () => {
    assert.strictEqual(slugify('Café PACT Frühling'), 'cafe-pact-fruhling');
    assert.strictEqual(slugify('Señorita Crème Brûlée'), 'senorita-creme-brulee');
  });

  it('collapses multiple spaces, underscores, and hyphens into single hyphen', () => {
    assert.strictEqual(slugify('Focus   Deep___Work---Goal'), 'focus-deep-work-goal');
  });

  it('strips leading and trailing hyphens', () => {
    assert.strictEqual(slugify('---hello world---'), 'hello-world');
  });

  it('removes non-alphanumeric special characters', () => {
    assert.strictEqual(slugify('PACT: 100% Guaranteed! #Discipline'), 'pact-100-guaranteed-discipline');
  });

  it('respects maxLength constraint and trims trailing hyphen', () => {
    const long = 'this-is-a-very-long-string-that-should-be-truncated-appropriately';
    const result = slugify(long, { maxLength: 20 });
    assert.strictEqual(result.length <= 20, true);
    assert.strictEqual(result.endsWith('-'), false);
  });

  it('returns fallback for empty, non-string, or purely special character inputs', () => {
    assert.strictEqual(slugify(''), 'untitled');
    assert.strictEqual(slugify('   '), 'untitled');
    assert.strictEqual(slugify('$$$###@@@', { fallback: 'custom-default' }), 'custom-default');
    assert.strictEqual(slugify(null as unknown as string, { fallback: 'fallback-slug' }), 'fallback-slug');
  });
});

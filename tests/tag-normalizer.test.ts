import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTags } from '../src/lib/text/tag-normalizer';

describe('normalizeTags Unit Tests (#751)', () => {
  it('normalizes casing, leading hashes, and whitespace', () => {
    const raw = ['#Fitness', '  HEALTH  ', 'deep_work!'];
    const result = normalizeTags(raw);
    assert.deepStrictEqual(result, ['fitness', 'health', 'deepwork']);
  });

  it('replaces spaces with hyphens and cleans punctuation', () => {
    const raw = ['morning routine', 'habit & discipline', 'focus---now!'];
    const result = normalizeTags(raw);
    assert.deepStrictEqual(result, ['morning-routine', 'habit-discipline', 'focus-now']);
  });

  it('deduplicates case-insensitively and preserves first-seen order', () => {
    const raw = ['#Habit', 'habit', 'HABIT', 'wellness', '#WELLNESS', 'focus'];
    const result = normalizeTags(raw);
    assert.deepStrictEqual(result, ['habit', 'wellness', 'focus']);
  });

  it('filters out empty resulting strings', () => {
    const raw = ['', '   ', '###', '!!!', '@$%', 'valid'];
    const result = normalizeTags(raw);
    assert.deepStrictEqual(result, ['valid']);
  });

  it('truncates tags to maxTagLength and strips trailing hyphens', () => {
    const raw = ['a-very-long-tag-name-that-exceeds-the-limit-by-far'];
    const result = normalizeTags(raw, { maxTagLength: 15 });
    // "a-very-long-tag" -> length 15. If it ends in hyphen, trailing hyphen stripped.
    assert.strictEqual(result[0].length <= 15, true);
    assert.strictEqual(result[0].endsWith('-'), false);
    assert.strictEqual(result[0], 'a-very-long-tag');
  });

  it('limits total tags count to maxTagsCount', () => {
    const raw = ['t1', 't2', 't3', 't4', 't5', 't6'];
    const result = normalizeTags(raw, { maxTagsCount: 3 });
    assert.deepStrictEqual(result, ['t1', 't2', 't3']);
  });

  it('uses default maxTagLength (30) and default maxTagsCount (10)', () => {
    const raw = Array.from({ length: 15 }, (_, i) => `tag-${i}`);
    const result = normalizeTags(raw);
    assert.strictEqual(result.length, 10);
    assert.strictEqual(result[0], 'tag-0');
    assert.strictEqual(result[9], 'tag-9');
  });

  it('throws TypeError if rawTags is not an array', () => {
    assert.throws(() => normalizeTags(null as unknown as string[]), TypeError);
    assert.throws(() => normalizeTags('not-an-array' as unknown as string[]), TypeError);
    assert.throws(() => normalizeTags(123 as unknown as string[]), TypeError);
  });

  it('throws TypeError if rawTags contains non-string elements', () => {
    assert.throws(() => normalizeTags(['valid', 123 as unknown as string]), TypeError);
    assert.throws(() => normalizeTags([null as unknown as string]), TypeError);
    assert.throws(() => normalizeTags([{} as unknown as string]), TypeError);
  });
});

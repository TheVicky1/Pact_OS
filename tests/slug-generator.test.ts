import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSlug } from '../src/lib/data/slug-generator';

describe('generateSlug Unit Tests (#745)', () => {
  it('converts standard title to kebab-case slug', () => {
    assert.strictEqual(generateSlug('Morning Workout & Hydration! #1'), 'morning-workout-hydration-1');
    assert.strictEqual(generateSlug('Deep Work Session'), 'deep-work-session');
  });

  it('handles custom delimiter', () => {
    assert.strictEqual(generateSlug('Morning Workout Routine', { delimiter: '_' }), 'morning_workout_routine');
  });

  it('collapses multiple spaces, hyphens, and underscores', () => {
    assert.strictEqual(generateSlug('Task---With___Multiple   Spaces'), 'task-with-multiple-spaces');
  });

  it('strips leading and trailing delimiters and special characters', () => {
    assert.strictEqual(generateSlug('---!Clean Title?---'), 'clean-title');
    assert.strictEqual(generateSlug('...Goal Title 100%...'), 'goal-title-100');
  });

  it('strips emojis and special symbols', () => {
    assert.strictEqual(generateSlug('🚀 Ship V3 Cockpit! 🎯 #100'), 'ship-v3-cockpit-100');
  });

  it('handles diacritics and accents cleanly', () => {
    assert.strictEqual(generateSlug('Kế hoạch thực chiến'), 'ke-hoach-thuc-chien');
    assert.strictEqual(generateSlug('Café au Lait'), 'cafe-au-lait');
  });

  it('enforces maxLength and strips dangling delimiter', () => {
    const longTitle = 'a'.repeat(50) + ' ' + 'b'.repeat(50);
    const slug = generateSlug(longTitle, { maxLength: 80 });
    assert.ok(slug.length <= 80);
    assert.ok(!slug.endsWith('-'));
    assert.strictEqual(slug, 'a'.repeat(50) + '-' + 'b'.repeat(29));
  });

  it('returns empty string for string without alphanumeric characters', () => {
    assert.strictEqual(generateSlug(''), '');
    assert.strictEqual(generateSlug('   '), '');
    assert.strictEqual(generateSlug('!@#$%^&*()_+'), '');
    assert.strictEqual(generateSlug('🚀🎯🔥'), '');
  });

  it('throws TypeError if title is not a string', () => {
    assert.throws(() => generateSlug(null as unknown as string), TypeError);
    assert.throws(() => generateSlug(123 as unknown as string), TypeError);
    assert.throws(() => generateSlug(undefined as unknown as string), TypeError);
    assert.throws(() => generateSlug({} as unknown as string), TypeError);
  });
});

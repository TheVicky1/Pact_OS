import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateReadingTime } from '../src/lib/text/reading-time';

describe('Reading Time & Text Metrics Estimator', () => {
  describe('empty and whitespace-only strings', () => {
    it('returns zeroes and "0 min read" for empty string', () => {
      const result = estimateReadingTime('');
      assert.deepStrictEqual(result, {
        wordsCount: 0,
        charactersCount: 0,
        minutes: 0,
        seconds: 0,
        formattedLabel: '0 min read',
      });
    });

    it('returns zeroes and "0 min read" for whitespace-only strings', () => {
      const result = estimateReadingTime('   \t\n  \r\n   ');
      assert.deepStrictEqual(result, {
        wordsCount: 0,
        charactersCount: 0,
        minutes: 0,
        seconds: 0,
        formattedLabel: '0 min read',
      });
    });
  });

  describe('single word content', () => {
    it('estimates reading metrics for a single word', () => {
      const result = estimateReadingTime('Discipline');
      assert.strictEqual(result.wordsCount, 1);
      assert.strictEqual(result.charactersCount, 10);
      assert.strictEqual(result.minutes, 1);
      assert.strictEqual(result.seconds, 0); // Math.round((1 / 200) * 60) = 0
      assert.strictEqual(result.formattedLabel, '< 1 min read');
    });
  });

  describe('paragraph and markdown content with whitespace normalization', () => {
    it('collapses excessive whitespaces for character count and splits words correctly', () => {
      const text = 'Turn   Intent \n\n Into    Discipline ';
      const result = estimateReadingTime(text);
      assert.strictEqual(result.wordsCount, 4);
      // Normalized: "Turn Intent Into Discipline" -> 27 chars
      assert.strictEqual(result.charactersCount, 27);
      assert.strictEqual(result.minutes, 1);
      assert.strictEqual(result.seconds, 1); // Math.round((4 / 200) * 60) = 1
      assert.strictEqual(result.formattedLabel, '< 1 min read');
    });

    it('correctly handles typical multi-sentence paragraphs', () => {
      const paragraph =
        'Personal Productivity and Accountability OS helps you turn intent into discipline with server-authoritative commitments.';
      const result = estimateReadingTime(paragraph);
      const expectedWords = paragraph.match(/\S+/g)?.length ?? 0;
      assert.strictEqual(result.wordsCount, expectedWords);
      assert.strictEqual(result.charactersCount, paragraph.length);
      assert.strictEqual(result.formattedLabel, '< 1 min read');
    });
  });

  describe('custom words per minute (WPM)', () => {
    it('calculates metrics with custom WPM', () => {
      // 100 words at 100 WPM should be exactly 1 minute and 60 seconds
      const content = Array.from({ length: 100 }, (_, i) => `word${i + 1}`).join(' ');
      const result = estimateReadingTime(content, 100);

      assert.strictEqual(result.wordsCount, 100);
      assert.strictEqual(result.seconds, 60);
      assert.strictEqual(result.minutes, 1);
      assert.strictEqual(result.formattedLabel, '1 min read');
    });

    it('calculates metrics with faster reading speed', () => {
      // 200 words at 400 WPM should take 30 seconds
      const content = Array.from({ length: 200 }, (_, i) => `word${i + 1}`).join(' ');
      const result = estimateReadingTime(content, 400);

      assert.strictEqual(result.wordsCount, 200);
      assert.strictEqual(result.seconds, 30);
      assert.strictEqual(result.minutes, 1);
      assert.strictEqual(result.formattedLabel, '< 1 min read');
    });
  });

  describe('label formatting rules', () => {
    it('formats as "0 min read" when wordsCount is 0', () => {
      assert.strictEqual(estimateReadingTime('').formattedLabel, '0 min read');
    });

    it('formats as "< 1 min read" when seconds < 60', () => {
      // 50 words at 200 WPM -> 15 seconds
      const content = Array.from({ length: 50 }, (_, i) => `word${i + 1}`).join(' ');
      const result = estimateReadingTime(content, 200);
      assert.strictEqual(result.seconds, 15);
      assert.strictEqual(result.minutes, 1);
      assert.strictEqual(result.formattedLabel, '< 1 min read');
    });

    it('formats as "1 min read" when seconds >= 60 and minutes === 1', () => {
      // 200 words at 200 WPM -> 60 seconds, ceil(1) = 1 min
      const content = Array.from({ length: 200 }, (_, i) => `word${i + 1}`).join(' ');
      const result = estimateReadingTime(content, 200);
      assert.strictEqual(result.seconds, 60);
      assert.strictEqual(result.minutes, 1);
      assert.strictEqual(result.formattedLabel, '1 min read');
    });

    it('formats as "${minutes} min read" when minutes > 1', () => {
      // 250 words at 200 WPM -> 75 seconds, ceil(1.25) = 2 min
      const content250 = Array.from({ length: 250 }, (_, i) => `word${i + 1}`).join(' ');
      const result250 = estimateReadingTime(content250, 200);
      assert.strictEqual(result250.seconds, 75);
      assert.strictEqual(result250.minutes, 2);
      assert.strictEqual(result250.formattedLabel, '2 min read');

      // 600 words at 200 WPM -> 180 seconds, ceil(3) = 3 min
      const content600 = Array.from({ length: 600 }, (_, i) => `word${i + 1}`).join(' ');
      const result600 = estimateReadingTime(content600, 200);
      assert.strictEqual(result600.seconds, 180);
      assert.strictEqual(result600.minutes, 3);
      assert.strictEqual(result600.formattedLabel, '3 min read');
    });
  });

  describe('input validation', () => {
    it('throws TypeError if content is not a string', () => {
      assert.throws(() => estimateReadingTime(null as unknown as string), TypeError);
      assert.throws(() => estimateReadingTime(undefined as unknown as string), TypeError);
      assert.throws(() => estimateReadingTime(123 as unknown as string), TypeError);
      assert.throws(() => estimateReadingTime({} as unknown as string), TypeError);
    });

    it('throws TypeError if wordsPerMinute is not a positive number', () => {
      assert.throws(() => estimateReadingTime('hello', 0), TypeError);
      assert.throws(() => estimateReadingTime('hello', -10), TypeError);
      assert.throws(() => estimateReadingTime('hello', Number.NaN), TypeError);
      assert.throws(() => estimateReadingTime('hello', '200' as unknown as number), TypeError);
      assert.throws(() => estimateReadingTime('hello', null as unknown as number), TypeError);
    });
  });
});


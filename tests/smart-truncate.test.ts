import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { smartTruncate } from '../src/lib/text/smart-truncate';

describe('smartTruncate', () => {
  it('returns text unchanged when it fits within maxLength', () => {
    assert.strictEqual(smartTruncate('Build a habit', 13), 'Build a habit');
  });

  it('truncates at a whitespace boundary by default', () => {
    assert.strictEqual(
      smartTruncate('Master algorithmic problem solving', 24),
      'Master algorithmic…',
    );
  });

  it('removes trailing punctuation at a word boundary', () => {
    assert.strictEqual(
      smartTruncate('Review goals, then plan tomorrow', 16),
      'Review goals…',
    );
  });

  it('supports a custom ellipsis', () => {
    assert.strictEqual(
      smartTruncate('Keep the promise today', 14, { ellipsis: '...' }),
      'Keep the...',
    );
  });

  it('truncates directly to the budget when word boundaries are disabled', () => {
    assert.strictEqual(
      smartTruncate('Keep moving forward', 10, { preserveWordBoundary: false }),
      'Keep movi…',
    );
  });

  it('falls back to slicing for an unbroken word', () => {
    assert.strictEqual(smartTruncate('supercalifragilistic', 10), 'supercali…');
  });

  it('returns a slice without ellipsis when maxLength cannot fit it', () => {
    assert.strictEqual(smartTruncate('abcdef', 1), 'a');
  });

  it('validates text and maxLength', () => {
    assert.throws(() => smartTruncate(123 as unknown as string, 3), TypeError);
    assert.throws(() => smartTruncate('text', -1), TypeError);
    assert.throws(() => smartTruncate('text', 1.5), TypeError);
  });
});

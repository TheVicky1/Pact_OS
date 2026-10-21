
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InvertedIndex } from '../src/lib/search/inverted-index';

interface TestDocument {
  id: string;
  title: string;
  content: string;
  category?: string;
}

function createIndex(
  options: ConstructorParameters<typeof InvertedIndex<TestDocument>>[0] = {},
) {
  return new InvertedIndex<TestDocument>(options);
}

describe('InvertedIndex', () => {
  it('indexes selected string fields and reports document and term counts', () => {
    const index = createIndex();

    index.addDocument(
      {
        id: '1',
        title: 'Project Alpha',
        content: 'Build software',
        category: 'work',
      },
      ['title', 'content'],
    );

    assert.equal(index.documentCount, 1);
    assert.equal(index.termCount, 4);
    assert.equal(index.hasDocument('1'), true);
    assert.equal(index.hasDocument('missing'), false);
  });

  it('matches terms case-insensitively and ignores punctuation', () => {
    const index = createIndex();

    index.addDocument(
      {
        id: '1',
        title: 'Project Alpha!',
        content: 'Build software.',
      },
      ['title', 'content'],
    );

    assert.equal(index.search('PROJECT').length, 1);
    assert.equal(index.search('alpha!!!').length, 1);
    assert.deepEqual(index.search('!!!'), []);
  });

  it('normalizes term frequency and ranks more relevant documents first', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha', content: 'alpha alpha beta' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '2', title: 'alpha alpha', content: 'alpha alpha alpha' },
      ['title', 'content'],
    );

    const results = index.search('alpha');

    assert.equal(results.length, 2);
    assert.equal(results[0].document.id, '2');
    assert.ok(results[0].score > results[1].score);
  });

  it('uses AND to require every query term', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha beta', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '2', title: 'alpha', content: '' },
      ['title', 'content'],
    );

    const results = index.search('alpha beta', { operator: 'AND' });

    assert.deepEqual(
      results.map((result) => result.document.id),
      ['1'],
    );
  });

  it('uses OR to match any query term', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '2', title: 'beta', content: '' },
      ['title', 'content'],
    );

    const results = index.search('alpha beta', { operator: 'OR' });

    assert.equal(results.length, 2);
    assert.deepEqual(
      new Set(results.map((result) => result.document.id)),
      new Set(['1', '2']),
    );
  });

  it('accumulates OR scores across query terms and initializes missing scores', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha beta', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '2', title: 'alpha gamma delta epsilon', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '3', title: 'beta', content: '' },
      ['title', 'content'],
    );

    const results = index.search('alpha beta', { operator: 'OR' });
    const resultById = new Map(
      results.map((result) => [result.document.id, result]),
    );

    assert.equal(results.length, 3);
    assert.deepEqual(resultById.get('1')?.matchedTokens, ['alpha', 'beta']);
    assert.deepEqual(resultById.get('2')?.matchedTokens, ['alpha']);
    assert.deepEqual(resultById.get('3')?.matchedTokens, ['beta']);

    assert.equal(resultById.get('1')?.score, 1);
    assert.equal(resultById.get('2')?.score, 0.25);
    assert.equal(resultById.get('3')?.score, 1);
  });

  it('supports prefix matching', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'application apply', content: 'banana' },
      ['title', 'content'],
    );

    assert.equal(index.search('app').length, 1);
    assert.deepEqual(index.search('bananx'), []);
  });

  it('ignores configured stop words', () => {
    const index = createIndex({ stopWords: new Set(['the', 'and']) });

    index.addDocument(
      { id: '1', title: 'the project', content: 'and software' },
      ['title', 'content'],
    );

    assert.equal(index.search('the').length, 0);
    assert.equal(index.search('project').length, 1);
  });

  it('replaces documents without retaining stale terms', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '1', title: 'beta', content: '' },
      ['title', 'content'],
    );

    assert.deepEqual(index.search('alpha'), []);
    assert.equal(index.search('beta').length, 1);
    assert.equal(index.documentCount, 1);
  });

  it('removes documents and their unused postings', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'unique alpha', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '2', title: 'beta alpha', content: '' },
      ['title', 'content'],
    );

    index.removeDocument('1');

    assert.equal(index.hasDocument('1'), false);
    assert.equal(index.documentCount, 1);
    assert.deepEqual(index.search('unique'), []);
    assert.equal(index.termCount, 2);

    index.removeDocument('2');

    assert.equal(index.documentCount, 0);
    assert.equal(index.termCount, 0);
    assert.deepEqual(index.search('alpha'), []);
  });

  it('clears all documents and terms', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha beta', content: '' },
      ['title', 'content'],
    );
    index.clear();

    assert.equal(index.documentCount, 0);
    assert.equal(index.termCount, 0);
    assert.deepEqual(index.search('alpha'), []);
  });

  it('returns no results for empty or punctuation-only queries', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha', content: '' },
      ['title', 'content'],
    );

    assert.deepEqual(index.search(''), []);
    assert.deepEqual(index.search('   '), []);
    assert.deepEqual(index.search('!!!'), []);
  });

  it('handles documents containing no tokenizable characters', () => {
    const index = createIndex();

    index.addDocument(
      { id: 'empty-text', title: '!!! ...', content: '---' },
      ['title', 'content'],
    );

    assert.equal(index.documentCount, 1);
    assert.equal(index.termCount, 0);
    assert.deepEqual(index.search('!!!'), []);
  });

  it('ignores selected fields that are not strings', () => {
    const index = new InvertedIndex<{
      id: string;
      title: string;
      content: string;
      count: number;
    }>();

    index.addDocument(
      { id: '1', title: 'alpha', content: '', count: 123 },
      ['title', 'content', 'count'],
    );

    assert.deepEqual(index.search('123'), []);
    assert.equal(index.search('alpha').length, 1);
  });

  it('supports case-sensitive indexing', () => {
    const index = createIndex({ caseSensitive: true });

    index.addDocument(
      { id: '1', title: 'Alpha alpha', content: '' },
      ['title', 'content'],
    );

    assert.equal(index.search('Alpha').length, 1);
    assert.equal(index.search('ALPHA').length, 0);
  });

  it('applies result limits and minimum scores', () => {
    const index = createIndex();

    index.addDocument(
      { id: '1', title: 'alpha', content: '' },
      ['title', 'content'],
    );
    index.addDocument(
      { id: '2', title: 'alpha beta', content: '' },
      ['title', 'content'],
    );

    assert.equal(index.search('alpha', { limit: 1 }).length, 1);
    assert.equal(index.search('alpha', { limit: 0 }).length, 0);
    assert.equal(index.search('alpha', { minScore: 0 }).length, 2);
    assert.deepEqual(index.search('alpha', { minScore: 100 }), []);
  });

  it('rejects invalid search options', () => {
    const index = createIndex();

    assert.throws(
      () => index.search('alpha', { operator: 'XOR' as 'AND' }),
      RangeError,
    );
    assert.throws(
      () => index.search('alpha', { minScore: -1 }),
      RangeError,
    );
    assert.throws(
      () => index.search('alpha', { minScore: Infinity }),
      RangeError,
    );
    assert.throws(
      () => index.search('alpha', { limit: -1 }),
      RangeError,
    );
    assert.throws(
      () => index.search('alpha', { limit: 1.5 }),
      RangeError,
    );
  });

  it('rejects empty document IDs', () => {
    const index = createIndex();

    assert.throws(
      () =>
        index.addDocument(
          { id: '', title: 'alpha', content: '' },
          ['title', 'content'],
        ),
      TypeError,
    );
  });
});

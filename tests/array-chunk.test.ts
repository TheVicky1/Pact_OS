import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkArray, paginateBatch } from '../src/lib/data/array-chunk';

describe('chunkArray Unit Tests (#752)', () => {
  it('chunks an array with exact multiples into evenly sized chunks', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const result = chunkArray(input, 2);
    assert.deepStrictEqual(result, [
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    assert.strictEqual(result.length, 3);
    assert.ok(result.every((c) => c.length === 2));
  });

  it('chunks an array with non-multiples preserving remainder in last chunk', () => {
    const input = [1, 2, 3, 4, 5];
    const result = chunkArray(input, 2);
    assert.deepStrictEqual(result, [[1, 2], [3, 4], [5]]);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].length, 2);
    assert.strictEqual(result[1].length, 2);
    assert.strictEqual(result[2].length, 1);
  });

  it('handles chunk size equal to 1 correctly', () => {
    const input = ['a', 'b', 'c'];
    const result = chunkArray(input, 1);
    assert.deepStrictEqual(result, [['a'], ['b'], ['c']]);
    assert.strictEqual(result.length, 3);
  });

  it('handles oversized chunk size (chunkSize >= items.length)', () => {
    const input = [10, 20, 30];
    const resultExact = chunkArray(input, 3);
    assert.deepStrictEqual(resultExact, [[10, 20, 30]]);

    const resultGreater = chunkArray(input, 100);
    assert.deepStrictEqual(resultGreater, [[10, 20, 30]]);
    assert.notStrictEqual(resultGreater[0], input, 'Returned chunk should be a distinct array copy');
  });

  it('handles empty input array returning empty array []', () => {
    const emptyNum: number[] = [];
    assert.deepStrictEqual(chunkArray(emptyNum, 1), []);
    assert.deepStrictEqual(chunkArray(emptyNum, 25), []);
    assert.deepStrictEqual(chunkArray([], 100), []);
  });

  it('handles single-element array correctly', () => {
    assert.deepStrictEqual(chunkArray([42], 1), [[42]]);
    assert.deepStrictEqual(chunkArray([42], 5), [[42]]);
  });

  it('preserves immutability of input array and returned chunks', () => {
    const original = [{ id: 'habit-1' }, { id: 'habit-2' }, { id: 'habit-3' }];
    const shallowCopy = [...original];
    const result = chunkArray(original, 2);

    assert.deepStrictEqual(original, shallowCopy, 'Source array must not be mutated');

    // Mutate the returned chunk array structure
    result[0].push({ id: 'habit-modified' });
    assert.strictEqual(original.length, 3, 'Source array length must remain unchanged');
    assert.strictEqual(original[0].id, 'habit-1');
  });

  it('supports readonly input arrays seamlessly with TypeScript generics', () => {
    const readonlyHabits: readonly string[] = ['meditate', 'read', 'run', 'hydrate'];
    const batches = chunkArray(readonlyHabits, 2);
    assert.deepStrictEqual(batches, [
      ['meditate', 'read'],
      ['run', 'hydrate'],
    ]);
  });

  it('handles diverse data types (objects, strings, booleans, null/undefined)', () => {
    const records = [
      { id: 1, name: 'Task A' },
      { id: 2, name: 'Task B' },
      { id: 3, name: 'Task C' },
    ];
    const chunkedRecords = chunkArray(records, 2);
    assert.deepStrictEqual(chunkedRecords, [
      [
        { id: 1, name: 'Task A' },
        { id: 2, name: 'Task B' },
      ],
      [{ id: 3, name: 'Task C' }],
    ]);

    const nullableItems = [null, undefined, 0, false, '', NaN];
    const chunkedNullables = chunkArray(nullableItems, 3);
    assert.strictEqual(chunkedNullables.length, 2);
    assert.strictEqual(chunkedNullables[0][0], null);
    assert.strictEqual(chunkedNullables[0][1], undefined);
    assert.strictEqual(chunkedNullables[0][2], 0);
  });

  it('efficiently handles large datasets (e.g. 1000 habit logs in batches of 25)', () => {
    const totalRecords = 1000;
    const batchSize = 25;
    const largeDataset = Array.from({ length: totalRecords }, (_, i) => ({
      seq: i + 1,
      payload: `habit-log-${i + 1}`,
    }));

    const chunks = chunkArray(largeDataset, batchSize);
    assert.strictEqual(chunks.length, 40);
    assert.ok(chunks.every((chunk) => chunk.length === batchSize));
    assert.strictEqual(chunks[0][0].seq, 1);
    assert.strictEqual(chunks[39][batchSize - 1].seq, 1000);
  });

  describe('Validation & Error Handling', () => {
    it('throws TypeError if items is not an array', () => {
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(null, 5), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(undefined, 5), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(123, 5), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray('not-an-array', 5), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray({ length: 5 }, 5), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(true, 5), TypeError);
    });

    it('throws TypeError if chunkSize is not a number or is NaN', () => {
      const items = [1, 2, 3];
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(items, '2'), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(items, null), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(items, undefined), TypeError);
      assert.throws(() => chunkArray(items, Number.NaN), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(items, {}), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray(items, []), TypeError);
    });

    it('throws RangeError if chunkSize is not a positive integer (must be integer >= 1)', () => {
      const items = [1, 2, 3, 4];
      assert.throws(() => chunkArray(items, 0), RangeError);
      assert.throws(() => chunkArray(items, -1), RangeError);
      assert.throws(() => chunkArray(items, -50), RangeError);
      assert.throws(() => chunkArray(items, 1.5), RangeError);
      assert.throws(() => chunkArray(items, 2.99), RangeError);
      assert.throws(() => chunkArray(items, 0.1), RangeError);
      assert.throws(() => chunkArray(items, Number.POSITIVE_INFINITY), RangeError);
      assert.throws(() => chunkArray(items, Number.NEGATIVE_INFINITY), RangeError);
    });

    it('validates chunkSize before empty array short-circuit', () => {
      assert.throws(() => chunkArray([], 0), RangeError);
      assert.throws(() => chunkArray([], -1), RangeError);
      assert.throws(() => chunkArray([], 2.5), RangeError);
      assert.throws(() => chunkArray([], Number.NaN), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => chunkArray([], 'invalid'), TypeError);
    });
  });
});

describe('paginateBatch Unit Tests', () => {
  const items = Array.from({ length: 95 }, (_, i) => i + 1);

  it('paginates the first page correctly', () => {
    const page1 = paginateBatch(items, 1, 25);
    assert.strictEqual(page1.page, 1);
    assert.strictEqual(page1.pageSize, 25);
    assert.strictEqual(page1.totalPages, 4);
    assert.strictEqual(page1.totalItems, 95);
    assert.strictEqual(page1.hasNext, true);
    assert.strictEqual(page1.hasPrev, false);
    assert.strictEqual(page1.data.length, 25);
    assert.strictEqual(page1.data[0], 1);
    assert.strictEqual(page1.data[24], 25);
  });

  it('paginates intermediate pages with proper navigation flags', () => {
    const page2 = paginateBatch(items, 2, 25);
    assert.strictEqual(page2.page, 2);
    assert.strictEqual(page2.hasNext, true);
    assert.strictEqual(page2.hasPrev, true);
    assert.strictEqual(page2.data.length, 25);
    assert.strictEqual(page2.data[0], 26);
    assert.strictEqual(page2.data[24], 50);
  });

  it('paginates the final page containing remainder elements', () => {
    const page4 = paginateBatch(items, 4, 25);
    assert.strictEqual(page4.page, 4);
    assert.strictEqual(page4.hasNext, false);
    assert.strictEqual(page4.hasPrev, true);
    assert.strictEqual(page4.data.length, 20);
    assert.strictEqual(page4.data[0], 76);
    assert.strictEqual(page4.data[19], 95);
  });

  it('handles page requests beyond total pages gracefully', () => {
    const outOfBounds = paginateBatch(items, 10, 25);
    assert.strictEqual(outOfBounds.page, 10);
    assert.strictEqual(outOfBounds.totalPages, 4);
    assert.strictEqual(outOfBounds.hasNext, false);
    assert.strictEqual(outOfBounds.hasPrev, true);
    assert.deepStrictEqual(outOfBounds.data, []);
  });

  it('handles empty arrays returning 0 totalPages and empty data', () => {
    const emptyResult = paginateBatch([], 1, 20);
    assert.strictEqual(emptyResult.totalPages, 0);
    assert.strictEqual(emptyResult.totalItems, 0);
    assert.strictEqual(emptyResult.hasNext, false);
    assert.strictEqual(emptyResult.hasPrev, false);
    assert.deepStrictEqual(emptyResult.data, []);
  });

  it('handles exact division without remainder', () => {
    const exactItems = [1, 2, 3, 4];
    const page2 = paginateBatch(exactItems, 2, 2);
    assert.strictEqual(page2.totalPages, 2);
    assert.strictEqual(page2.hasNext, false);
    assert.strictEqual(page2.hasPrev, true);
    assert.deepStrictEqual(page2.data, [3, 4]);
  });

  describe('Validation & Error Handling', () => {
    it('validates input array type', () => {
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => paginateBatch(null, 1, 10), TypeError);
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => paginateBatch(123, 1, 10), TypeError);
    });

    it('validates page number', () => {
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => paginateBatch([1], '1', 10), TypeError);
      assert.throws(() => paginateBatch([1], Number.NaN, 10), TypeError);
      assert.throws(() => paginateBatch([1], 0, 10), RangeError);
      assert.throws(() => paginateBatch([1], -1, 10), RangeError);
      assert.throws(() => paginateBatch([1], 1.5, 10), RangeError);
    });

    it('validates pageSize number', () => {
      // @ts-expect-error Testing invalid runtime types
      assert.throws(() => paginateBatch([1], 1, '10'), TypeError);
      assert.throws(() => paginateBatch([1], 1, Number.NaN), TypeError);
      assert.throws(() => paginateBatch([1], 1, 0), RangeError);
      assert.throws(() => paginateBatch([1], 1, -5), RangeError);
      assert.throws(() => paginateBatch([1], 1, 3.2), RangeError);
    });
  });
});

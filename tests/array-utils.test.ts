// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  groupByKey,
  partitionArray,
  uniqueByProperty,
} from '../src/lib/array-utils';

describe('Array Utility Functions (#376)', () => {
  describe('groupByKey', () => {
    it('groups objects by a specified string property', () => {
      const users = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'member' },
        { id: 3, name: 'Charlie', role: 'admin' },
      ];

      const grouped = groupByKey(users, 'role');

      expect(grouped).toEqual({
        admin: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 3, name: 'Charlie', role: 'admin' },
        ],
        member: [{ id: 2, name: 'Bob', role: 'member' }],
      });
    });

    it('groups multiple objects sharing the same key into a single group', () => {
      const tasks = [
        { id: 101, title: 'Write tests', category: 'engineering' },
        { id: 102, title: 'Code review', category: 'engineering' },
        { id: 103, title: 'Deploy release', category: 'engineering' },
        { id: 104, title: 'Monitor logs', category: 'engineering' },
      ];

      const grouped = groupByKey(tasks, 'category');

      expect(Object.keys(grouped)).toEqual(['engineering']);
      expect(grouped.engineering).toHaveLength(4);
      expect(grouped.engineering.map(t => t.id)).toEqual([101, 102, 103, 104]);
    });

    it('groups objects where each element has a distinct key', () => {
      const items = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'in-progress' },
        { id: 3, status: 'completed' },
      ];

      const grouped = groupByKey(items, 'status');

      expect(Object.keys(grouped).sort()).toEqual(['completed', 'in-progress', 'pending']);
      expect(grouped.pending).toEqual([{ id: 1, status: 'pending' }]);
      expect(grouped['in-progress']).toEqual([{ id: 2, status: 'in-progress' }]);
      expect(grouped.completed).toEqual([{ id: 3, status: 'completed' }]);
    });

    it('returns an empty object when input array is empty', () => {
      interface Item {
        id: number;
        type: string;
      }
      const empty: Item[] = [];
      const grouped = groupByKey(empty, 'type');

      expect(grouped).toEqual({});
      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it('handles null and undefined / missing property values safely', () => {
      interface TaggedItem {
        id: number;
        tag?: string | null;
      }
      const items: TaggedItem[] = [
        { id: 1, tag: 'urgent' },
        { id: 2, tag: null },
        { id: 3 }, // missing tag
        { id: 4, tag: undefined },
        { id: 5, tag: null },
      ];

      const grouped = groupByKey(items, 'tag');

      expect(grouped.urgent).toEqual([{ id: 1, tag: 'urgent' }]);
      expect(grouped.null).toEqual([
        { id: 2, tag: null },
        { id: 5, tag: null },
      ]);
      expect(grouped.undefined).toEqual([
        { id: 3 },
        { id: 4, tag: undefined },
      ]);
    });

    it('preserves all duplicate keys without overwriting elements', () => {
      const duplicates = [
        { priority: 'P0', task: 'Outage fix A' },
        { priority: 'P0', task: 'Outage fix A' }, // exact duplicate payload
        { priority: 'P1', task: 'Feature' },
        { priority: 'P0', task: 'Security patch' },
      ];

      const grouped = groupByKey(duplicates, 'priority');

      expect(grouped.P0).toHaveLength(3);
      expect(grouped.P0).toEqual([
        { priority: 'P0', task: 'Outage fix A' },
        { priority: 'P0', task: 'Outage fix A' },
        { priority: 'P0', task: 'Security patch' },
      ]);
      expect(grouped.P1).toHaveLength(1);
    });

    it('handles single-element arrays', () => {
      const single = [{ id: 42, squad: 'frontend' }];
      const grouped = groupByKey(single, 'squad');

      expect(grouped).toEqual({
        frontend: [{ id: 42, squad: 'frontend' }],
      });
    });

    it('groups by numeric property keys cleanly', () => {
      const goals = [
        { id: 'g1', quarter: 1 },
        { id: 'g2', quarter: 2 },
        { id: 'g3', quarter: 1 },
      ];

      const grouped = groupByKey(goals, 'quarter');

      expect(grouped['1']).toHaveLength(2);
      expect(grouped['2']).toHaveLength(1);
    });

    it('supports custom key selector functions', () => {
      const transactions = [
        { id: 1, amountCents: 500 },
        { id: 2, amountCents: -200 },
        { id: 3, amountCents: 1200 },
        { id: 4, amountCents: -50 },
      ];

      const grouped = groupByKey(transactions, t => (t.amountCents >= 0 ? 'income' : 'expense'));

      expect(grouped.income.map(t => t.id)).toEqual([1, 3]);
      expect(grouped.expense.map(t => t.id)).toEqual([2, 4]);
    });

    it('does not mutate the original input array', () => {
      const original = Object.freeze([
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
      ]);

      const clone = [...original];
      groupByKey(original, 'category');

      expect(original).toEqual(clone);
    });

    it('handles null or undefined input array gracefully', () => {
      expect(groupByKey(null as unknown as [], 'id')).toEqual({});
      expect(groupByKey(undefined as unknown as [], 'id')).toEqual({});
    });
  });

  describe('partitionArray', () => {
    it('splits numbers into matching and non-matching partitions using a predicate', () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
      const isEven = (n: number) => n % 2 === 0;

      const [evens, odds] = partitionArray(numbers, isEven);

      expect(evens).toEqual([2, 4, 6, 8]);
      expect(odds).toEqual([1, 3, 5, 7]);
    });

    it('partitions object collections correctly', () => {
      const tasks = [
        { id: 1, title: 'Write tests', completed: true },
        { id: 2, title: 'Draft PR', completed: false },
        { id: 3, title: 'Review documentation', completed: true },
        { id: 4, title: 'Release v0.2.1', completed: false },
      ];

      const [completed, pending] = partitionArray(tasks, t => t.completed);

      expect(completed.map(t => t.id)).toEqual([1, 3]);
      expect(pending.map(t => t.id)).toEqual([2, 4]);
    });

    it('returns all elements in first partition when all match predicate', () => {
      const values = [10, 20, 30, 40];
      const [matches, nonMatches] = partitionArray(values, v => v > 0);

      expect(matches).toEqual([10, 20, 30, 40]);
      expect(nonMatches).toEqual([]);
    });

    it('returns all elements in second partition when no elements match predicate', () => {
      const values = [-10, -20, -30];
      const [matches, nonMatches] = partitionArray(values, v => v > 0);

      expect(matches).toEqual([]);
      expect(nonMatches).toEqual([-10, -20, -30]);
    });

    it('returns two empty arrays when input array is empty', () => {
      const [matches, nonMatches] = partitionArray([], () => true);

      expect(matches).toEqual([]);
      expect(nonMatches).toEqual([]);
    });

    it('correctly handles duplicate values across partitions', () => {
      const duplicates = [1, 2, 2, 3, 2, 4, 1, 5];
      const [twos, rest] = partitionArray(duplicates, n => n === 2);

      expect(twos).toEqual([2, 2, 2]);
      expect(rest).toEqual([1, 3, 4, 1, 5]);
    });

    it('supports TypeScript type guard narrowing', () => {
      const mixed: (string | number)[] = ['hello', 42, 'world', 99, 100];
      const isString = (val: string | number): val is string => typeof val === 'string';

      const [strings, numbers] = partitionArray(mixed, isString);

      expect(strings).toEqual(['hello', 'world']);
      expect(numbers).toEqual([42, 99, 100]);
    });

    it('passes index and the complete array reference to the predicate', () => {
      const items = ['a', 'b', 'c', 'd'];
      const passedIndices: number[] = [];
      const arrayRefs: (readonly string[])[] = [];

      const [evens, odds] = partitionArray(items, (_item, idx, arr) => {
        passedIndices.push(idx);
        arrayRefs.push(arr);
        return idx % 2 === 0;
      });

      expect(passedIndices).toEqual([0, 1, 2, 3]);
      expect(arrayRefs.every(ref => ref === items)).toBe(true);
      expect(evens).toEqual(['a', 'c']);
      expect(odds).toEqual(['b', 'd']);
    });

    it('preserves strict element ordering in both partitions', () => {
      const input = [5, 1, 4, 2, 3];
      const [greaterThanTwo, rest] = partitionArray(input, n => n > 2);

      expect(greaterThanTwo).toEqual([5, 4, 3]);
      expect(rest).toEqual([1, 2]);
    });

    it('handles null and undefined elements safely', () => {
      const nullableItems = ['valid', null, 'another', undefined, null, 'final'];
      const isNonNull = <T>(val: T): val is NonNullable<T> => val !== null && val !== undefined;

      const [valid, missing] = partitionArray(nullableItems, isNonNull);

      expect(valid).toEqual(['valid', 'another', 'final']);
      expect(missing).toEqual([null, undefined, null]);
    });

    it('does not mutate the source array', () => {
      const original = Object.freeze([1, 2, 3, 4]);
      const clone = [...original];

      partitionArray(original, n => n % 2 === 0);

      expect(original).toEqual(clone);
    });

    it('handles null or undefined input array gracefully', () => {
      expect(partitionArray(null as unknown as [], () => true)).toEqual([[], []]);
      expect(partitionArray(undefined as unknown as [], () => true)).toEqual([[], []]);
    });
  });

  describe('uniqueByProperty', () => {
    it('removes duplicate objects matching on a specified property', () => {
      const habits = [
        { id: 1, name: 'Deep Work' },
        { id: 2, name: 'Hydration' },
        { id: 1, name: 'Deep Work (duplicate)' },
        { id: 3, name: 'Exercise' },
      ];

      const deduped = uniqueByProperty(habits, 'id');

      expect(deduped).toHaveLength(3);
      expect(deduped.map(h => h.id)).toEqual([1, 2, 3]);
    });

    it('preserves the first occurrence encountered when duplicate keys occur', () => {
      const entries = [
        { key: 'alpha', version: 1, note: 'keep this one' },
        { key: 'beta', version: 1, note: 'keep beta' },
        { key: 'alpha', version: 2, note: 'discard this' },
        { key: 'alpha', version: 3, note: 'discard this too' },
      ];

      const deduped = uniqueByProperty(entries, 'key');

      expect(deduped).toEqual([
        { key: 'alpha', version: 1, note: 'keep this one' },
        { key: 'beta', version: 1, note: 'keep beta' },
      ]);
    });

    it('retains all objects when keys are already distinct', () => {
      const records = [
        { slug: 'pact-os', stars: 500 },
        { slug: 'antigravity', stars: 1000 },
        { slug: 'vitest', stars: 2000 },
      ];

      const deduped = uniqueByProperty(records, 'slug');

      expect(deduped).toEqual(records);
    });

    it('returns an empty array when input is empty', () => {
      interface Data {
        id: string;
      }
      const empty: Data[] = [];

      expect(uniqueByProperty(empty, 'id')).toEqual([]);
    });

    it('returns single-element arrays unchanged', () => {
      const single = [{ code: 'USD', symbol: '$' }];

      expect(uniqueByProperty(single, 'code')).toEqual(single);
    });

    it('handles null and undefined property values according to first-seen semantics', () => {
      const items = [
        { id: 'a', metadata: null },
        { id: 'b', metadata: 'valid' },
        { id: 'c', metadata: null }, // duplicate null -> discarded
        { id: 'd' }, // undefined -> kept
        { id: 'e', metadata: undefined }, // duplicate undefined -> discarded
      ];

      const deduped = uniqueByProperty(items, 'metadata');

      expect(deduped.map(i => i.id)).toEqual(['a', 'b', 'd']);
    });

    it('distinguishes null from undefined property values', () => {
      const items = [
        { id: 1, tag: null },
        { id: 2, tag: undefined },
      ];

      const deduped = uniqueByProperty(items, 'tag');

      expect(deduped).toHaveLength(2);
      expect(deduped).toEqual(items);
    });

    it('preserves original input order of first appearance', () => {
      const priorities = [
        { priority: 'medium', item: 1 },
        { priority: 'high', item: 2 },
        { priority: 'low', item: 3 },
        { priority: 'high', item: 4 },
        { priority: 'medium', item: 5 },
      ];

      const deduped = uniqueByProperty(priorities, 'priority');

      expect(deduped.map(p => p.priority)).toEqual(['medium', 'high', 'low']);
      expect(deduped.map(p => p.item)).toEqual([1, 2, 3]);
    });

    it('supports various property data types including numbers, booleans, and empty strings', () => {
      const numbers = [
        { val: 0, label: 'zero-1' },
        { val: 1, label: 'one' },
        { val: 0, label: 'zero-2' },
        { val: -5, label: 'negative' },
      ];
      expect(uniqueByProperty(numbers, 'val').map(n => n.label)).toEqual([
        'zero-1',
        'one',
        'negative',
      ]);

      const booleans = [
        { active: true, name: 'first-true' },
        { active: false, name: 'first-false' },
        { active: true, name: 'second-true' },
      ];
      expect(uniqueByProperty(booleans, 'active').map(b => b.name)).toEqual([
        'first-true',
        'first-false',
      ]);

      const strings = [
        { token: '', desc: 'empty-1' },
        { token: 'abc', desc: 'content' },
        { token: '', desc: 'empty-2' },
      ];
      expect(uniqueByProperty(strings, 'token').map(s => s.desc)).toEqual([
        'empty-1',
        'content',
      ]);
    });

    it('supports selector functions for computed uniqueness', () => {
      const coordinates = [
        { x: 10, y: 20, name: 'Point A' },
        { x: 10, y: 20, name: 'Point A Duplicate' },
        { x: 30, y: 40, name: 'Point B' },
      ];

      const deduped = uniqueByProperty(coordinates, p => `${p.x},${p.y}`);

      expect(deduped).toHaveLength(2);
      expect(deduped.map(p => p.name)).toEqual(['Point A', 'Point B']);
    });

    it('does not mutate the source array', () => {
      const original = Object.freeze([
        { id: 1, v: 'A' },
        { id: 1, v: 'B' },
        { id: 2, v: 'C' },
      ]);
      const clone = [...original];

      uniqueByProperty(original, 'id');

      expect(original).toEqual(clone);
    });

    it('handles null or undefined input array gracefully', () => {
      expect(uniqueByProperty(null as unknown as [], 'id')).toEqual([]);
      expect(uniqueByProperty(undefined as unknown as [], 'id')).toEqual([]);
    });
  });
});

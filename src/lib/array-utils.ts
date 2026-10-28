/**
 * Array manipulation and collection partitioning utilities.
 * Pure TypeScript helpers for grouping, partitioning, and deduplicating array collections.
 */

/**
 * Groups an array of objects by a specified property key or key selector function.
 *
 * @template T The element object type.
 * @template K The property key on T to group by.
 * @param array The array of objects to group.
 * @param key The property key or selector function used to extract the grouping key.
 * @returns A record mapping stringified group keys to arrays of matching elements.
 */
export function groupByKey<T, K extends keyof T>(
  array: readonly T[],
  key: K | ((item: T) => PropertyKey | null | undefined),
): Record<string, T[]> {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return {};
  }

  const result: Record<string, T[]> = {};

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    let rawKey: unknown;

    if (typeof key === 'function') {
      rawKey = key(item);
    } else if (item !== null && typeof item === 'object' && key in item) {
      rawKey = item[key];
    } else {
      rawKey = undefined;
    }

    const groupKey =
      rawKey === null ? 'null' : rawKey === undefined ? 'undefined' : String(rawKey);

    if (!Object.prototype.hasOwnProperty.call(result, groupKey)) {
      result[groupKey] = [];
    }

    result[groupKey].push(item);
  }

  return result;
}

/**
 * Splits an array into a tuple of two arrays [matching, nonMatching] according to a predicate.
 *
 * @template T The element type.
 * @template S Narrowed subtype matching the type guard predicate.
 * @param array The array to partition.
 * @param predicate A predicate function returning truthy for elements to include in the first partition.
 * @returns A tuple of `[matches, nonMatches]` preserving relative order.
 */
export function partitionArray<T, S extends T>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => value is S,
): [S[], Exclude<T, S>[]];
export function partitionArray<T>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => boolean,
): [T[], T[]];
export function partitionArray<T>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => boolean,
): [T[], T[]] {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return [[], []];
  }

  const pass: T[] = [];
  const fail: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (predicate(item, i, array)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }

  return [pass, fail];
}

/**
 * Deduplicates an array of objects by a specified property key or key selector function,
 * retaining the first occurrence encountered for each distinct key value.
 *
 * @template T The element object type.
 * @template K The property key on T to deduplicate by.
 * @param array The array of objects to deduplicate.
 * @param key The property key or selector function used to evaluate uniqueness.
 * @returns A new array containing only the first occurrence of each unique key property.
 */
export function uniqueByProperty<T, K extends keyof T>(
  array: readonly T[],
  key: K | ((item: T) => unknown),
): T[] {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return [];
  }

  const seen = new Set<unknown>();
  const result: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    let keyVal: unknown;

    if (typeof key === 'function') {
      keyVal = key(item);
    } else if (item !== null && typeof item === 'object' && key in item) {
      keyVal = item[key];
    } else {
      keyVal = undefined;
    }

    if (!seen.has(keyVal)) {
      seen.add(keyVal);
      result.push(item);
    }
  }

  return result;
}

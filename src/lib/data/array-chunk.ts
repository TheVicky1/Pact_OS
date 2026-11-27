/**
 * Pure Array Chunker & Batch Paginator Utility
 *
 * Provides a lightweight, pure, zero-dependency array chunking and batch pagination
 * helper to partition large entity collections (e.g., habit logs, task records,
 * mutation queues) into fixed-size batches for local-first synchronization and
 * batched Supabase payload persistence.
 */

/**
 * Metadata and payload for a paginated batch of items.
 */
export interface BatchPage<T> {
  /** The items belonging to the requested page */
  data: T[];
  /** 1-based page number */
  page: number;
  /** Maximum number of elements per page/batch */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
  /** Total count of items across all pages */
  totalItems: number;
  /** Whether there is a subsequent page */
  hasNext: boolean;
  /** Whether there is a preceding page */
  hasPrev: boolean;
}

/**
 * Splits an array into chunks of a specified maximum size.
 *
 * Invariants & Behavior:
 * 1. Pure & Immutable: Does not mutate the source array.
 * 2. Even Sizing: Every chunk except possibly the last has length === chunkSize.
 * 3. Remainder: The last chunk contains any remaining elements (length <= chunkSize).
 * 4. Empty Handling: If items.length === 0, returns an empty array [].
 * 5. Oversized Chunk: If chunkSize >= items.length, returns [items.slice()].
 * 6. Validation:
 *    - Throws TypeError if items is not an array, or chunkSize is not a number or is NaN.
 *    - Throws RangeError if chunkSize is not a positive integer (must be integer >= 1).
 *
 * @template T Type of array elements.
 * @param items The input array to chunk.
 * @param chunkSize Positive integer size for each chunk (>= 1).
 * @returns An array of chunks containing elements of type T.
 */
export function chunkArray<T>(
  items: readonly T[],
  chunkSize: number
): T[][] {
  if (!Array.isArray(items)) {
    throw new TypeError(
      `Expected items to be an array, received ${items === null ? 'null' : typeof items}`
    );
  }

  if (typeof chunkSize !== 'number' || Number.isNaN(chunkSize)) {
    throw new TypeError(
      `Expected chunkSize to be a number, received ${Number.isNaN(chunkSize) ? 'NaN' : typeof chunkSize}`
    );
  }

  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError(
      `Expected chunkSize to be a positive integer (>= 1), received ${chunkSize}`
    );
  }

  if (items.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Paginates an array into a single batch with full pagination metadata.
 * Pure, immutable, and zero-dependency.
 *
 * @template T Type of array elements.
 * @param items The input array to paginate.
 * @param page 1-based page number (must be integer >= 1).
 * @param pageSize Maximum number of elements per page (must be integer >= 1).
 * @returns A BatchPage object with page slice and navigation metadata.
 */
export function paginateBatch<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): BatchPage<T> {
  if (!Array.isArray(items)) {
    throw new TypeError(
      `Expected items to be an array, received ${items === null ? 'null' : typeof items}`
    );
  }

  if (typeof page !== 'number' || Number.isNaN(page)) {
    throw new TypeError(
      `Expected page to be a number, received ${Number.isNaN(page) ? 'NaN' : typeof page}`
    );
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError(
      `Expected page to be a positive integer (>= 1), received ${page}`
    );
  }

  if (typeof pageSize !== 'number' || Number.isNaN(pageSize)) {
    throw new TypeError(
      `Expected pageSize to be a number, received ${Number.isNaN(pageSize) ? 'NaN' : typeof pageSize}`
    );
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError(
      `Expected pageSize to be a positive integer (>= 1), received ${pageSize}`
    );
  }

  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const data = startIndex >= totalItems ? [] : items.slice(startIndex, startIndex + pageSize);

  return {
    data,
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNext: totalPages > 0 && page < totalPages,
    hasPrev: totalPages > 0 && page > 1,
  };
}

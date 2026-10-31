/**
 * Pure TypeScript Delta-RLE Timestamp Compression & Decompression Engine.
 * Target: src/lib/data/delta-rle-compressor.ts
 *
 * Implements Gorilla/TSDB style timestamp compression:
 * 1. Delta Encoding: Difference between consecutive monotonically non-decreasing timestamps.
 * 2. Run-Length Encoding (RLE): Compresses consecutive repeating delta intervals into { delta, count } chunks.
 *
 * Zero external dependencies.
 */

export interface RunLengthDeltaChunk {
  delta: number; // Interval difference in ms
  count: number; // Consecutive occurrences (>= 1)
}

export interface CompressedTimestampBuffer {
  initialTimestamp: number;
  totalCount: number;
  chunks: RunLengthDeltaChunk[];
  compressionRatio: number; // compressed byte equivalent / raw byte equivalent
}

/**
 * Validates that all elements in timestamps array are finite non-negative numbers
 * and monotonically non-decreasing.
 */
function validateTimestamps(timestamps: number[]): void {
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    if (typeof t !== 'number' || !Number.isFinite(t)) {
      throw new Error(`Timestamp at index ${i} must be a finite number: ${t}`);
    }
    if (i > 0 && t < timestamps[i - 1]) {
      throw new Error(
        `Timestamps must be non-decreasing: timestamps[${i}] (${t}) < timestamps[${i - 1}] (${timestamps[i - 1]})`
      );
    }
  }
}

/**
 * Computes an estimated byte-equivalent representation size.
 * Raw format: 8 bytes (64-bit float/int) per timestamp.
 * Compressed format: 8 bytes (initialTimestamp) + 4 bytes (totalCount) +
 *                   (8 bytes delta + 4 bytes count = 12 bytes) per chunk.
 */
function computeCompressionRatio(rawCount: number, chunkCount: number): number {
  if (rawCount === 0) return 1.0;
  const rawBytes = rawCount * 8;
  const compressedBytes = 8 + 4 + chunkCount * 12;
  const ratio = compressedBytes / rawBytes;
  return Number(ratio.toFixed(4));
}

/**
 * Compresses an array of monotonically non-decreasing timestamps using Delta-RLE encoding.
 *
 * @param timestamps - Array of timestamps in milliseconds (e.g. UNIX epoch)
 * @returns CompressedTimestampBuffer containing initialTimestamp, totalCount, chunks, and compressionRatio
 */
export function compressTimestampDeltas(
  timestamps: number[]
): CompressedTimestampBuffer {
  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    return {
      initialTimestamp: 0,
      totalCount: 0,
      chunks: [],
      compressionRatio: 1.0,
    };
  }

  validateTimestamps(timestamps);

  const initialTimestamp = timestamps[0];
  const totalCount = timestamps.length;

  if (totalCount === 1) {
    return {
      initialTimestamp,
      totalCount: 1,
      chunks: [],
      compressionRatio: computeCompressionRatio(1, 0),
    };
  }

  const chunks: RunLengthDeltaChunk[] = [];
  let currentDelta = timestamps[1] - timestamps[0];
  let currentCount = 1;

  for (let i = 2; i < totalCount; i++) {
    const delta = timestamps[i] - timestamps[i - 1];
    if (delta === currentDelta) {
      currentCount++;
    } else {
      chunks.push({ delta: currentDelta, count: currentCount });
      currentDelta = delta;
      currentCount = 1;
    }
  }

  chunks.push({ delta: currentDelta, count: currentCount });

  return {
    initialTimestamp,
    totalCount,
    chunks,
    compressionRatio: computeCompressionRatio(totalCount, chunks.length),
  };
}

/**
 * Decompresses a CompressedTimestampBuffer back into the original sequence of timestamps.
 * Lossless round-trip guarantee: decompressTimestampDeltas(compressTimestampDeltas(T)) === T.
 *
 * @param buffer - CompressedTimestampBuffer produced by compressTimestampDeltas
 * @returns Array of restored timestamps in milliseconds
 */
export function decompressTimestampDeltas(
  buffer: CompressedTimestampBuffer
): number[] {
  if (!buffer || typeof buffer !== 'object') {
    throw new Error('Invalid buffer provided: must be a non-null object');
  }

  const { initialTimestamp, totalCount, chunks } = buffer;

  if (typeof totalCount !== 'number' || !Number.isInteger(totalCount) || totalCount < 0) {
    throw new Error('Invalid buffer: totalCount must be a non-negative integer');
  }

  if (totalCount === 0) {
    return [];
  }

  if (typeof initialTimestamp !== 'number' || !Number.isFinite(initialTimestamp)) {
    throw new Error('Invalid buffer: initialTimestamp must be a finite number');
  }

  if (!Array.isArray(chunks)) {
    throw new Error('Invalid buffer: chunks must be an array');
  }

  if (totalCount === 1) {
    return [initialTimestamp];
  }

  const timestamps: number[] = new Array(totalCount);
  timestamps[0] = initialTimestamp;

  let currentTimestamp = initialTimestamp;
  let writeIndex = 1;

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    if (
      !chunk ||
      typeof chunk.delta !== 'number' ||
      !Number.isFinite(chunk.delta) ||
      typeof chunk.count !== 'number' ||
      !Number.isInteger(chunk.count) ||
      chunk.count < 1
    ) {
      throw new Error(`Invalid chunk at index ${c}: ${JSON.stringify(chunk)}`);
    }

    const { delta, count } = chunk;
    for (let k = 0; k < count; k++) {
      if (writeIndex >= totalCount) {
        throw new Error(
          `Buffer corruption: chunk counts sum to more than totalCount (${totalCount})`
        );
      }
      currentTimestamp += delta;
      timestamps[writeIndex++] = currentTimestamp;
    }
  }

  if (writeIndex !== totalCount) {
    throw new Error(
      `Buffer corruption: chunks yielded ${writeIndex} timestamps, expected totalCount of ${totalCount}`
    );
  }

  return timestamps;
}

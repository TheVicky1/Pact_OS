import { describe, it, expect } from 'vitest';
import {
  compressTimestampDeltas,
  decompressTimestampDeltas,
  CompressedTimestampBuffer,
} from '../src/lib/data/delta-rle-compressor';

describe('Delta-RLE Timestamp Compression & Decompression Engine', () => {
  describe('compressTimestampDeltas', () => {
    it('handles empty and single-element timestamp arrays gracefully', () => {
      const emptyResult = compressTimestampDeltas([]);
      expect(emptyResult.initialTimestamp).toBe(0);
      expect(emptyResult.totalCount).toBe(0);
      expect(emptyResult.chunks).toEqual([]);
      expect(emptyResult.compressionRatio).toBe(1.0);

      const singleResult = compressTimestampDeltas([1729900000000]);
      expect(singleResult.initialTimestamp).toBe(1729900000000);
      expect(singleResult.totalCount).toBe(1);
      expect(singleResult.chunks).toEqual([]);
    });

    it('compresses uniform constant intervals into a single RLE chunk', () => {
      // 50 ticks, exactly 1000ms apart
      const base = 1729900000000;
      const count = 50;
      const timestamps: number[] = [];
      for (let i = 0; i < count; i++) {
        timestamps.push(base + i * 1000);
      }

      const compressed = compressTimestampDeltas(timestamps);
      expect(compressed.initialTimestamp).toBe(base);
      expect(compressed.totalCount).toBe(50);
      expect(compressed.chunks).toHaveLength(1);
      expect(compressed.chunks[0]).toEqual({ delta: 1000, count: 49 });
      // Massive compression ratio improvement over raw
      expect(compressed.compressionRatio).toBeLessThan(0.2);
    });

    it('groups multi-phase cadence intervals into sequential chunks', () => {
      // 10 ticks at 1000ms, then 5 ticks at 500ms, then 20 ticks at 2000ms
      const base = 1729900000000;
      const timestamps = [base];
      let curr = base;

      for (let i = 0; i < 10; i++) {
        curr += 1000;
        timestamps.push(curr);
      }
      for (let i = 0; i < 5; i++) {
        curr += 500;
        timestamps.push(curr);
      }
      for (let i = 0; i < 20; i++) {
        curr += 2000;
        timestamps.push(curr);
      }

      const compressed = compressTimestampDeltas(timestamps);
      expect(compressed.totalCount).toBe(1 + 10 + 5 + 20);
      expect(compressed.chunks).toHaveLength(3);
      expect(compressed.chunks[0]).toEqual({ delta: 1000, count: 10 });
      expect(compressed.chunks[1]).toEqual({ delta: 500, count: 5 });
      expect(compressed.chunks[2]).toEqual({ delta: 2000, count: 20 });
    });

    it('throws error on non-monotonic decreasing timestamps', () => {
      const timestamps = [1729900000000, 1729900002000, 1729900001000];
      expect(() => compressTimestampDeltas(timestamps)).toThrow(
        'Timestamps must be non-decreasing'
      );
    });

    it('throws error on non-finite timestamp elements', () => {
      expect(() => compressTimestampDeltas([1000, NaN, 2000])).toThrow(
        'Timestamp at index 1 must be a finite number'
      );
      expect(() => compressTimestampDeltas([1000, Infinity])).toThrow(
        'Timestamp at index 1 must be a finite number'
      );
    });
  });

  describe('decompressTimestampDeltas & Lossless Round-Trip Invariant', () => {
    it('achieves 100% lossless round-trip on realistic Pomodoro focus telemetry', () => {
      // Simulated 25-minute Pomodoro session with occasional micro-jitters
      const base = 1730000000000;
      const original: number[] = [base];
      let current = base;

      for (let i = 0; i < 1500; i++) {
        // mostly 1000ms ticks with occasional 1001ms/999ms jitter
        const jitter = i % 100 === 0 ? 1005 : 1000;
        current += jitter;
        original.push(current);
      }

      const compressed = compressTimestampDeltas(original);
      const decompressed = decompressTimestampDeltas(compressed);

      expect(decompressed).toHaveLength(original.length);
      expect(decompressed).toEqual(original);
    });

    it('round-trips empty and single-element buffers cleanly', () => {
      const emptyBuf = compressTimestampDeltas([]);
      expect(decompressTimestampDeltas(emptyBuf)).toEqual([]);

      const singleBuf = compressTimestampDeltas([1729955555555]);
      expect(decompressTimestampDeltas(singleBuf)).toEqual([1729955555555]);
    });

    it('throws descriptive error on corrupted buffers', () => {
      // Missing or non-object buffer
      expect(() => decompressTimestampDeltas(null as any)).toThrow(
        'Invalid buffer provided'
      );

      // Corrupted totalCount
      expect(() =>
        decompressTimestampDeltas({
          initialTimestamp: 1000,
          totalCount: -1,
          chunks: [],
          compressionRatio: 1,
        })
      ).toThrow('totalCount must be a non-negative integer');

      // Chunk count overflow
      expect(() =>
        decompressTimestampDeltas({
          initialTimestamp: 1000,
          totalCount: 3,
          chunks: [{ delta: 50, count: 5 }],
          compressionRatio: 1,
        })
      ).toThrow('chunk counts sum to more than totalCount');

      // Chunk count underflow
      expect(() =>
        decompressTimestampDeltas({
          initialTimestamp: 1000,
          totalCount: 5,
          chunks: [{ delta: 50, count: 1 }],
          compressionRatio: 1,
        })
      ).toThrow('chunks yielded 2 timestamps, expected totalCount of 5');

      // Invalid chunk values
      expect(() =>
        decompressTimestampDeltas({
          initialTimestamp: 1000,
          totalCount: 3,
          chunks: [{ delta: NaN, count: 2 }],
          compressionRatio: 1,
        })
      ).toThrow('Invalid chunk');
    });
  });
});

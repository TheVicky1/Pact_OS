import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatByteSize } from '../src/lib/data/byte-formatter';

describe('formatByteSize', () => {
  describe('zero bytes handling', () => {
    it('returns "0 B" for 0 bytes by default', () => {
      assert.strictEqual(formatByteSize(0), '0 B');
    });

    it('returns "0B" when space: false', () => {
      assert.strictEqual(formatByteSize(0, { space: false }), '0B');
    });

    it('returns "0 B" regardless of standard or precision', () => {
      assert.strictEqual(formatByteSize(0, { standard: 'iec', precision: 4 }), '0 B');
      assert.strictEqual(formatByteSize(0, { standard: 'si', precision: 0 }), '0 B');
    });
  });

  describe('negative bytes handling', () => {
    it('formats negative bytes with minus sign', () => {
      assert.strictEqual(formatByteSize(-500), '-500 B');
      assert.strictEqual(formatByteSize(-2500000, { precision: 1 }), '-2.5 MB');
      assert.strictEqual(formatByteSize(-1048576, { standard: 'iec', precision: 2 }), '-1.00 MiB');
    });
  });

  describe('SI units (base 1000)', () => {
    it('formats exact byte boundaries properly', () => {
      assert.strictEqual(formatByteSize(512), '512 B');
      assert.strictEqual(formatByteSize(1000), '1.00 KB');
      assert.strictEqual(formatByteSize(1500000), '1.50 MB');
      assert.strictEqual(formatByteSize(2500000000), '2.50 GB');
      assert.strictEqual(formatByteSize(1000000000000), '1.00 TB');
      assert.strictEqual(formatByteSize(1000000000000000), '1.00 PB');
    });

    it('respects custom precision options', () => {
      assert.strictEqual(formatByteSize(1234567, { precision: 1 }), '1.2 MB');
      assert.strictEqual(formatByteSize(1234567, { precision: 3 }), '1.235 MB');
      assert.strictEqual(formatByteSize(1234567, { precision: 0 }), '1 MB');
    });

    it('respects space: false option', () => {
      assert.strictEqual(formatByteSize(12400000, { precision: 1, space: false }), '12.4MB');
      assert.strictEqual(formatByteSize(512, { space: false }), '512B');
    });
  });

  describe('IEC binary units (base 1024)', () => {
    it('formats binary kibibytes, mebibytes, gibibytes', () => {
      assert.strictEqual(formatByteSize(1024, { standard: 'iec' }), '1.00 KiB');
      assert.strictEqual(formatByteSize(1048576, { standard: 'iec' }), '1.00 MiB');
      assert.strictEqual(formatByteSize(1610612736, { standard: 'iec', precision: 2 }), '1.50 GiB');
      assert.strictEqual(formatByteSize(1099511627776, { standard: 'iec' }), '1.00 TiB');
      assert.strictEqual(formatByteSize(1125899906842624, { standard: 'iec' }), '1.00 PiB');
    });

    it('formats with space: false', () => {
      assert.strictEqual(formatByteSize(1048576, { standard: 'iec', space: false }), '1.00MiB');
    });
  });

  describe('edge cases and rounding transitions', () => {
    it('handles values just below next tier', () => {
      assert.strictEqual(formatByteSize(999), '999 B');
      assert.strictEqual(formatByteSize(1023, { standard: 'iec' }), '1023 B');
    });

    it('handles rounding that bumps to next tier', () => {
      // 999950 bytes = 999.95 KB. At precision 1, rounds to 1000.0 KB -> should bump to 1.0 MB
      assert.strictEqual(formatByteSize(999950, { precision: 1 }), '1.0 MB');
    });
  });

  describe('type error and invalid arguments handling', () => {
    it('throws TypeError for non-numbers, NaN, or non-finite numbers', () => {
      assert.throws(() => formatByteSize(NaN), TypeError);
      assert.throws(() => formatByteSize(Infinity), TypeError);
      assert.throws(() => formatByteSize(-Infinity), TypeError);
      // @ts-expect-error testing invalid type
      assert.throws(() => formatByteSize('1024' as unknown as number), TypeError);
      // @ts-expect-error testing invalid type
      assert.throws(() => formatByteSize(null as unknown as number), TypeError);
      // @ts-expect-error testing invalid type
      assert.throws(() => formatByteSize(undefined as unknown as number), TypeError);
    });

    it('throws TypeError for invalid precision', () => {
      assert.throws(() => formatByteSize(1024, { precision: -1 }), TypeError);
      assert.throws(() => formatByteSize(1024, { precision: NaN }), TypeError);
      assert.throws(() => formatByteSize(1024, { precision: Infinity }), TypeError);
    });
  });
});

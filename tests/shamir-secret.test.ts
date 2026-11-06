import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitSecret,
  reconstructSecret,
  gfAdd,
  gfSub,
  gfMul,
  gfDiv,
  type SecretShare,
} from '../src/lib/security/shamir-secret';

describe('Shamir Secret Sharing (2-of-3) Unit Tests (#678)', () => {
  describe('Galois Field GF(256) Arithmetic Invariants', () => {
    it('satisfies addition and subtraction identity in GF(256)', () => {
      assert.strictEqual(gfAdd(42, 42), 0);
      assert.strictEqual(gfSub(42, 42), 0);
      assert.strictEqual(gfAdd(0x57, 0x83), 0xd4);
      assert.strictEqual(gfSub(0xd4, 0x83), 0x57);
    });

    it('satisfies multiplication and division properties in GF(256)', () => {
      assert.strictEqual(gfMul(0, 42), 0);
      assert.strictEqual(gfMul(42, 0), 0);
      assert.strictEqual(gfMul(1, 42), 42);
      assert.strictEqual(gfDiv(42, 1), 42);

      // Inverse property
      const a = 0x53;
      const b = 0xca;
      const prod = gfMul(a, b);
      assert.strictEqual(gfDiv(prod, b), a);
      assert.strictEqual(gfDiv(prod, a), b);
    });

    it('throws error on division by zero', () => {
      assert.throws(() => gfDiv(42, 0), /Division by zero in GF\(256\)/);
    });
  });

  describe('2-of-3 Threshold Reconstruction Invariants', () => {
    const testSecret = 'pact-commitment-seed-2026-🚀-discipline';

    it('reconstructs secret from any 2 of 3 shares (permutations 1&2, 1&3, 2&3)', () => {
      const shares = splitSecret(testSecret, 3, 2);
      assert.strictEqual(shares.length, 3);

      const [s1, s2, s3] = shares;

      // Pair (1, 2)
      assert.strictEqual(reconstructSecret([s1, s2]), testSecret);
      // Pair (2, 1) - order independence
      assert.strictEqual(reconstructSecret([s2, s1]), testSecret);
      // Pair (1, 3)
      assert.strictEqual(reconstructSecret([s1, s3]), testSecret);
      // Pair (3, 1)
      assert.strictEqual(reconstructSecret([s3, s1]), testSecret);
      // Pair (2, 3)
      assert.strictEqual(reconstructSecret([s2, s3]), testSecret);
      // Pair (3, 2)
      assert.strictEqual(reconstructSecret([s3, s2]), testSecret);
      // All 3 shares
      assert.strictEqual(reconstructSecret([s1, s2, s3]), testSecret);
    });

    it('reconstructs hex encoded secrets cleanly', () => {
      const hexSecret = '0123456789abcdef0123456789abcdef';
      const shares = splitSecret(hexSecret, 3, 2);
      const [s1, s2] = shares;
      assert.strictEqual(reconstructSecret([s1, s2]), hexSecret);
    });

    it('preserves uppercase hex format by following the UTF-8 path', () => {
      const upperHex = 'DEADBEEFCAFEBABE1234';
      const shares = splitSecret(upperHex, 3, 2);
      const [s1, , s3] = shares;
      assert.strictEqual(reconstructSecret([s1, s3]), upperHex);
    });

    it('handles multi-byte UTF-8 strings and emojis', () => {
      const utf8Secret = 'Lời hứa kỷ luật: 100% hoàn thành mục tiêu 🎯🔥💎';
      const shares = splitSecret(utf8Secret, 3, 2);
      const [, s2, s3] = shares;
      assert.strictEqual(reconstructSecret([s2, s3]), utf8Secret);
    });

    it('handles single character and long secret strings', () => {
      const shortSecret = 'x';
      const shortShares = splitSecret(shortSecret, 3, 2);
      assert.strictEqual(reconstructSecret([shortShares[0], shortShares[1]]), shortSecret);

      const longSecret = 'a'.repeat(512);
      const longShares = splitSecret(longSecret, 3, 2);
      assert.strictEqual(reconstructSecret([longShares[1], longShares[2]]), longSecret);
    });
  });

  describe('Threshold & Insufficient Shares Enforcement', () => {
    it('throws error when fewer than threshold shares are provided', () => {
      const shares = splitSecret('confidential-vault-key', 3, 2);
      assert.throws(
        () => reconstructSecret([shares[0]]),
        /Insufficient shares to reconstruct secret/
      );
      assert.throws(
        () => reconstructSecret([]),
        /Insufficient shares to reconstruct secret/
      );
    });

    it('throws error on duplicate share indices', () => {
      const shares = splitSecret('confidential-vault-key', 3, 2);
      assert.throws(
        () => reconstructSecret([shares[0], shares[0]]),
        /Duplicate share index detected: 1/
      );
    });
  });

  describe('Tamper Detection & Integrity Verification', () => {
    it('detects tampered payload bytes and rejects reconstruction', () => {
      const secret = 'pact-vault-confidential-note-for-tamper-check';
      const shares = splitSecret(secret, 3, 2);

      // Tamper byte 8 of share 2 by flipping bits with XOR
      const originalHex = shares[1].shareDataHex;
      const flipped = (parseInt(originalHex.substring(16, 18), 16) ^ 0xff)
        .toString(16)
        .padStart(2, '0');
      const tamperedHex = originalHex.substring(0, 16) + flipped + originalHex.substring(18);

      const tamperedShare: SecretShare = {
        shareIndex: shares[1].shareIndex,
        shareDataHex: tamperedHex,
      };

      assert.throws(
        () => reconstructSecret([shares[0], tamperedShare]),
        /checksum verification failed/
      );
    });

    it('rejects tampered format tags and invalid encodings', () => {
      const shares = splitSecret('test-secret', 3, 2);
      // Malformed hex data
      assert.throws(
        () =>
          reconstructSecret([
            shares[0],
            { shareIndex: 2, shareDataHex: 'not-hex-data!!' },
          ]),
        /Invalid share data encoding/
      );

      // Odd length hex
      assert.throws(
        () =>
          reconstructSecret([
            shares[0],
            { shareIndex: 2, shareDataHex: shares[1].shareDataHex.slice(0, -1) },
          ]),
        /Invalid share data length/
      );

      // Inconsistent lengths between shares
      assert.throws(
        () =>
          reconstructSecret([
            shares[0],
            { shareIndex: 2, shareDataHex: shares[1].shareDataHex + 'aa' },
          ]),
        /Inconsistent share data lengths/
      );
    });
  });

  describe('Validation & Edge Cases', () => {
    it('throws error on empty secret input in splitSecret', () => {
      assert.throws(() => splitSecret(''), /Secret cannot be empty/);
    });

    it('throws error on invalid threshold or totalShares parameters', () => {
      assert.throws(() => splitSecret('key', 3, 1), /Threshold must be at least 2/);
      assert.throws(() => splitSecret('key', 2, 3), /Total shares cannot be less than threshold/);
      assert.throws(() => splitSecret('key', 2.5, 2), /Threshold and total shares must be integers/);
      assert.throws(() => splitSecret('key', 3, NaN), /Threshold and total shares must be integers/);
      assert.throws(() => splitSecret('key', 256, 2), /Total shares cannot exceed 255/);
    });

    it('throws error on invalid shareIndex in reconstructSecret', () => {
      const shares = splitSecret('test', 3, 2);
      assert.throws(
        () =>
          reconstructSecret([
            shares[0],
            { shareIndex: 0, shareDataHex: shares[1].shareDataHex },
          ]),
        /Invalid share index: 0/
      );
      assert.throws(
        () =>
          reconstructSecret([
            shares[0],
            { shareIndex: 256, shareDataHex: shares[1].shareDataHex },
          ]),
        /Invalid share index: 256/
      );
      assert.throws(
        () =>
          reconstructSecret([
            shares[0],
            { shareIndex: 1.5, shareDataHex: shares[1].shareDataHex },
          ]),
        /Invalid share index: 1.5/
      );
    });
  });
});

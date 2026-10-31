import { describe, it, expect } from 'vitest';
import {
  splitSecret,
  reconstructSecret,
  gfAdd,
  gfSub,
  gfMul,
  gfDiv,
  type SecretShare,
} from '../src/lib/security/shamir-secret';

describe('Galois Field GF(256) Arithmetic', () => {
  it('implements addition and subtraction as XOR', () => {
    expect(gfAdd(0x57, 0x83)).toBe(0x57 ^ 0x83);
    expect(gfSub(0x57, 0x83)).toBe(0x57 ^ 0x83);
    expect(gfAdd(0xaa, 0xaa)).toBe(0);
  });

  it('implements multiplication and division over GF(256)', () => {
    // Identity element 1
    expect(gfMul(0x57, 1)).toBe(0x57);
    expect(gfMul(1, 0xae)).toBe(0xae);
    expect(gfMul(0, 0x57)).toBe(0);
    expect(gfMul(0x57, 0)).toBe(0);

    // Multiplication inverse
    const a = 0x53;
    const b = 0xca;
    const prod = gfMul(a, b);
    expect(gfDiv(prod, b)).toBe(a);
    expect(gfDiv(prod, a)).toBe(b);

    expect(() => gfDiv(a, 0)).toThrow('Division by zero');
  });
});

describe("Shamir's Secret Sharing (2-of-3 threshold)", () => {
  it('splits and reconstructs a UTF-8 secret across all pair combinations', () => {
    const secret = 'pact:commitment:recovery:phrase:2026';
    const shares = splitSecret(secret, 3, 2);

    expect(shares).toHaveLength(3);
    expect(shares[0].shareIndex).toBe(1);
    expect(shares[1].shareIndex).toBe(2);
    expect(shares[2].shareIndex).toBe(3);

    // Test all 3 combinations of pairs: (1, 2), (1, 3), (2, 3)
    const recon12 = reconstructSecret([shares[0], shares[1]]);
    expect(recon12).toBe(secret);

    const recon13 = reconstructSecret([shares[0], shares[2]]);
    expect(recon13).toBe(secret);

    const recon23 = reconstructSecret([shares[1], shares[2]]);
    expect(recon23).toBe(secret);

    // Reconstructing with all 3 shares also yields original secret
    const recon123 = reconstructSecret(shares);
    expect(recon123).toBe(secret);
  });

  it('splits and reconstructs a hex-encoded secret cleanly', () => {
    const hexSecret = '0123456789abcdef0123456789abcdef';
    const shares = splitSecret(hexSecret, 3, 2);

    expect(shares).toHaveLength(3);
    const recovered = reconstructSecret([shares[0], shares[2]]);
    expect(recovered).toBe(hexSecret);
  });

  it('fails when fewer than threshold shares are provided', () => {
    const secret = 'super-secret-vault-key';
    const shares = splitSecret(secret, 3, 2);

    expect(() => reconstructSecret([shares[0]])).toThrow(
      'Insufficient shares to reconstruct secret'
    );
    expect(() => reconstructSecret([])).toThrow(
      'Insufficient shares to reconstruct secret'
    );
  });

  it('rejects duplicate share indices', () => {
    const secret = 'pact-discipline-pledge';
    const shares = splitSecret(secret, 3, 2);

    // Provide share 1 twice
    expect(() => reconstructSecret([shares[0], shares[0]])).toThrow(
      'Duplicate share index detected'
    );
  });

  it('rejects empty secrets or invalid threshold parameters', () => {
    expect(() => splitSecret('')).toThrow('Secret cannot be empty');
    expect(() => splitSecret('test', 2, 3)).toThrow(
      'Total shares cannot be less than threshold'
    );
    expect(() => splitSecret('test', 3, 1)).toThrow(
      'Threshold must be at least 2'
    );
  });

  it('detects tampered or corrupt shares without crashing', () => {
    const secret = 'confidential-accountability-note';
    const shares = splitSecret(secret, 3, 2);

    // Tamper one byte in share 2
    const tamperedHex = 'ff' + shares[1].shareDataHex.substring(2);
    const tamperedShare: SecretShare = {
      shareIndex: shares[1].shareIndex,
      shareDataHex: tamperedHex,
    };

    // Reconstruction will not equal the original secret because polynomial data is corrupt
    const corruptedResult = reconstructSecret([shares[0], tamperedShare]);
    expect(corruptedResult).not.toBe(secret);
  });
});

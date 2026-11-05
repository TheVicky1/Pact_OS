import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateLuhnCheckDigit,
  validateLuhnString,
  generateLuhnBondCode
} from '../src/lib/data/luhn-validator';

describe('Luhn Checksum Validator for Accountability Bond IDs', () => {
  describe('calculateLuhnCheckDigit', () => {
    it('throws error when input has no numeric digits', () => {
      assert.throws(
        () => calculateLuhnCheckDigit(''),
        /Payload contains no numeric digits/
      );
      assert.throws(
        () => calculateLuhnCheckDigit('   '),
        /Payload contains no numeric digits/
      );
      assert.throws(
        () => calculateLuhnCheckDigit('abc-def'),
        /Payload contains no numeric digits/
      );
    });

    it('calculates check digit correctly for standard numeric payloads', () => {
      // 7992739871 -> check digit 3 gives valid Luhn 79927398713
      assert.equal(calculateLuhnCheckDigit('7992739871'), 3);
      // Single digit 0 -> (10 - 0) % 10 = 0
      assert.equal(calculateLuhnCheckDigit('0'), 0);
      // Single digit 5 -> 5 * 2 = 10 -> 10 - 9 = 1 -> (10 - 1) % 10 = 9
      assert.equal(calculateLuhnCheckDigit('5'), 9);
      // PACT sample
      assert.equal(calculateLuhnCheckDigit('4992739871'), 6);
    });

    it('strips non-digits from input payload before calculation', () => {
      assert.equal(calculateLuhnCheckDigit('799-273-9871'), 3);
      assert.equal(calculateLuhnCheckDigit('BOND# 7992739871'), 3);
    });
  });

  describe('validateLuhnString', () => {
    it('returns false for empty string or strings without digits', () => {
      assert.equal(validateLuhnString(''), false);
      assert.equal(validateLuhnString('   '), false);
      assert.equal(validateLuhnString('NON-NUMERIC'), false);
    });

    it('returns true for valid Luhn numbers', () => {
      assert.equal(validateLuhnString('79927398713'), true);
      assert.equal(validateLuhnString('00'), true);
      assert.equal(validateLuhnString('59'), true);
      assert.equal(validateLuhnString('49927398716'), true);
    });

    it('returns false for invalid Luhn numbers', () => {
      assert.equal(validateLuhnString('79927398710'), false);
      assert.equal(validateLuhnString('79927398712'), false);
      assert.equal(validateLuhnString('79927398714'), false);
    });

    it('ignores non-digit formatting characters when validating', () => {
      assert.equal(validateLuhnString('PACT-79927398713'), true);
      assert.equal(validateLuhnString('799-273-9871-3'), true);
      assert.equal(validateLuhnString('BOND-49927398716'), true);
      assert.equal(validateLuhnString('BOND-79927398714'), false);
    });

    it('detects single-digit errors', () => {
      const valid = '79927398713';
      for (let i = 0; i < valid.length; i++) {
        const originalDigit = Number(valid[i]);
        const corruptedDigit = (originalDigit + 1) % 10;
        const corrupted = valid.slice(0, i) + corruptedDigit + valid.slice(i + 1);
        assert.equal(validateLuhnString(corrupted), false);
      }
    });

    it('detects adjacent digit transpositions', () => {
      const valid = '79927398713';
      for (let i = 0; i < valid.length - 1; i++) {
        if (valid[i] === valid[i + 1]) continue;
        const chars = valid.split('');
        const temp = chars[i];
        chars[i] = chars[i + 1];
        chars[i + 1] = temp;
        const swapped = chars.join('');
        const isNineZero =
          (valid[i] === '0' && valid[i + 1] === '9') ||
          (valid[i] === '9' && valid[i + 1] === '0');
        if (!isNineZero) {
          assert.equal(validateLuhnString(swapped), false);
        }
      }
    });
  });

  describe('generateLuhnBondCode', () => {
    it('generates a formatted bond code with the computed check digit appended', () => {
      const bondCode = generateLuhnBondCode('BOND', '7992739871');
      assert.equal(bondCode, 'BOND-79927398713');
      assert.equal(validateLuhnString(bondCode), true);
    });

    it('strips non-digits from payload and attaches valid check digit', () => {
      const bondCode = generateLuhnBondCode('PACT-SEC', '123-456');
      const cleanDigits = '123456';
      const expectedCheckDigit = calculateLuhnCheckDigit(cleanDigits);
      assert.equal(bondCode, `PACT-SEC-${cleanDigits}${expectedCheckDigit}`);
      assert.equal(validateLuhnString(bondCode), true);
    });
  });
});

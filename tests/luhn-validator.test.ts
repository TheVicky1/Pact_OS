import { describe, it, expect } from 'vitest';
import {
  calculateLuhnCheckDigit,
  validateLuhnString,
  generateLuhnBondCode
} from '../src/lib/data/luhn-validator';

describe('Luhn Checksum Validator for Accountability Bond IDs', () => {
  describe('calculateLuhnCheckDigit', () => {
    it('throws error when input has no numeric digits', () => {
      expect(() => calculateLuhnCheckDigit('')).toThrow('Payload contains no numeric digits');
      expect(() => calculateLuhnCheckDigit('   ')).toThrow('Payload contains no numeric digits');
      expect(() => calculateLuhnCheckDigit('abc-def')).toThrow('Payload contains no numeric digits');
    });

    it('calculates check digit correctly for standard numeric payloads', () => {
      // 7992739871 -> check digit 3 gives valid Luhn 79927398713
      expect(calculateLuhnCheckDigit('7992739871')).toBe(3);
      // Single digit 0 -> 0 * 2 = 0 -> (10 - 0) % 10 = 0
      expect(calculateLuhnCheckDigit('0')).toBe(0);
      // Single digit 5 -> 5 * 2 = 10 -> 10 - 9 = 1 -> (10 - 1) % 10 = 9
      expect(calculateLuhnCheckDigit('5')).toBe(9);
    });

    it('strips non-digits from input payload before calculation', () => {
      expect(calculateLuhnCheckDigit('799-273-9871')).toBe(3);
      expect(calculateLuhnCheckDigit('BOND# 7992739871')).toBe(3);
    });
  });

  describe('validateLuhnString', () => {
    it('returns false for empty string or strings without digits', () => {
      expect(validateLuhnString('')).toBe(false);
      expect(validateLuhnString('   ')).toBe(false);
      expect(validateLuhnString('NON-NUMERIC')).toBe(false);
    });

    it('returns true for valid Luhn numbers', () => {
      expect(validateLuhnString('79927398713')).toBe(true);
      expect(validateLuhnString('00')).toBe(true);
      expect(validateLuhnString('59')).toBe(true);
      expect(validateLuhnString('49927398716')).toBe(true);
    });

    it('returns false for invalid Luhn numbers', () => {
      expect(validateLuhnString('79927398710')).toBe(false);
      expect(validateLuhnString('79927398712')).toBe(false);
      expect(validateLuhnString('79927398714')).toBe(false);
    });

    it('ignores non-digit formatting characters when validating', () => {
      expect(validateLuhnString('PACT-79927398713')).toBe(true);
      expect(validateLuhnString('799-273-9871-3')).toBe(true);
      expect(validateLuhnString('BOND-79927398714')).toBe(false);
    });
  });

  describe('generateLuhnBondCode', () => {
    it('generates a formatted bond code with the computed check digit appended', () => {
      const bondCode = generateLuhnBondCode('BOND', '7992739871');
      expect(bondCode).toBe('BOND-79927398713');
      expect(validateLuhnString(bondCode)).toBe(true);
    });

    it('strips non-digits from payload and attaches valid check digit', () => {
      const bondCode = generateLuhnBondCode('PACT-SEC', '123-456');
      const cleanDigits = '123456';
      const expectedCheckDigit = calculateLuhnCheckDigit(cleanDigits);
      expect(bondCode).toBe(`PACT-SEC-${cleanDigits}${expectedCheckDigit}`);
      expect(validateLuhnString(bondCode)).toBe(true);
    });

    it('throws error when payload contains no numeric digits', () => {
      expect(() => generateLuhnBondCode('BOND', 'ABC-XYZ')).toThrow(
        'Payload contains no numeric digits'
      );
    });
  });
});
/**
 * Unit tests for the storage-quota detector utility.
 *
 * Exercises `isQuotaExceededError` against plain-object stubs shaped like the
 * `DOMException`s thrown by Chrome/Edge (Blink), Firefox (Gecko) and Safari
 * (WebKit) when an origin exhausts its storage quota, so no DOM-emulation
 * dependency is required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isQuotaExceededError, QUOTA_EXCEEDED_CODE } from '../src/lib/storage-quota-detector';

describe('QUOTA_EXCEEDED_CODE', () => {
  it('is DOMException.QUOTA_EXCEEDED_ERR (22)', () => {
    assert.equal(QUOTA_EXCEEDED_CODE, 22);
  });
});

describe('isQuotaExceededError — numeric code', () => {
  it('matches code 22 regardless of message or name', () => {
    assert.equal(isQuotaExceededError({ code: 22 }), true);
    assert.equal(isQuotaExceededError({ code: 22, name: 'QuotaExceededError', message: '' }), true);
  });

  it('does not match other DOMException codes', () => {
    assert.equal(isQuotaExceededError({ code: 1 }), false);
    assert.equal(isQuotaExceededError({ code: 8 }), false);
    assert.equal(isQuotaExceededError({ code: 21 }), false);
  });
});

describe('isQuotaExceededError — name matching', () => {
  it('matches a QuotaExceededError name (Blink / WebKit)', () => {
    assert.equal(isQuotaExceededError({ name: 'QuotaExceededError' }), true);
  });

  it('matches the Gecko legacy result-code name', () => {
    assert.equal(isQuotaExceededError({ name: 'NS_ERROR_DOM_QUOTA_REACHED' }), true);
  });

  it('does not match unrelated error names', () => {
    assert.equal(isQuotaExceededError({ name: 'SyntaxError' }), false);
    assert.equal(isQuotaExceededError({ name: 'TypeError' }), false);
  });
});

describe('isQuotaExceededError — message patterns', () => {
  it('matches Chrome/Edge localStorage overflow', () => {
    const error = {
      message:
        "Failed to execute 'setItem' on 'Storage': Setting the value of 'x' exceeded the quota.",
    };
    assert.equal(isQuotaExceededError(error), true);
  });

  it('matches Firefox "quota has been exceeded"', () => {
    assert.equal(isQuotaExceededError({ message: 'The quota has been exceeded' }), true);
  });

  it('matches Safari "QuotaExceededError: DOM Exception 22"', () => {
    assert.equal(isQuotaExceededError({ message: 'QuotaExceededError: DOM Exception 22' }), true);
  });

  it('does not match a message about a plain non-quota error', () => {
    assert.equal(isQuotaExceededError({ message: 'Network request failed' }), false);
  });

  it('does not match the word "quota" when it is not about exceeding it', () => {
    assert.equal(isQuotaExceededError({ message: 'Your quota is 5GB' }), false);
  });
});

describe('isQuotaExceededError — non-object and falsy inputs', () => {
  it('returns false for null and undefined', () => {
    assert.equal(isQuotaExceededError(null), false);
    assert.equal(isQuotaExceededError(undefined), false);
  });

  it('returns false for primitives', () => {
    assert.equal(isQuotaExceededError('quota exceeded'), false);
    assert.equal(isQuotaExceededError(22), false);
    assert.equal(isQuotaExceededError(true), false);
    assert.equal(isQuotaExceededError(Symbol('x')), false);
  });

  it('returns false for a plain empty object', () => {
    assert.equal(isQuotaExceededError({}), false);
  });
});

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

/**
 * A minimal in-memory `Storage` stub whose `setItem` can be told to throw,
 * mimicking what each browser engine does when an origin's quota is full.
 */
function createThrowingStorage(failure: unknown) {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (_key: string, _value: string): void => {
      throw failure;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    get length() {
      return store.size;
    },
  };
}

type StorageLike = ReturnType<typeof createThrowingStorage>;

const QUOTA_WARNING_EVENT = 'storage-quota-warning';

/**
 * Guarded write used to exercise the detector the way app code consumes it:
 * a quota failure is swallowed and surfaced as a browser warning event, while
 * any other failure is re-thrown untouched.
 */
function guardedSetItem(
  storage: StorageLike,
  target: EventTarget,
  key: string,
  value: string,
): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      target.dispatchEvent(new CustomEvent(QUOTA_WARNING_EVENT, { detail: { key, error } }));
      return false;
    }
    throw error;
  }
}

describe('isQuotaExceededError — mocked localStorage throw behaviour', () => {
  it('detects a real DOMException thrown by a full localStorage (Blink)', () => {
    const storage = createThrowingStorage(
      new DOMException(
        "Failed to execute 'setItem' on 'Storage': Setting the value of 'draft' exceeded the quota.",
        'QuotaExceededError',
      ),
    );

    let caught: unknown;
    try {
      storage.setItem('draft', 'x'.repeat(1024));
    } catch (error) {
      caught = error;
    }

    assert.ok(caught instanceof DOMException);
    assert.equal((caught as DOMException).code, QUOTA_EXCEEDED_CODE);
    assert.equal(isQuotaExceededError(caught), true);
  });

  it('detects the Gecko legacy NS_ERROR_DOM_QUOTA_REACHED throw (code 1014)', () => {
    const storage = createThrowingStorage({
      name: 'NS_ERROR_DOM_QUOTA_REACHED',
      code: 1014,
      message: 'Persistent storage maximum size reached',
    });

    assert.throws(
      () => storage.setItem('draft', 'value'),
      (error: unknown) => isQuotaExceededError(error),
    );
  });

  it('detects a WebKit throw identified only by code 22 and its message', () => {
    const storage = createThrowingStorage({
      name: 'Error',
      code: 22,
      message: 'QuotaExceededError: DOM Exception 22',
    });

    assert.throws(
      () => storage.setItem('draft', 'value'),
      (error: unknown) => isQuotaExceededError(error),
    );
  });

  it('does not classify a non-quota storage failure as a quota error', () => {
    const storage = createThrowingStorage(
      new DOMException('The operation is insecure.', 'SecurityError'),
    );

    assert.throws(
      () => storage.setItem('draft', 'value'),
      (error: unknown) => !isQuotaExceededError(error),
    );
  });
});

describe('isQuotaExceededError — browser warning event on quota exceeded', () => {
  it('dispatches exactly one warning event when the write exceeds the quota', () => {
    const quotaError = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    const storage = createThrowingStorage(quotaError);
    const target = new EventTarget();
    const events: CustomEvent[] = [];
    target.addEventListener(QUOTA_WARNING_EVENT, (event) => events.push(event as CustomEvent));

    const written = guardedSetItem(storage, target, 'draft', 'value');

    assert.equal(written, false);
    assert.equal(events.length, 1);
    assert.equal(events[0].detail.key, 'draft');
    assert.equal(events[0].detail.error, quotaError);
    assert.equal(storage.length, 0);
  });

  it('does not dispatch a warning event and re-throws for unrelated failures', () => {
    const securityError = new DOMException('The operation is insecure.', 'SecurityError');
    const storage = createThrowingStorage(securityError);
    const target = new EventTarget();
    let warnings = 0;
    target.addEventListener(QUOTA_WARNING_EVENT, () => {
      warnings += 1;
    });

    assert.throws(() => guardedSetItem(storage, target, 'draft', 'value'), (error: unknown) => error === securityError);
    assert.equal(warnings, 0);
  });
});

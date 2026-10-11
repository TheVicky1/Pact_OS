import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { triggerHaptic, HAPTIC_PATTERNS } from '../src/lib/mobile/haptics';

describe('haptics utility', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('safely returns false when navigator is undefined', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    assert.strictEqual(triggerHaptic('light'), false);
  });

  it('safely returns false when navigator.vibrate is not a function', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });
    assert.strictEqual(triggerHaptic('success'), false);
  });

  it('invokes navigator.vibrate with standard pattern', () => {
    let capturedPattern: number[] | null = null;
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        vibrate: (pattern: number[]) => {
          capturedPattern = pattern;
          return true;
        },
      },
      writable: true,
      configurable: true,
    });

    const res = triggerHaptic('warning');
    assert.strictEqual(res, true);
    assert.deepStrictEqual(capturedPattern, HAPTIC_PATTERNS.warning);
  });

  it('supports custom vibration number arrays', () => {
    let capturedPattern: number[] | null = null;
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        vibrate: (pattern: number[]) => {
          capturedPattern = pattern;
          return true;
        },
      },
      writable: true,
      configurable: true,
    });

    const custom = [100, 50, 100];
    const res = triggerHaptic(custom);
    assert.strictEqual(res, true);
    assert.deepStrictEqual(capturedPattern, custom);
  });
});

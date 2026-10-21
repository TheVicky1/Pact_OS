// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  constantTimeEqual,
  timingSafeBufferEqual,
  timingSafeSelect,
} from '../src/lib/security/constant-time';

describe('constantTimeEqual', () => {
  it.each([
    ['invite-token', 'invite-token', true],
    ['invite-token', 'Invite-token', false],
    ['invite-token', 'invite-tokeN', false],
    ['invite-token', 'invite-Xoken', false],
    ['token', 'token-longer', false],
    ['token-longer', 'token', false],
    ['', '', true],
    ['', 'a', false],
    ['a', '', false],
    ['\0', '', false],
    ['a\0b', 'a\0b', true],
    ['a\0b', 'a\0c', false],
    ['你好🔒', '你好🔒', true],
    ['你好🔒', '你好🔓', false],
    ['é', 'aa', false],
    ['é', 'e', false],
  ])('compares %j and %j as %s', (a, b, expected) => {
    expect(constantTimeEqual(a, b)).toBe(expected);
  });

  it('defaults to NFC normalization, including empty options', () => {
    expect(constantTimeEqual('café', 'cafe\u0301')).toBe(true);
    expect(constantTimeEqual('cafe\u0301', 'café', {})).toBe(true);
    expect(constantTimeEqual('\u212B', 'A\u030A', { normalizeUnicode: true })).toBe(true);
  });

  it('can disable normalization without changing identical text', () => {
    expect(constantTimeEqual('café', 'cafe\u0301', { normalizeUnicode: false })).toBe(false);
    expect(constantTimeEqual('cafe\u0301', 'cafe\u0301', { normalizeUnicode: false })).toBe(true);
  });

  it('does not apply compatibility normalization, case folding, or trimming', () => {
    expect(constantTimeEqual('Ａ', 'A')).toBe(false);
    expect(constantTimeEqual('PIN', 'pin')).toBe(false);
    expect(constantTimeEqual('pin ', 'pin')).toBe(false);
  });

  it('follows TextEncoder replacement semantics for unpaired surrogates', () => {
    expect(constantTimeEqual('\uD800', '\uFFFD')).toBe(true);
    expect(constantTimeEqual('\uD800', '\uDC00', { normalizeUnicode: false })).toBe(true);
  });
});

describe('timingSafeBufferEqual', () => {
  it.each([
    [[], [], true],
    [[1, 2, 255], [1, 2, 255], true],
    [[1, 2, 3], [0, 2, 3], false],
    [[1, 2, 3], [1, 0, 3], false],
    [[1, 2, 3], [1, 2, 0], false],
    [[1, 1], [0, 0], false],
    [[1], [1, 2], false],
    [[1, 2], [1], false],
    [[], [0], false],
    [[0], [], false],
    [[0, 0], [0], false],
    [[0], [0, 0], false],
    [[0, 0], [0, 0], true],
  ] as const)('compares %j and %j as %s', (a, b, expected) => {
    expect(timingSafeBufferEqual(Uint8Array.from(a), Uint8Array.from(b))).toBe(expected);
  });

  it('respects subarray boundaries without modifying inputs', () => {
    const a = new Uint8Array([99, 1, 2, 3, 99]);
    const b = new Uint8Array([88, 1, 2, 3, 88]);
    expect(timingSafeBufferEqual(a.subarray(1, 4), b.subarray(1, 4))).toBe(true);
    expect(timingSafeBufferEqual(a.subarray(1, 4), a.subarray(0, 3))).toBe(false);
    expect(timingSafeBufferEqual(a, a)).toBe(true);
    expect(a).toEqual(new Uint8Array([99, 1, 2, 3, 99]));
    expect(b).toEqual(new Uint8Array([88, 1, 2, 3, 88]));
  });

  it('detects a difference at every byte position in a larger buffer', () => {
    const a = Uint8Array.from({ length: 256 }, (_, i) => i);
    for (let i = 0; i < a.length; i++) {
      const b = a.slice();
      b[i] ^= 255;
      expect(timingSafeBufferEqual(a, b)).toBe(false);
    }
    expect(timingSafeBufferEqual(a, a.slice())).toBe(true);
  });

  it.each([[9, 2, 3], [9]])('reads the full first buffer even when comparing against %j', (...bytes) => {
    const visited: number[] = [];
    const a = new Proxy(new Uint8Array([1, 2, 3]), {
      get(target, property) {
        if (typeof property === 'string' && /^\d+$/.test(property)) {
          visited.push(Number(property));
        }
        return Reflect.get(target, property, target);
      },
    });
    expect(timingSafeBufferEqual(a, new Uint8Array(bytes))).toBe(false);
    expect(visited).toEqual([0, 1, 2]);
  });
});

describe('timingSafeSelect', () => {
  it.each([
    ['yes', 'no'],
    ['a', 'longer'],
    ['longer', 'a'],
    ['', ''],
    ['', 'value'],
    ['value', ''],
    ['same', 'same'],
    ['café', 'cafe\u0301'],
    ['你好🔒', '🔓'],
    ['a\0\0', '\0b'],
    ['\uD800', '\uDC00'],
  ])('selects exactly from %j and %j for either condition', (ifTrue, ifFalse) => {
    expect(timingSafeSelect(true, ifTrue, ifFalse)).toBe(ifTrue);
    expect(timingSafeSelect(false, ifTrue, ifFalse)).toBe(ifFalse);
  });

  it('handles long candidates without argument-spread limits', () => {
    const long = '🔒'.repeat(70000);
    expect(timingSafeSelect(true, long, 'short')).toBe(long);
    expect(timingSafeSelect(false, long, 'short')).toBe('short');
  });
});

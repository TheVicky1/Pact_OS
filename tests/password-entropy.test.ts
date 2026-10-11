import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePassphraseEntropy } from '../src/lib/security/password-entropy';

describe('password-entropy utility', () => {
  it('returns 0 bits and weak for empty or non-string inputs', () => {
    assert.deepStrictEqual(calculatePassphraseEntropy(''), { bits: 0, level: 'weak' });
    assert.deepStrictEqual(calculatePassphraseEntropy(null as unknown as string), { bits: 0, level: 'weak' });
  });

  it('computes entropy for lowercase-only short password', () => {
    // Length 4, pool 26: 4 * log2(26) = 4 * 4.7004 = 18.8 -> 19 bits -> weak
    const res = calculatePassphraseEntropy('test');
    assert.strictEqual(res.bits, 19);
    assert.strictEqual(res.level, 'weak');
  });

  it('computes moderate entropy for standard alphanumeric passphrase', () => {
    // 'PactPass12': len 10, pool 26+26+10 = 62. 10 * log2(62) = 10 * 5.954 = 60 -> strong
    const res = calculatePassphraseEntropy('Pact12'); // len 6, pool 62 -> 36 bits -> moderate
    assert.strictEqual(res.bits, 36);
    assert.strictEqual(res.level, 'moderate');
  });

  it('computes strong entropy for complex 10-char password', () => {
    // 'P@ssw0rd12': len 10, pool 26+26+10+32 = 94. 10 * log2(94) = 10 * 6.55 = 66 bits -> strong
    const res = calculatePassphraseEntropy('P@ssw0rd12');
    assert.strictEqual(res.bits >= 60, true);
    assert.strictEqual(res.level, 'strong');
  });

  it('computes very-strong entropy for 16-char mixed passphrase', () => {
    // len 16, pool 94 -> 16 * 6.55 = 105 bits -> very-strong
    const res = calculatePassphraseEntropy('Correct-Horse-Battery-Staple-99!');
    assert.strictEqual(res.bits >= 80, true);
    assert.strictEqual(res.level, 'very-strong');
  });
});

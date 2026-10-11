/**
 * Shannon Passphrase Entropy and Strength Evaluator.
 * Computes theoretical entropy bits based on character pool size and length:
 * E = L * log2(R)
 */

export interface EntropyResult {
  bits: number;
  level: 'weak' | 'moderate' | 'strong' | 'very-strong';
}

export function calculatePassphraseEntropy(passphrase: string): EntropyResult {
  if (!passphrase || typeof passphrase !== 'string') {
    return { bits: 0, level: 'weak' };
  }

  let pool = 0;
  if (/[a-z]/.test(passphrase)) pool += 26;
  if (/[A-Z]/.test(passphrase)) pool += 26;
  if (/[0-9]/.test(passphrase)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(passphrase)) pool += 32;

  if (pool === 0) {
    return { bits: 0, level: 'weak' };
  }

  const bits = Math.round(passphrase.length * Math.log2(pool));

  let level: EntropyResult['level'] = 'weak';
  if (bits >= 80) {
    level = 'very-strong';
  } else if (bits >= 60) {
    level = 'strong';
  } else if (bits >= 36) {
    level = 'moderate';
  }

  return { bits, level };
}

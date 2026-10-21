import { createHash } from 'node:crypto';

export type SriHashAlgorithm = 'sha384' | 'sha512';

/**
 * Generates a Subresource Integrity (SRI) hash for content.
 *
 * @param content - The content to hash, as a string or Buffer.
 * @param algorithm - The hashing algorithm. Defaults to SHA-384.
 * @returns The SRI value in algorithm-Base64 format.
 */
export function generateSriHash(
  content: string | Buffer,
  algorithm: SriHashAlgorithm = 'sha384',
): string {
  if (algorithm !== 'sha384' && algorithm !== 'sha512') {
    throw new TypeError(
      `Unsupported SRI hash algorithm: ${String(algorithm)}`,
    );
  }

  if (typeof content !== 'string' && !Buffer.isBuffer(content)) {
    throw new TypeError('SRI content must be a string or Buffer.');
  }

  const digest = createHash(algorithm).update(content).digest('base64');

  return `${algorithm}-${digest}`;
}
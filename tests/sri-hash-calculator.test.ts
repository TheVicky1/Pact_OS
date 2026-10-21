
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateSriHash } from '../src/lib/security/sri-hash-calculator';

describe('generateSriHash', () => {
  it('generates a SHA-384 hash by default', () => {
    assert.strictEqual(
      generateSriHash('hello'),
      'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP',
    );
  });

  it('generates a SHA-512 hash when requested', () => {
    assert.strictEqual(
      generateSriHash('hello', 'sha512'),
      'sha512-m3HSJL1i83hdltRq0+o9czGb+8KJDKra4t/3JRlnPKcjI8PZm6XBHXx6zG4UuMXaDEZjR1wuXDre9G9zvN7AQw==',
    );
  });

  it('accepts Buffer content', () => {
    assert.strictEqual(
      generateSriHash(Buffer.from('hello')),
      'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP',
    );
  });

  it('handles empty content', () => {
    assert.strictEqual(
      generateSriHash(''),
      'sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb',
    );
  });

  it('handles an empty Buffer', () => {
    assert.strictEqual(
      generateSriHash(Buffer.alloc(0)),
      'sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb',
    );
  });

  it('rejects unsupported algorithms', () => {
    assert.throws(
      () =>
        generateSriHash(
          'hello',
          'sha256' as 'sha384',
        ),
      {
        name: 'TypeError',
        message: 'Unsupported SRI hash algorithm: sha256',
      },
    );
  });

  it('returns the selected algorithm in the SRI prefix', () => {
    assert.ok(generateSriHash('hello').startsWith('sha384-'));
    assert.ok(generateSriHash('hello', 'sha512').startsWith('sha512-'));
  });
});

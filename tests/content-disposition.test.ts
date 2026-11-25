import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSafeContentDispositionHeader } from '../src/lib/security/content-disposition';

describe('Content-Disposition header builder (content-disposition.ts)', () => {
  it('formats a plain filename as an attachment header', () => {
    assert.strictEqual(
      getSafeContentDispositionHeader('report.pdf'),
      'attachment; filename="report.pdf"',
    );
  });

  it('replaces double quotes and backslashes so the quoted string cannot be broken', () => {
    const header = getSafeContentDispositionHeader('evil"; filename="x.exe');
    assert.strictEqual(header, 'attachment; filename="evil_; filename=_x.exe"');
    assert.ok(!header.slice('attachment; filename="'.length, -1).includes('"'));
    assert.strictEqual(
      getSafeContentDispositionHeader('a\\b"c.txt'),
      'attachment; filename="b_c.txt"',
    );
  });

  it('strips CR/LF and other control characters to prevent header injection', () => {
    const header = getSafeContentDispositionHeader('file\r\nSet-Cookie: a=b\x00\x7f.txt');
    assert.ok(!/[\r\n\x00-\x1f\x7f]/.test(header));
    assert.strictEqual(header, 'attachment; filename="file__Set-Cookie: a=b__.txt"');
  });

  it('removes directory components to prevent traversal', () => {
    assert.strictEqual(
      getSafeContentDispositionHeader('../../etc/passwd'),
      'attachment; filename="passwd"',
    );
    assert.strictEqual(
      getSafeContentDispositionHeader('C:\\Windows\\system.ini'),
      'attachment; filename="system.ini"',
    );
  });

  it('falls back to "download" for empty or dot-only names', () => {
    assert.strictEqual(getSafeContentDispositionHeader(''), 'attachment; filename="download"');
    assert.strictEqual(getSafeContentDispositionHeader('..'), 'attachment; filename="download"');
    assert.strictEqual(getSafeContentDispositionHeader('dir/'), 'attachment; filename="download"');
  });

  it('replaces non-ASCII characters with underscores', () => {
    assert.strictEqual(
      getSafeContentDispositionHeader('résumé€.pdf'),
      'attachment; filename="r_sum__.pdf"',
    );
  });

  it('caps the filename length', () => {
    const header = getSafeContentDispositionHeader('a'.repeat(500));
    assert.strictEqual(header, `attachment; filename="${'a'.repeat(200)}"`);
  });
});

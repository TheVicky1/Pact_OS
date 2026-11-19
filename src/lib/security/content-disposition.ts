/**
 * Content-Disposition Header Builder for downloadable file attachments.
 *
 * Produces a safe `Content-Disposition: attachment; filename="..."` value from an
 * untrusted filename. Directory components are dropped, characters that could break
 * the quoted-string or inject headers (quotes, backslashes, control characters, and
 * non-ASCII) are replaced, and an empty or dot-only result falls back to "download".
 *
 * @module src/lib/security/content-disposition
 */

const FALLBACK_FILENAME = 'download';
const MAX_FILENAME_LENGTH = 200;

/**
 * Builds a safe `Content-Disposition` header value for an attachment.
 *
 * @param filename Untrusted filename (may contain paths, quotes, or control characters)
 * @returns Header value such as `attachment; filename="report.pdf"`
 */
export function getSafeContentDispositionHeader(filename: string): string {
  const baseName = String(filename ?? '')
    .split(/[\\/]/)
    .pop() ?? '';

  const sanitized = baseName
    // Only printable ASCII (0x20-0x7E) survives; this drops control characters
    // (including CR/LF) and non-ASCII, and the replacement covers quotes and backslashes.
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
    .trim()
    .slice(0, MAX_FILENAME_LENGTH)
    .trim();

  const safeName = sanitized === '' || sanitized === '.' || sanitized === '..'
    ? FALLBACK_FILENAME
    : sanitized;

  return `attachment; filename="${safeName}"`;
}

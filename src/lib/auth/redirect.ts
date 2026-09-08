/**
 * Validates a redirect target path to prevent Open Redirect vulnerabilities.
 * Only internal, relative paths starting with approved prefixes (/app, /profile) are allowed.
 * Rejects absolute URLs (http://, https://), protocol-relative URLs (//evil.com),
 * backslashes (\\evil.com), and non-standard schemes (javascript:).
 *
 * @param path The requested redirect path (e.g. from query param `next`)
 * @param fallback Default safe relative path (defaults to '/app')
 * @returns Sanitized safe relative redirect path
 */
export function validateSafeRedirect(path: string | null | undefined, fallback: string = '/app'): string {
  if (!path) {
    return fallback;
  }

  const trimmed = path.trim();

  // Must start with '/' but NOT '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Prevent control characters or whitespace manipulation
  if (/[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  // Prevent scheme indicators (e.g. /app?url=http://evil.com is okay, but /http:evil is not)
  // Check if string contains colons before the query string
  const pathBeforeQuery = trimmed.split('?')[0] || '';
  if (pathBeforeQuery.includes(':')) {
    return fallback;
  }

  // Only allow paths starting with allowed application roots
  const allowedPrefixes = ['/app', '/profile'];
  const isAllowed = allowedPrefixes.some(
    (prefix) => pathBeforeQuery === prefix || pathBeforeQuery.startsWith(prefix + '/')
  );

  if (!isAllowed) {
    return fallback;
  }

  return trimmed;
}

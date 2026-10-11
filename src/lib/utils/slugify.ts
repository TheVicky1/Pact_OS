/**
 * URL-Safe Diacritics-Stripping Slug Generator.
 * Normalizes input text by decomposing accented characters, stripping non-alphanumeric punctuation,
 * collapsing whitespace/underscores into single hyphens, and enforcing optional length bounds.
 */

export interface SlugifyOptions {
  maxLength?: number;
  fallback?: string;
}

export function slugify(input: string, options: SlugifyOptions = {}): string {
  const { maxLength = 80, fallback = 'untitled' } = options;
  if (!input || typeof input !== 'string') return fallback;

  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const truncated = maxLength && normalized.length > maxLength
    ? normalized.slice(0, maxLength).replace(/-+$/, '')
    : normalized;

  return truncated || fallback;
}

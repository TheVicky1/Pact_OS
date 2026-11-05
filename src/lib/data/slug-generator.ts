export interface SlugOptions {
  /** Maximum character length of the generated slug (default: 80) */
  maxLength?: number;
  /** Custom replacement delimiter (default: '-') */
  delimiter?: string;
}

export function generateSlug(title: string, options?: SlugOptions): string {
  if (typeof title !== 'string') {
    throw new TypeError('Title must be a string');
  }

  const delimiter = options?.delimiter ?? '-';
  const maxLength = options?.maxLength ?? 80;

  // 1. Lowercase and trim
  const cleanInput = title.toLowerCase().trim();

  // 2. Normalize and strip diacritics
  const normalized = cleanInput
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  // 3. Replace spaces, underscores, and delimiter-like characters with delimiter
  // Keep only alphanumeric characters and delimiter
  let slug = '';
  for (const char of normalized) {
    if (/[a-z0-9]/.test(char)) {
      slug += char;
    } else if (/\s|_|-/.test(char)) {
      slug += delimiter;
    }
  }

  // 4. Collapse consecutive delimiters
  const escapedDelim = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const collapseRegex = new RegExp(`${escapedDelim}+`, 'g');
  slug = slug.replace(collapseRegex, delimiter);

  // 5. Strip leading and trailing delimiters
  const trimRegex = new RegExp(`^${escapedDelim}+|${escapedDelim}+$`, 'g');
  slug = slug.replace(trimRegex, '');

  // 6. Max length enforcement without trailing delimiter
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    slug = slug.replace(new RegExp(`${escapedDelim}+$`, 'g'), '');
  }

  return slug;
}

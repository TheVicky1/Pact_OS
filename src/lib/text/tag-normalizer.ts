export interface TagNormalizerOptions {
  /** Maximum length per individual tag (default: 30) */
  maxTagLength?: number;
  /** Maximum total number of tags allowed (default: 10) */
  maxTagsCount?: number;
}

export function normalizeTags(
  rawTags: readonly string[],
  options?: TagNormalizerOptions
): string[] {
  if (!Array.isArray(rawTags)) {
    throw new TypeError('rawTags must be an array');
  }

  for (const tag of rawTags) {
    if (typeof tag !== 'string') {
      throw new TypeError('All elements of rawTags must be strings');
    }
  }

  const maxTagLength = options?.maxTagLength ?? 30;
  const maxTagsCount = options?.maxTagsCount ?? 10;

  const normalizedList: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawTags) {
    // 1. Strip leading # symbols and trim whitespace
    let tag = raw.trim().replace(/^#+/, '').trim();

    // 2. Convert all characters to lowercase
    tag = tag.toLowerCase();

    // 3. Replace spaces with hyphens (-) and remove all characters except lowercase letters, numbers, and hyphens
    tag = tag.replace(/\s+/g, '-');
    tag = tag.replace(/[^a-z0-9-]/g, '');

    // 4. Collapse consecutive hyphens into a single hyphen
    tag = tag.replace(/-+/g, '-');

    // 5. Strip leading and trailing hyphens
    tag = tag.replace(/^-+|-+$/g, '');

    // 6. Filter out any resulting empty strings
    if (!tag) {
      continue;
    }

    // 7. If maxTagLength is set, truncate each tag to that length (stripping any trailing hyphens)
    if (typeof maxTagLength === 'number' && maxTagLength > 0 && tag.length > maxTagLength) {
      tag = tag.slice(0, maxTagLength);
      tag = tag.replace(/-+$/, '');
      if (!tag) {
        continue;
      }
    }

    // 8. Deduplicate while preserving first-seen insertion order
    if (!seen.has(tag)) {
      seen.add(tag);
      normalizedList.push(tag);
    }

    // 9. If maxTagsCount is exceeded, slice to the maximum allowed count
    if (typeof maxTagsCount === 'number' && maxTagsCount > 0 && normalizedList.length >= maxTagsCount) {
      break;
    }
  }

  return normalizedList;
}

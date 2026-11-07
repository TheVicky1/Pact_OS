export interface SmartTruncateOptions {
  /** Ellipsis indicator to append (default: '…') */
  ellipsis?: string;
  /** Whether to truncate cleanly at word whitespace boundaries (default: true) */
  preserveWordBoundary?: boolean;
}

export function smartTruncate(
  text: string,
  maxLength: number,
  options?: SmartTruncateOptions,
): string {
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }

  if (!Number.isInteger(maxLength) || maxLength < 0) {
    throw new TypeError('maxLength must be a non-negative integer');
  }

  if (text.length <= maxLength) {
    return text;
  }

  const ellipsis = options?.ellipsis ?? '…';
  if (maxLength <= ellipsis.length) {
    return text.slice(0, maxLength);
  }

  const budget = maxLength - ellipsis.length;

  if (options?.preserveWordBoundary === false) {
    return `${text.slice(0, budget).trimEnd()}${ellipsis}`;
  }

  const candidate = text.slice(0, budget + 1);
  let whitespaceIndex = -1;
  for (let index = Math.min(budget, candidate.length - 1); index >= 0; index -= 1) {
    if (/\s/.test(candidate[index])) {
      whitespaceIndex = index;
      break;
    }
  }

  if (whitespaceIndex !== -1) {
    const truncated = candidate
      .slice(0, whitespaceIndex)
      .trimEnd()
      .replace(/[,;:.!?]+$/, '');
    return `${truncated}${ellipsis}`;
  }

  return `${text.slice(0, budget)}${ellipsis}`;
}

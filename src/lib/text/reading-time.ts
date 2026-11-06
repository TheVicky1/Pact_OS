/**
 * Reading Time & Text Metrics Estimator
 *
 * Provides reading time estimates and text metrics for long-form markdown text,
 * daily debriefs, weekly reviews, and accountability pacts.
 *
 * @module lib/text/reading-time
 */

export interface ReadingTimeResult {
  /** Total extracted words count */
  wordsCount: number;
  /** Total characters count (excluding excessive whitespace) */
  charactersCount: number;
  /** Estimated reading time in full minutes (ceiling, minimum 1 min if words > 0) */
  minutes: number;
  /** Estimated reading time in seconds rounded to nearest integer */
  seconds: number;
  /** Human-readable formatted badge text (e.g. "< 1 min read", "3 min read") */
  formattedLabel: string;
}

/**
 * Estimates reading time and extracts text metrics from content.
 *
 * @param content - The text or markdown content to analyze.
 * @param wordsPerMinute - Average reading speed in words per minute (default: 200).
 * @returns ReadingTimeResult containing word count, character count, time estimates, and formatted badge text.
 * @throws {TypeError} If content is not a string, or wordsPerMinute is not a positive number (> 0).
 */
export function estimateReadingTime(
  content: string,
  wordsPerMinute: number = 200
): ReadingTimeResult {
  if (typeof content !== 'string') {
    throw new TypeError('Content must be a string');
  }

  if (
    typeof wordsPerMinute !== 'number' ||
    Number.isNaN(wordsPerMinute) ||
    wordsPerMinute <= 0
  ) {
    throw new TypeError('Words per minute must be a positive number');
  }

  const normalized = content.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return {
      wordsCount: 0,
      charactersCount: 0,
      minutes: 0,
      seconds: 0,
      formattedLabel: '0 min read',
    };
  }

  const words = content.match(/\S+/g) ?? [];
  const wordsCount = words.length;

  if (wordsCount === 0) {
    return {
      wordsCount: 0,
      charactersCount: 0,
      minutes: 0,
      seconds: 0,
      formattedLabel: '0 min read',
    };
  }

  const charactersCount = normalized.length;
  const seconds = Math.round((wordsCount / wordsPerMinute) * 60);
  const minutes = Math.max(1, Math.ceil(wordsCount / wordsPerMinute));

  let formattedLabel: string;
  if (wordsCount === 0) {
    formattedLabel = '0 min read';
  } else if (seconds < 60) {
    formattedLabel = '< 1 min read';
  } else if (minutes === 1) {
    formattedLabel = '1 min read';
  } else {
    formattedLabel = `${minutes} min read`;
  }

  return {
    wordsCount,
    charactersCount,
    minutes,
    seconds,
    formattedLabel,
  };
}


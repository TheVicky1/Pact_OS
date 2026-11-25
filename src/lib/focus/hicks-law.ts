/**
 * Hick-Hyman decision latency and choice-overload heuristics.
 *
 * The result is intended for interface ergonomics and prioritization. It is
 * not a measurement of an individual user's cognitive performance.
 */

export type ClutterSeverity = 'minimal' | 'moderate' | 'high' | 'paralyzing';

export interface HickDecisionOptions {
  processingConstantMs?: number;
  baseReactionTimeMs?: number;
  familiarityFactor?: number;
}

export interface HickDecisionResult {
  optionCount: number;
  entropyBits: number;
  estimatedDecisionTimeMs: number;
  clutterScore: number;
  severity: ClutterSeverity;
  recommendedMaxOptions: number;
  recommendation: string;
}

const DEFAULT_PROCESSING_CONSTANT_MS = 150;
const DEFAULT_BASE_REACTION_TIME_MS = 200;
const DEFAULT_FAMILIARITY_FACTOR = 1;
const MIN_FAMILIARITY_FACTOR = 0.5;
const MAX_FAMILIARITY_FACTOR = 1.5;
const CLUTTER_NORMALIZATION_BITS = Math.log2(30);

function nonNegativeOrDefault(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function normalizeOptionCount(optionCount: number): number {
  if (!Number.isFinite(optionCount)) {
    return optionCount === Infinity ? Number.MAX_SAFE_INTEGER : 0;
  }

  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(optionCount)));
}

function getSeverity(optionCount: number): ClutterSeverity {
  if (optionCount <= 4) return 'minimal';
  if (optionCount <= 9) return 'moderate';
  if (optionCount <= 19) return 'high';
  return 'paralyzing';
}

function getGuidance(severity: ClutterSeverity): {
  recommendedMaxOptions: number;
  recommendation: string;
} {
  switch (severity) {
    case 'minimal':
      return {
        recommendedMaxOptions: 4,
        recommendation: 'Choice set is concise. Keep the current prioritization visible.',
      };
    case 'moderate':
      return {
        recommendedMaxOptions: 7,
        recommendation: 'Group related options into categories and highlight the primary action.',
      };
    case 'high':
      return {
        recommendedMaxOptions: 5,
        recommendation: 'Reduce the initial choice set to the top 3–5 items and filter the rest.',
      };
    case 'paralyzing':
      return {
        recommendedMaxOptions: 3,
        recommendation: 'Use progressive disclosure immediately and show only the top 3 actions.',
      };
  }
}

/** Calculate expected decision latency and normalized interface clutter. */
export function calculateHickDecisionTime(
  optionCount: number,
  options: HickDecisionOptions = {},
): HickDecisionResult {
  const safeOptionCount = normalizeOptionCount(optionCount);
  const processingConstantMs = nonNegativeOrDefault(
    options.processingConstantMs,
    DEFAULT_PROCESSING_CONSTANT_MS,
  );
  const baseReactionTimeMs = nonNegativeOrDefault(
    options.baseReactionTimeMs,
    DEFAULT_BASE_REACTION_TIME_MS,
  );
  const rawFamiliarityFactor = nonNegativeOrDefault(
    options.familiarityFactor,
    DEFAULT_FAMILIARITY_FACTOR,
  );
  const familiarityFactor = Math.min(
    MAX_FAMILIARITY_FACTOR,
    Math.max(MIN_FAMILIARITY_FACTOR, rawFamiliarityFactor),
  );

  const rawEntropyBits = Math.log2(safeOptionCount + 1);
  const entropyBits = Math.round(rawEntropyBits * 1_000) / 1_000;
  const estimatedDecisionTimeMs = Math.round(
    baseReactionTimeMs + processingConstantMs * rawEntropyBits * familiarityFactor,
  );
  const clutterScore = Math.max(
    0,
    Math.min(100, Math.round((rawEntropyBits / CLUTTER_NORMALIZATION_BITS) * 100)),
  );
  const severity = getSeverity(safeOptionCount);
  const guidance = getGuidance(severity);

  return {
    optionCount: safeOptionCount,
    entropyBits,
    estimatedDecisionTimeMs,
    clutterScore,
    severity,
    ...guidance,
  };
}

/** Evaluate the total number of currently rendered menu choices. */
export function evaluateMenuClutter(
  items: Array<{ id: string; isHighlighted?: boolean; category?: string }>,
): HickDecisionResult {
  return calculateHickDecisionTime(items.length);
}

export type BadgeTierName = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeProgressReport {
  currentCount: number;
  currentTier: BadgeTierName;
  nextTier: BadgeTierName | null;
  /** Target count required for next tier, or null if maximum tier unlocked */
  nextTierThreshold: number | null;
  /** Remaining count to unlock the next tier (0 if maxed out) */
  remainingCount: number;
  /** Percentage (0 to 100, rounded to 1 decimal place) completed toward next tier */
  progressPercentage: number;
}

export const DEFAULT_BADGE_THRESHOLDS: Record<BadgeTierName, number> = {
  none: 0,
  bronze: 5,
  silver: 25,
  gold: 50,
  diamond: 100,
};

/** Tiers ordered from lowest to highest. */
const TIER_ORDER: BadgeTierName[] = ['none', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Calculates which badge tier the current count falls into, along with
 * progress toward unlocking the next tier.
 *
 * @param currentCount - Number of completed habit check-ins.
 * @param customThresholds - Optional overrides for tier unlock thresholds.
 */
export function calculateBadgeProgress(
  currentCount: number,
  customThresholds?: Partial<Record<BadgeTierName, number>>,
): BadgeProgressReport {
  if (typeof currentCount !== 'number' || !Number.isFinite(currentCount)) {
    throw new TypeError('currentCount must be a finite number.');
  }
  if (currentCount < 0) {
    throw new RangeError('currentCount must be a non-negative number.');
  }

  const thresholds: Record<BadgeTierName, number> = {
    ...DEFAULT_BADGE_THRESHOLDS,
    ...customThresholds,
  };

  // Validate every merged threshold before scanning tiers.
  for (const tier of TIER_ORDER) {
    const threshold = thresholds[tier];
    if (typeof threshold !== 'number' || !Number.isFinite(threshold)) {
      throw new TypeError(`Threshold for ${tier} must be a finite number.`);
    }
    if (threshold < 0) {
      throw new RangeError(`Threshold for ${tier} must be a non-negative number.`);
    }
  }

  // Find the highest tier whose threshold has already been reached.
  let currentIndex = 0;
  for (let i = TIER_ORDER.length - 1; i >= 0; i -= 1) {
    if (currentCount >= thresholds[TIER_ORDER[i]]) {
      currentIndex = i;
      break;
    }
  }
  const currentTier = TIER_ORDER[currentIndex];

  // Already at the maximum tier (diamond).
  if (currentIndex === TIER_ORDER.length - 1) {
    return {
      currentCount,
      currentTier,
      nextTier: null,
      nextTierThreshold: null,
      remainingCount: 0,
      progressPercentage: 100,
    };
  }

  const nextTier = TIER_ORDER[currentIndex + 1];
  const nextTierThreshold = thresholds[nextTier];
  const currentTierThreshold = thresholds[currentTier];
  const remainingCount = nextTierThreshold - currentCount;
  const span = nextTierThreshold - currentTierThreshold;
  const progressPercentage = span > 0
    ? Math.max(0, Math.min(100, Math.round(((currentCount - currentTierThreshold) / span) * 1000) / 10))
    : 100;

  return {
    currentCount,
    currentTier,
    nextTier,
    nextTierThreshold,
    remainingCount,
    progressPercentage,
  };
}

export interface XpCurveOptions {
  /** Base XP required to advance from level 1 to level 2. */
  baseXp?: number;
  /** Exponential scaling factor for level requirements. */
  exponent?: number;
}

export interface LevelProgressionResult {
  /** Current level, starting at 1. */
  level: number;
  /** Total cumulative XP earned. */
  totalXp: number;
  /** XP accumulated within the current level. */
  currentLevelXp: number;
  /** XP required to advance to the next level. */
  requiredLevelXp: number;
  /** Progress through the current level, from 0 to 100. */
  progressPercentage: number;
  /** XP remaining until the next level. */
  xpUntilNextLevel: number;
}

/**
 * Calculates level progression using an exponential XP curve.
 *
 * XP required to advance from level L to L + 1:
 * floor(baseXp * L ** exponent)
 */
export function calculateLevelProgression(
  totalXp: number,
  options: XpCurveOptions = {},
): LevelProgressionResult {
  const baseXp = options.baseXp ?? 100;
  const exponent = options.exponent ?? 1.5;

  if (
    !Number.isFinite(totalXp) ||
    totalXp < 0 ||
    !Number.isFinite(baseXp) ||
    baseXp <= 0 ||
    !Number.isFinite(exponent) ||
    exponent <= 1
  ) {
    throw new RangeError(
      'XP must be non-negative, baseXp must be positive, and exponent must be greater than 1.',
    );
  }

  const getRequiredXp = (level: number): number =>
    Math.floor(baseXp * level ** exponent);

  let level = 1;
  let currentLevelXp = totalXp;
  let requiredLevelXp = getRequiredXp(level);

  if (requiredLevelXp < 1) {
    throw new RangeError(
      'The XP curve must require at least 1 XP per level.',
    );
  }

  while (currentLevelXp >= requiredLevelXp) {
    currentLevelXp -= requiredLevelXp;
    level += 1;
    requiredLevelXp = getRequiredXp(level);
  }

  if (!Number.isFinite(requiredLevelXp) || requiredLevelXp <= 0) {
    throw new RangeError('The XP curve produced an invalid level requirement.');
  }

  const progressPercentage = Math.max(
    0,
    Math.min(
      100,
      Math.round((currentLevelXp / requiredLevelXp) * 1000) / 10,
    ),
  );

  return {
    level,
    totalXp,
    currentLevelXp,
    requiredLevelXp,
    progressPercentage,
    xpUntilNextLevel: requiredLevelXp - currentLevelXp,
  };
}
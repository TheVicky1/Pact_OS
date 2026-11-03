export const CHARACTER_ATTRIBUTES = [
  'strength',
  'intellect',
  'vitality',
  'discipline',
  'focus',
  'social',
] as const;

export type CharacterAttribute = (typeof CHARACTER_ATTRIBUTES)[number];

export interface AttributeState {
  attribute: CharacterAttribute;
  currentXp: number;
  level: number;
  xpForNextLevel: number;
  levelProgressFraction: number; // 0.0 to 1.0
}

export interface CharacterSheet {
  overallCharacterLevel: number;
  totalXp: number;
  attributes: Record<CharacterAttribute, AttributeState>;
  dominantAttribute: CharacterAttribute;
  lowestAttribute: CharacterAttribute;
  imbalanceScore: number; // 0 (perfect balance) to 100 (extreme skew)
  archetypeTitle: string; // e.g. "The Scholar", "The Ascetic", "The Balanced Master"
}

export interface AttributeLevelResult {
  level: number;
  currentLevelFloorXp: number;
  nextLevelXp: number;
}

/**
 * Calculates attribute level and boundary thresholds using diminishing returns:
 * Level = floor(0.1 * sqrt(XP)) + 1
 *
 * Negative and non-finite XP values are safely clamped to 0.
 */
export function calculateAttributeLevel(xp: number): AttributeLevelResult {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const level = Math.floor(0.1 * Math.sqrt(safeXp)) + 1;
  const currentLevelFloorXp = 100 * (level - 1) ** 2;
  const nextLevelXp = 100 * level ** 2;

  return {
    level,
    currentLevelFloorXp,
    nextLevelXp,
  };
}

/**
 * Maps a single dominant attribute to its archetype title.
 */
function getDominantArchetype(attribute: CharacterAttribute): string {
  switch (attribute) {
    case 'intellect':
      return 'The Scholar';
    case 'vitality':
      return 'The Ascetic';
    case 'strength':
      return 'The Titan';
    case 'discipline':
      return 'The Stoic';
    case 'focus':
      return 'The Specialist';
    case 'social':
      return 'The Diplomat';
  }
}

/**
 * Evaluates the character archetype title based on balance and dominant traits.
 */
function determineArchetypeTitle(
  levels: Record<CharacterAttribute, number>,
  dominant: CharacterAttribute,
): string {
  const levelValues = CHARACTER_ATTRIBUTES.map((attr) => levels[attr]);
  const minLevel = Math.min(...levelValues);
  const maxLevel = Math.max(...levelValues);
  const mean = levelValues.reduce((sum, v) => sum + v, 0) / levelValues.length;

  // Balanced when the level spread is within 10% of the mean
  const isWithinTenPercent = maxLevel === minLevel || (maxLevel - minLevel) / mean <= 0.1;
  if (isWithinTenPercent) {
    return 'The Balanced Master';
  }

  // Check if dominant attribute is >= 3x higher than all other attributes
  const otherAttributes = CHARACTER_ATTRIBUTES.filter((attr) => attr !== dominant);
  const isThreeTimesHigherThanAll = otherAttributes.every(
    (attr) => levels[dominant] >= 3 * levels[attr],
  );

  if (isThreeTimesHigherThanAll) {
    return getDominantArchetype(dominant);
  }

  // If dominant is significantly higher (> 1.5x the mean of others)
  const othersMean =
    otherAttributes.reduce((sum, attr) => sum + levels[attr], 0) / otherAttributes.length;
  if (levels[dominant] >= 1.5 * othersMean) {
    return getDominantArchetype(dominant);
  }

  return 'The Polymath';
}

/**
 * Generates an authoritative Six-Attribute Character Progression Sheet from XP allocations.
 */
export function generateCharacterSheet(
  xpAllocations: Partial<Record<CharacterAttribute, number>>,
): CharacterSheet {
  const attributes = {} as Record<CharacterAttribute, AttributeState>;
  const levels = {} as Record<CharacterAttribute, number>;
  let totalXp = 0;

  for (const attribute of CHARACTER_ATTRIBUTES) {
    const rawXp = xpAllocations?.[attribute] ?? 0;
    const currentXp = Number.isFinite(rawXp) && rawXp > 0 ? rawXp : 0;
    totalXp += currentXp;

    const { level, currentLevelFloorXp, nextLevelXp } = calculateAttributeLevel(currentXp);
    levels[attribute] = level;

    const span = nextLevelXp - currentLevelFloorXp;
    const progress = span > 0 ? (currentXp - currentLevelFloorXp) / span : 0;
    const levelProgressFraction = Math.max(0, Math.min(1, Math.round(progress * 10000) / 10000));
    const xpForNextLevel = Math.max(0, nextLevelXp - currentXp);

    attributes[attribute] = {
      attribute,
      currentXp,
      level,
      xpForNextLevel,
      levelProgressFraction,
    };
  }

  // Determine dominant and lowest attributes
  let dominantAttribute: CharacterAttribute = CHARACTER_ATTRIBUTES[0];
  let lowestAttribute: CharacterAttribute = CHARACTER_ATTRIBUTES[0];

  for (const attribute of CHARACTER_ATTRIBUTES) {
    const state = attributes[attribute];
    const dominantState = attributes[dominantAttribute];
    const lowestState = attributes[lowestAttribute];

    if (
      state.level > dominantState.level ||
      (state.level === dominantState.level && state.currentXp > dominantState.currentXp)
    ) {
      dominantAttribute = attribute;
    }

    if (
      state.level < lowestState.level ||
      (state.level === lowestState.level && state.currentXp < lowestState.currentXp)
    ) {
      lowestAttribute = attribute;
    }
  }

  // Calculate imbalance score: CV normalized by theoretical max (sqrt(5))
  const levelValues = CHARACTER_ATTRIBUTES.map((attr) => levels[attr]);
  const mean = levelValues.reduce((sum, v) => sum + v, 0) / levelValues.length;
  const variance =
    levelValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / levelValues.length;
  const stdDev = Math.sqrt(variance);

  let imbalanceScore = 0;
  if (mean > 0 && stdDev > 0) {
    const cv = stdDev / mean;
    const maxCv = Math.sqrt(CHARACTER_ATTRIBUTES.length - 1); // sqrt(5)
    imbalanceScore = Math.min(100, Math.max(0, Math.round((cv / maxCv) * 10000) / 100));
  }

  const archetypeTitle = determineArchetypeTitle(levels, dominantAttribute);
  const overallCharacterLevel = calculateAttributeLevel(totalXp).level;

  return {
    overallCharacterLevel,
    totalXp,
    attributes,
    dominantAttribute,
    lowestAttribute,
    imbalanceScore,
    archetypeTitle,
  };
}


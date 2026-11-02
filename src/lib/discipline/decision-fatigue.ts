/**
 * PACT Accountability OS — Decision Fatigue Index & Daily Choice Budget Allocator
 *
 * Models ego-depletion and cognitive decision fatigue across daily choices.
 * Assigns calibrated cognitive friction points by decision complexity:
 *  - trivial: 1 pt (clothing choice, simple yes/no)
 *  - routine: 3 pts (meal choice, standard email response)
 *  - moderate: 7 pts (scheduling tradeoff, prioritization)
 *  - complex: 15 pts (system architecture, difficult interpersonal conversation)
 *  - high_stakes_tradeoff: 25 pts (financial investment, contract signature, life pivot)
 *
 * Categorizes remaining willpower capacity into 4 operational zones:
 *  - optimal (>= 70% remaining): tackle high-stakes pacts
 *  - moderate_load (40% - 69% remaining): proceed with routine and moderate tasks
 *  - elevated_fatigue (15% - 39% remaining): defer critical decisions
 *  - vulnerability_danger_zone (< 15% remaining): high risk of willpower relapse
 *
 * @module src/lib/discipline/decision-fatigue
 */

export type DecisionComplexity =
  | 'trivial'
  | 'routine'
  | 'moderate'
  | 'complex'
  | 'high_stakes_tradeoff';

export type DecisionFatigueZone =
  | 'optimal'
  | 'moderate_load'
  | 'elevated_fatigue'
  | 'vulnerability_danger_zone';

export type DecisionRecommendationAction =
  | 'tackle_hard_pact'
  | 'batch_routine_tasks'
  | 'defer_critical_decisions';

export interface DecisionRecord {
  id?: string;
  description: string;
  complexity: DecisionComplexity;
  timestamp?: string;
  context?: string;
}

export interface DecisionBudgetConfig {
  /** Maximum daily decision points available before total cognitive depletion. Default: 100 */
  dailyBudgetPoints: number;
  /** Custom weight overrides for complexity levels */
  complexityWeights?: Record<DecisionComplexity, number>;
}

export interface DecisionBudgetAssessment {
  totalDecisionsCount: number;
  consumedPoints: number;
  dailyBudgetPoints: number;
  budgetRemainingPoints: number;
  budgetRemainingPercentage: number;
  fatigueZone: DecisionFatigueZone;
  canTakeHighStakesTask: boolean;
  recommendedAction: DecisionRecommendationAction;
  breakdownByComplexity: Record<DecisionComplexity, number>;
  resolvedComplexityWeights: Record<DecisionComplexity, number>;
}

export interface NextDecisionCapacityResult {
  canProceed: boolean;
  projectedConsumedPoints: number;
  projectedRemainingPercentage: number;
  projectedZone: DecisionFatigueZone;
  warning?: string;
}

export const DEFAULT_COMPLEXITY_WEIGHTS: Record<DecisionComplexity, number> = {
  trivial: 1,
  routine: 3,
  moderate: 7,
  complex: 15,
  high_stakes_tradeoff: 25,
};

export const DEFAULT_DECISION_BUDGET_CONFIG: DecisionBudgetConfig = {
  dailyBudgetPoints: 100,
  complexityWeights: DEFAULT_COMPLEXITY_WEIGHTS,
};

const VALID_COMPLEXITIES: Set<string> = new Set([
  'trivial',
  'routine',
  'moderate',
  'complex',
  'high_stakes_tradeoff',
]);

/**
 * Resolves decision budget configuration options with strict bounds checking.
 */
export function resolveDecisionBudgetConfig(
  config?: Partial<DecisionBudgetConfig>
): DecisionBudgetConfig {
  const dailyBudget =
    config && 'dailyBudgetPoints' in config && config.dailyBudgetPoints !== undefined
      ? config.dailyBudgetPoints
      : DEFAULT_DECISION_BUDGET_CONFIG.dailyBudgetPoints;

  if (typeof dailyBudget !== 'number' || Number.isNaN(dailyBudget)) {
    throw new TypeError('dailyBudgetPoints must be a valid number');
  }

  if (!Number.isSafeInteger(dailyBudget) || dailyBudget <= 0) {
    throw new RangeError(
      `dailyBudgetPoints must be a positive safe integer (> 0), received ${dailyBudget}`
    );
  }

  const weights: Record<DecisionComplexity, number> = {
    ...DEFAULT_COMPLEXITY_WEIGHTS,
    ...(config?.complexityWeights || {}),
  };

  for (const [comp, weight] of Object.entries(weights)) {
    if (typeof weight !== 'number' || Number.isNaN(weight) || !Number.isFinite(weight)) {
      throw new TypeError(`Weight for complexity '${comp}' must be a finite number`);
    }
    if (weight < 0) {
      throw new RangeError(`Weight for complexity '${comp}' cannot be negative, received ${weight}`);
    }
  }

  return {
    dailyBudgetPoints: dailyBudget,
    complexityWeights: weights,
  };
}

/**
 * Maps remaining budget percentage [0, 100] to operational fatigue zone.
 */
export function determineFatigueZone(remainingPercentage: number): {
  zone: DecisionFatigueZone;
  canTakeHighStakesTask: boolean;
  recommendedAction: DecisionRecommendationAction;
} {
  if (remainingPercentage >= 70) {
    return {
      zone: 'optimal',
      canTakeHighStakesTask: true,
      recommendedAction: 'tackle_hard_pact',
    };
  }
  if (remainingPercentage >= 40) {
    return {
      zone: 'moderate_load',
      canTakeHighStakesTask: true,
      recommendedAction: 'batch_routine_tasks',
    };
  }
  if (remainingPercentage >= 15) {
    return {
      zone: 'elevated_fatigue',
      canTakeHighStakesTask: false,
      recommendedAction: 'defer_critical_decisions',
    };
  }
  return {
    zone: 'vulnerability_danger_zone',
    canTakeHighStakesTask: false,
    recommendedAction: 'defer_critical_decisions',
  };
}

/**
 * Calculates current cognitive decision fatigue metrics from recorded choices.
 */
export function calculateDecisionFatigue(
  decisions: DecisionRecord[],
  config?: Partial<DecisionBudgetConfig>
): DecisionBudgetAssessment {
  if (!Array.isArray(decisions)) {
    throw new TypeError('decisions must be an array of DecisionRecord objects');
  }

  const resolvedConfig = resolveDecisionBudgetConfig(config);
  const weights = resolvedConfig.complexityWeights || DEFAULT_COMPLEXITY_WEIGHTS;

  const breakdown: Record<DecisionComplexity, number> = {
    trivial: 0,
    routine: 0,
    moderate: 0,
    complex: 0,
    high_stakes_tradeoff: 0,
  };

  let consumedPoints = 0;

  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    if (!d || typeof d !== 'object') {
      throw new TypeError(`Decision at index ${i} must be a valid object`);
    }

    if (typeof d.description !== 'string' || !d.description.trim()) {
      throw new TypeError(`Decision at index ${i} must have a non-empty string description`);
    }

    if (!VALID_COMPLEXITIES.has(d.complexity)) {
      throw new RangeError(
        `Invalid complexity '${d.complexity}' at index ${i}. Must be one of: ${Array.from(VALID_COMPLEXITIES).join(', ')}`
      );
    }

    breakdown[d.complexity] += 1;
    consumedPoints += weights[d.complexity];
  }

  const totalDecisionsCount = decisions.length;
  const dailyBudgetPoints = resolvedConfig.dailyBudgetPoints;
  const budgetRemainingPoints = Math.max(0, dailyBudgetPoints - consumedPoints);

  const rawRemainingPercentage =
    ((dailyBudgetPoints - consumedPoints) / dailyBudgetPoints) * 100;
  const budgetRemainingPercentage = Math.max(0, Math.min(100, Math.round(rawRemainingPercentage)));

  const { zone, canTakeHighStakesTask, recommendedAction } = determineFatigueZone(
    rawRemainingPercentage
  );

  return {
    totalDecisionsCount,
    consumedPoints,
    dailyBudgetPoints,
    budgetRemainingPoints,
    budgetRemainingPercentage,
    fatigueZone: zone,
    canTakeHighStakesTask,
    recommendedAction,
    breakdownByComplexity: breakdown,
    resolvedComplexityWeights: weights,
  };
}

/**
 * Predicts whether the user has cognitive headroom for a candidate decision complexity.
 */
export function assessNextDecisionCapacity(
  currentAssessment: DecisionBudgetAssessment,
  nextComplexity: DecisionComplexity
): NextDecisionCapacityResult {
  if (!currentAssessment || typeof currentAssessment !== 'object') {
    throw new TypeError('currentAssessment must be a valid DecisionBudgetAssessment object');
  }

  if (!VALID_COMPLEXITIES.has(nextComplexity)) {
    throw new RangeError(
      `Invalid nextComplexity '${nextComplexity}'. Must be one of: ${Array.from(VALID_COMPLEXITIES).join(', ')}`
    );
  }

  const weights = currentAssessment.resolvedComplexityWeights;
  const cost = weights[nextComplexity];

  const projectedConsumed = currentAssessment.consumedPoints + cost;
  const budget = currentAssessment.dailyBudgetPoints;

  const rawProjectedPct = ((budget - projectedConsumed) / budget) * 100;
  const projectedRemainingPercentage = Math.max(0, Math.min(100, Math.round(rawProjectedPct)));

  const { zone, canTakeHighStakesTask } = determineFatigueZone(rawProjectedPct);

  const isOverBudget = projectedConsumed > budget;
  const isHighStakesBlocked =
    (nextComplexity === 'complex' || nextComplexity === 'high_stakes_tradeoff') &&
    !canTakeHighStakesTask;

  let canProceed = true;
  let warning: string | undefined;

  if (isOverBudget) {
    canProceed = false;
    warning = `Exceeds daily decision budget (${projectedConsumed}/${budget} points). Willpower reserves depleted.`;
  } else if (isHighStakesBlocked) {
    canProceed = false;
    warning = `Projected fatigue zone '${zone}' restricts '${nextComplexity}' decisions. Defer to next circadian cycle.`;
  } else if (zone === 'elevated_fatigue' || zone === 'vulnerability_danger_zone') {
    warning = `Proceed with caution. Operating under ${zone.replace(/_/g, ' ')}.`;
  }

  return {
    canProceed,
    projectedConsumedPoints: projectedConsumed,
    projectedRemainingPercentage,
    projectedZone: zone,
    warning,
  };
}

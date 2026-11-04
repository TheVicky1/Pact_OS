// src/lib/discipline/decision-fatigue.ts

/**
 * Decision Fatigue Index & Daily Choice Budget Allocator
 *
 * Based on psychological research by Dr. Kathleen Vohs and Dr. Roy Baumeister
 * regarding ego depletion and decision fatigue.
 */

export interface DecisionOption {
  id: string;
  label: string;
  complexity: number; // 1-10 scale
  frequency: number; // how often this decision is made per day
  importance: number; // 1-10 scale
}

export interface ChoiceBudget {
  totalCapacity: number;
  allocated: number;
  remaining: number;
  utilization: number; // 0-1
}

export interface DecisionFatigueResult {
  index: number; // 0-100
  level: 'low' | 'moderate' | 'high' | 'critical';
  budget: ChoiceBudget;
  recommendations: string[];
}

/**
 * Calculate the Decision Fatigue Index (DFI)
 * 
 * The DFI is a composite score from 0-100 representing the cognitive load
 * imposed by daily decision-making.
 * 
 * Formula:
 * DFI = Σ(complexity_i * frequency_i * importance_i) / maxPossible * 100
 * 
 * @param options - Array of decision options to evaluate
 * @returns DecisionFatigueResult with index, level, budget, and recommendations
 */
export function calculateDecisionFatigueIndex(options: DecisionOption[]): DecisionFatigueResult {
  if (!options || options.length === 0) {
    return {
      index: 0,
      level: 'low',
      budget: {
        totalCapacity: 100,
        allocated: 0,
        remaining: 100,
        utilization: 0
      },
      recommendations: ['No decisions tracked. Add decision options to calculate fatigue.']
    };
  }

  // Calculate total cognitive load
  const totalLoad = options.reduce((sum, opt) => {
    return sum + (opt.complexity * opt.frequency * opt.importance);
  }, 0);

  // Calculate maximum possible load (all options at max complexity, frequency, importance)
  const maxLoad = options.reduce((sum, opt) => {
    return sum + (10 * opt.frequency * 10);
  }, 0);

  // Normalize to 0-100 scale
  const rawIndex = maxLoad > 0 ? (totalLoad / maxLoad) * 100 : 0;
  const index = Math.min(100, Math.max(0, Math.round(rawIndex)));

  //

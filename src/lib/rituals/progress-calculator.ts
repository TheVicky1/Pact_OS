/**
 * Daily Ritual Step Progress & Completion Calculator.
 * Pure state calculation utility for daily morning and evening planning checklists.
 */

export interface RitualStep {
  id: string;
  completed: boolean;
}

export interface RitualProgressSummary {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  isComplete: boolean;
  nextStepIndex: number;
}

/**
 * Calculates completion metrics and progress for a list of daily ritual steps.
 *
 * @param steps - Array of ritual steps with completion states
 * @returns RitualProgressSummary containing counts, percentage, completion flag, and next incomplete step index
 */
export function calculateRitualProgress(steps: RitualStep[]): RitualProgressSummary {
  if (!Array.isArray(steps) || steps.length === 0) {
    return {
      totalSteps: 0,
      completedSteps: 0,
      percentage: 0,
      isComplete: false,
      nextStepIndex: -1,
    };
  }

  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => Boolean(step && step.completed)).length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = totalSteps > 0 && completedSteps === totalSteps;
  const nextStepIndex = steps.findIndex((step) => !step || !step.completed);

  return {
    totalSteps,
    completedSteps,
    percentage,
    isComplete,
    nextStepIndex,
  };
}

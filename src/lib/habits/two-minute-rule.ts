/**
 * Two-Minute Rule Task Ignition & Micro-Step Extractor
 *
 * Applies the Two-Minute Rule (David Allen's "Getting Things Done" and James Clear's
 * "Atomic Habits"): do a task right away if it takes two minutes or less, otherwise
 * begin with a smaller ignition step when one is available.
 *
 * @module src/lib/habits/two-minute-rule
 */

const TWO_MINUTE_THRESHOLD_SECONDS = 120;

export interface HabitTaskInput {
  id: string;
  title: string;
  estimatedSeconds: number;
  ignitionSubstepTitle?: string;
}

export type ExecutionStrategy = 'execute_immediately' | 'scale_to_ignition' | 'standard_schedule';

export interface TwoMinuteEvaluation {
  taskId: string;
  /** The sanitized estimate: negative or NaN input is reported as 0 */
  estimatedSeconds: number;
  strategy: ExecutionStrategy;
  /** True when the task can be started within two minutes, directly or by its ignition step */
  isTwoMinuteEligible: boolean;
  recommendedAction: string;
}

/**
 * Evaluates which execution strategy the Two-Minute Rule recommends for a task.
 *
 * An ignition step containing only whitespace counts as absent.
 *
 * @param task The task to evaluate
 * @returns The chosen strategy and a recommended next action
 */
export function evaluateTwoMinuteRule(task: HabitTaskInput): TwoMinuteEvaluation {
  const estimatedSeconds = task.estimatedSeconds > 0 ? task.estimatedSeconds : 0;
  const ignitionStep = task.ignitionSubstepTitle?.trim();

  if (estimatedSeconds <= TWO_MINUTE_THRESHOLD_SECONDS) {
    return {
      taskId: task.id,
      estimatedSeconds,
      strategy: 'execute_immediately',
      isTwoMinuteEligible: true,
      recommendedAction: `Do "${task.title}" now.`,
    };
  }

  if (ignitionStep) {
    return {
      taskId: task.id,
      estimatedSeconds,
      strategy: 'scale_to_ignition',
      isTwoMinuteEligible: true,
      recommendedAction: `Start "${task.title}" with this step: "${ignitionStep}".`,
    };
  }

  return {
    taskId: task.id,
    estimatedSeconds,
    strategy: 'standard_schedule',
    isTwoMinuteEligible: false,
    recommendedAction: `Schedule "${task.title}" for a dedicated time.`,
  };
}

/**
 * Returns the tasks that can be acted on right now: those to execute immediately
 * and those with an ignition step. The input array is not mutated.
 *
 * @param tasks The tasks to filter. Non-array input returns an empty array.
 * @returns The eligible tasks, in their original order
 */
export function filterImmediateActionableTasks(tasks: HabitTaskInput[]): HabitTaskInput[] {
  if (!Array.isArray(tasks)) {
    return [];
  }
  return tasks.filter((task) => evaluateTwoMinuteRule(task).isTwoMinuteEligible);
}

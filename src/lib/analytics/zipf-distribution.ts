/**
 * Pure TypeScript Zipf's Law Priority Power-Law Distribution Validator.
 * Target: src/lib/analytics/zipf-distribution.ts
 *
 * Evaluates whether a user's allocation of deep focus time across tasks follows
 * an ideal Zipfian power-law hierarchy:
 *   P_k = (1 / k^s) / sum_{j=1}^N (1 / j^s)
 *
 * Compares actual normalized focus distribution against ideal power-law curve
 * using Root Mean Square Error (RMSE) to diagnose focus leverage vs priority diffusion.
 *
 * Zero external dependencies.
 */

export interface TaskFocusAllocation {
  taskId: string;
  taskTitle: string;
  focusMinutes: number;
}

export interface ZipfFitEvaluation {
  isPowerLawDistributed: boolean;
  idealShares: number[];         // Normalized ideal Zipf shares [0.50, 0.25, 0.125, ...]
  actualShares: number[];        // Actual normalized shares [0.35, 0.30, 0.20, ...]
  rootMeanSquareError: number;   // RMSE between ideal and actual
  topPriorityFocusRatio: number; // Share of total time given to #1 task
  diagnosis: 'strong_focus' | 'moderate_hierarchy' | 'diffuse_attention_warning';
  actionableInsight: string;
}

/**
 * Evaluates whether focus time allocation follows an ideal Zipf power-law distribution.
 *
 * @param tasks - Array of TaskFocusAllocation records with taskId, taskTitle, focusMinutes
 * @param powerLawExponent - Exponent s in P_k proportional to 1 / k^s (default: 1.0)
 * @returns ZipfFitEvaluation with shares, RMSE, ratio, diagnosis, and actionable insight
 */
export function evaluateZipfPriorityDistribution(
  tasks: TaskFocusAllocation[],
  powerLawExponent: number = 1.0
): ZipfFitEvaluation {
  if (
    typeof powerLawExponent !== 'number' ||
    !Number.isFinite(powerLawExponent) ||
    powerLawExponent <= 0
  ) {
    powerLawExponent = 1.0;
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      isPowerLawDistributed: false,
      idealShares: [],
      actualShares: [],
      rootMeanSquareError: 0,
      topPriorityFocusRatio: 0,
      diagnosis: 'diffuse_attention_warning',
      actionableInsight: 'No tasks provided. Log focus sessions to evaluate priority distribution.',
    };
  }

  // Filter and validate task elements, ensuring non-negative finite minutes
  const validTasks = tasks
    .filter((t) => t && typeof t === 'object')
    .map((t) => ({
      taskId: String(t.taskId ?? ''),
      taskTitle: String(t.taskTitle ?? 'Untitled Task'),
      focusMinutes:
        typeof t.focusMinutes === 'number' && Number.isFinite(t.focusMinutes)
          ? Math.max(0, t.focusMinutes)
          : 0,
    }));

  const N = validTasks.length;
  if (N === 0) {
    return {
      isPowerLawDistributed: false,
      idealShares: [],
      actualShares: [],
      rootMeanSquareError: 0,
      topPriorityFocusRatio: 0,
      diagnosis: 'diffuse_attention_warning',
      actionableInsight: 'No valid tasks found. Ensure focus minutes are numeric.',
    };
  }

  // Sort tasks descending by focusMinutes
  validTasks.sort((a, b) => b.focusMinutes - a.focusMinutes);

  const totalMinutes = validTasks.reduce((sum, t) => sum + t.focusMinutes, 0);

  // 1. Calculate ideal Zipf probabilities: P_k = (1 / k^s) / sum_{j=1}^N (1 / j^s)
  let harmonicSum = 0;
  for (let k = 1; k <= N; k++) {
    harmonicSum += 1 / Math.pow(k, powerLawExponent);
  }

  const idealShares: number[] = new Array(N);
  for (let k = 1; k <= N; k++) {
    const rawIdeal = (1 / Math.pow(k, powerLawExponent)) / harmonicSum;
    idealShares[k - 1] = Number(rawIdeal.toFixed(4));
  }

  // 2. Calculate actual normalized shares: p_k = focusMinutes_k / totalMinutes
  const actualShares: number[] = new Array(N);
  if (totalMinutes > 0) {
    for (let i = 0; i < N; i++) {
      actualShares[i] = Number((validTasks[i].focusMinutes / totalMinutes).toFixed(4));
    }
  } else {
    // All tasks have 0 minutes: distribution is entirely flat / zero
    actualShares.fill(0);
  }

  // 3. Compute Root Mean Square Error (RMSE): sqrt( (1 / N) * sum( (p_k - P_k)^2 ) )
  let sumSquaredDiff = 0;
  for (let i = 0; i < N; i++) {
    const diff = actualShares[i] - idealShares[i];
    sumSquaredDiff += diff * diff;
  }
  const rootMeanSquareError = Number(Math.sqrt(sumSquaredDiff / N).toFixed(4));

  const topPriorityFocusRatio = actualShares[0] ?? 0;

  // 4. Determine Diagnosis:
  // - RMSE <= 0.08: strong_focus
  // - 0.08 < RMSE <= 0.18: moderate_hierarchy
  // - RMSE > 0.18: diffuse_attention_warning
  let diagnosis: 'strong_focus' | 'moderate_hierarchy' | 'diffuse_attention_warning';
  let actionableInsight: string;
  let isPowerLawDistributed = false;

  if (totalMinutes === 0) {
    diagnosis = 'diffuse_attention_warning';
    actionableInsight =
      'Zero total focus time recorded. No work has been committed to any task.';
  } else if (N === 1) {
    diagnosis = 'strong_focus';
    isPowerLawDistributed = true;
    actionableInsight =
      'Single task captures 100% of deep focus time. Perfect single-threaded execution.';
  } else if (rootMeanSquareError <= 0.08) {
    diagnosis = 'strong_focus';
    isPowerLawDistributed = true;
    actionableInsight = `Excellent leverage: Priority #1 (${validTasks[0].taskTitle}) receives ${(topPriorityFocusRatio * 100).toFixed(1)}% of total focus time, closely tracking ideal power-law execution.`;
  } else if (rootMeanSquareError <= 0.18) {
    diagnosis = 'moderate_hierarchy';
    isPowerLawDistributed = true;
    actionableInsight = `Acceptable hierarchy: Focus time slopes downward across priorities, but moderate leakage exists in secondary tasks. Consolidate long-tail efforts.`;
  } else {
    diagnosis = 'diffuse_attention_warning';
    isPowerLawDistributed = false;
    const topIdealShare = idealShares[0] ?? 0;
    if (topPriorityFocusRatio > topIdealShare) {
      actionableInsight = `Focus is more concentrated than a power-law curve: Priority #1 (${validTasks[0].taskTitle}) receives ${(topPriorityFocusRatio * 100).toFixed(1)}% vs ideal ${(topIdealShare * 100).toFixed(1)}%. Consider balancing efforts into high-impact secondary priorities.`;
    } else {
      actionableInsight = `High priority diffusion detected (RMSE = ${rootMeanSquareError}): Focus is spread too evenly across ${N} tasks without clear power-law leverage. Protect deep work blocks for Priority #1.`;
    }
  }

  return {
    isPowerLawDistributed,
    idealShares,
    actualShares,
    rootMeanSquareError,
    topPriorityFocusRatio,
    diagnosis,
    actionableInsight,
  };
}

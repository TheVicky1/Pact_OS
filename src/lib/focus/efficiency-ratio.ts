
export interface FocusEfficiencyResult {
  efficiencyPercent: number;
  scoreBand: 'optimal' | 'adequate' | 'under-target' | 'abandoned';
  pausePenalty: number;
}

export function calculateFocusEfficiency(params: {
  plannedMinutes: number;
  actualSeconds: number;
  pauseCount?: number;
}): FocusEfficiencyResult {
  const {
    plannedMinutes,
    actualSeconds,
    pauseCount = 0,
  } = params;

  if (plannedMinutes <= 0 || actualSeconds <= 0) {
    return {
      efficiencyPercent: 0,
      scoreBand: 'abandoned',
      pausePenalty: 0,
    };
  }

  const targetSeconds = plannedMinutes * 60;
  const rawRatio = Math.min(1, actualSeconds / targetSeconds);
  const pausePenalty = Math.max(0, pauseCount - 1) * 2;

  const efficiencyPercent = Math.max(
    0,
    Math.min(100, Math.round(rawRatio * 100 - pausePenalty)),
  );

  let scoreBand: FocusEfficiencyResult['scoreBand'] = 'abandoned';

  if (efficiencyPercent >= 90) {
    scoreBand = 'optimal';
  } else if (efficiencyPercent >= 70) {
    scoreBand = 'adequate';
  } else if (efficiencyPercent >= 30) {
    scoreBand = 'under-target';
  }

  return {
    efficiencyPercent,
    scoreBand,
    pausePenalty,
  };
}

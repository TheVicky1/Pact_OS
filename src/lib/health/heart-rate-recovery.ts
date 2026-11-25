export interface HeartRateRecoveryInput {
  peakHeartRateBpm: number;
  heartRateAt60SecondsBpm: number;
  heartRateAt120SecondsBpm?: number;
}

export type RecoveryTier = "compromised" | "fair" | "good" | "exceptional";

export interface HeartRateRecoveryAssessment {
  dropAt60sBpm: number;
  dropAt120sBpm: number | null;
  vagalReactivationScore: number; // 0 to 100
  recoveryTier: RecoveryTier;
  trainingReadinessRecommendation: string;
}

function validateHeartRateRecoveryInput(input: HeartRateRecoveryInput): void {
  const has120s = input.heartRateAt120SecondsBpm !== undefined;

  if (!Number.isFinite(input.peakHeartRateBpm) || !Number.isFinite(input.heartRateAt60SecondsBpm) || (has120s && !Number.isFinite(input.heartRateAt120SecondsBpm as number))) {
    throw new TypeError("Heart rate inputs must be finite numbers.");
  }

  if (input.peakHeartRateBpm < 60 || input.peakHeartRateBpm > 240) {
    throw new RangeError("peakHeartRateBpm must be between 60 and 240 bpm.");
  }

  if (input.heartRateAt60SecondsBpm < 60 || input.heartRateAt60SecondsBpm > 240) {
    throw new RangeError("heartRateAt60SecondsBpm must be between 60 and 240 bpm.");
  }

  if (input.heartRateAt60SecondsBpm > input.peakHeartRateBpm) {
    throw new RangeError("heartRateAt60SecondsBpm cannot exceed peakHeartRateBpm.");
  }

  if (has120s) {
    const hr120 = input.heartRateAt120SecondsBpm as number;
    if (hr120 < 60 || hr120 > 240) {
      throw new RangeError("heartRateAt120SecondsBpm must be between 60 and 240 bpm.");
    }
    if (hr120 > input.peakHeartRateBpm) {
      throw new RangeError("heartRateAt120SecondsBpm cannot exceed peakHeartRateBpm.");
    }
  }
}

function classifyTier(dropAt60sBpm: number): RecoveryTier {
  if (dropAt60sBpm < 12) {
    return "compromised";
  }
  if (dropAt60sBpm <= 20) {
    return "fair";
  }
  if (dropAt60sBpm <= 35) {
    return "good";
  }
  return "exceptional";
}

function getTrainingReadinessRecommendation(tier: RecoveryTier, dropAt120sBpm: number | null): string {
  const secondaryRecoveryNote = dropAt120sBpm !== null ? ` (120s drop: ${dropAt120sBpm} bpm)` : "";

  switch (tier) {
    case "compromised":
      return `Elevated risk of autonomic fatigue${secondaryRecoveryNote}; stick to light walking, mobility, or full rest.`;
    case "fair":
      return `Standard recovery observed${secondaryRecoveryNote}; moderate-intensity training is permitted.`;
    case "good":
      return `Healthy vagal reactivation${secondaryRecoveryNote}; cleared for standard training load.`;
    case "exceptional":
      return `Superior autonomic recovery${secondaryRecoveryNote}; primed for high-intensity or peak performance.`;
  }
}

export function calculateHeartRateRecovery(input: HeartRateRecoveryInput): HeartRateRecoveryAssessment {
  validateHeartRateRecoveryInput(input);

  const dropAt60sBpm = input.peakHeartRateBpm - input.heartRateAt60SecondsBpm;
  const dropAt120sBpm = input.heartRateAt120SecondsBpm !== undefined ? input.peakHeartRateBpm - input.heartRateAt120SecondsBpm : null;
  const vagalReactivationScore = Math.min(100, Math.max(0, Math.round((dropAt60sBpm / 40) * 100)));
  const recoveryTier = classifyTier(dropAt60sBpm);
  const trainingReadinessRecommendation = getTrainingReadinessRecommendation(recoveryTier, dropAt120sBpm);

  return {
    dropAt60sBpm,
    dropAt120sBpm,
    vagalReactivationScore,
    recoveryTier,
    trainingReadinessRecommendation,
  };
}

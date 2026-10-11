/**
 * Streak Freeze Balance & Eligibility Evaluator.
 * Pure calculation function determining if an uncompleted habit day can be protected by streak freeze allowance.
 */

export interface StreakFreezeEligibility {
  canApplyFreeze: boolean;
  reason?: 'OUT_OF_FREEZES' | 'EXPIRED_GRACE_PERIOD' | 'ALREADY_FROZEN' | 'FUTURE_DATE';
  remainingFreezesAfterApply: number;
}

export function evaluateStreakFreezeEligibility(params: {
  availableFreezes: number;
  missedDateIso: string;
  existingFrozenDates: string[];
  gracePeriodHours?: number;
  currentDate?: Date;
}): StreakFreezeEligibility {
  const {
    availableFreezes,
    missedDateIso,
    existingFrozenDates,
    gracePeriodHours = 48,
    currentDate = new Date(),
  } = params;

  const missedTime = new Date(missedDateIso).getTime();
  const nowTime = currentDate.getTime();

  if (missedTime > nowTime) {
    return {
      canApplyFreeze: false,
      reason: 'FUTURE_DATE',
      remainingFreezesAfterApply: availableFreezes,
    };
  }

  if (existingFrozenDates.includes(missedDateIso.slice(0, 10))) {
    return {
      canApplyFreeze: false,
      reason: 'ALREADY_FROZEN',
      remainingFreezesAfterApply: availableFreezes,
    };
  }

  if (availableFreezes <= 0) {
    return {
      canApplyFreeze: false,
      reason: 'OUT_OF_FREEZES',
      remainingFreezesAfterApply: 0,
    };
  }

  const hoursElapsed = (nowTime - missedTime) / (1000 * 60 * 60);
  if (hoursElapsed > gracePeriodHours) {
    return {
      canApplyFreeze: false,
      reason: 'EXPIRED_GRACE_PERIOD',
      remainingFreezesAfterApply: availableFreezes,
    };
  }

  return {
    canApplyFreeze: true,
    remainingFreezesAfterApply: availableFreezes - 1,
  };
}

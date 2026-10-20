export type IgnitionState = 'COUNTING_DOWN' | 'ACTION_WINDOW' | 'EXPIRED';

export interface IgnitionStatus {
  state: IgnitionState;
  secondsRemaining: number;
  progressRatio: number; // 0.0 to 1.0
}

export function evaluateIgnitionCountdown(
  elapsedMs: number,
  countdownDurationMs: number = 5000,
  actionWindowMs: number = 3000
): IgnitionStatus {
  const validElapsed = Math.max(0, elapsedMs);

  if (validElapsed < countdownDurationMs) {
    const remainingMs = countdownDurationMs - validElapsed;
    return {
      state: 'COUNTING_DOWN',
      secondsRemaining: Math.ceil(remainingMs / 1000),
      progressRatio: parseFloat((validElapsed / countdownDurationMs).toFixed(3)),
    };
  }

  if (validElapsed <= countdownDurationMs + actionWindowMs) {
    return {
      state: 'ACTION_WINDOW',
      secondsRemaining: 0,
      progressRatio: 1.0,
    };
  }

  return {
    state: 'EXPIRED',
    secondsRemaining: 0,
    progressRatio: 1.0,
  };
}
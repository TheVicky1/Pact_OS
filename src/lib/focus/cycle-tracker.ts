/**
 * Pomodoro Interval Cycle & Long Break Milestone Tracker.
 * Pure state calculation utility for cadence and rest interval planning.
 */

export interface PomodoroCycleState {
  completedWorkSessions: number;
  cycleLength: number;
  nextSessionType: 'work' | 'short-break' | 'long-break';
  isLongBreakNext: boolean;
  sessionsUntilLongBreak: number;
}

export function getNextPomodoroStage(
  completedWorkSessions: number,
  cycleLength: number = 4
): PomodoroCycleState {
  const validLength = Math.max(1, cycleLength);
  const validSessions = Math.max(0, completedWorkSessions);
  const remainder = validSessions % validLength;

  const isLongBreakNext = validSessions > 0 && remainder === 0;
  const sessionsUntilLongBreak = isLongBreakNext ? 0 : validLength - remainder;

  return {
    completedWorkSessions: validSessions,
    cycleLength: validLength,
    nextSessionType: isLongBreakNext ? 'long-break' : 'short-break',
    isLongBreakNext,
    sessionsUntilLongBreak,
  };
}

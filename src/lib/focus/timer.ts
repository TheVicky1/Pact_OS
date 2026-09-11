/**
 * PACT Phase 6B: Pure Deterministic Focus Timer Engine
 * Authoritative timestamp arithmetic, elapsed/remaining calculations,
 * background tab drift resilience, and expiration reconciliation.
 */

export type FocusMode = 'countdown' | 'stopwatch';
export type FocusStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type FocusCompletionReason =
  | 'timer_expired'
  | 'natural_expiration'
  | 'manual_complete'
  | 'manual_completed'
  | 'manual_stopwatch'
  | 'user_abandoned'
  | 'auto_reconciled';

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  mode: FocusMode;
  planned_duration_seconds: number | null;
  actual_duration_seconds?: number | null;
  started_at: string; // ISO 8601 UTC
  ended_at: string | null; // ISO 8601 UTC
  paused_at: string | null; // ISO 8601 UTC
  accumulated_paused_seconds: number;
  status: FocusStatus;
  completion_reason: FocusCompletionReason | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  } | null;
}

export interface FocusSessionProgress {
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercentage: number;
  percent: number;
  isExpired: boolean;
  displayTime: string;
  status: FocusStatus;
}

export interface TimerSessionSnapshot {
  mode: FocusMode;
  status: FocusStatus;
  planned_duration_seconds?: number | null;
  plannedDurationSeconds?: number | null;
  started_at: string;
  ended_at?: string | null;
  paused_at?: string | null;
  accumulated_paused_seconds?: number;
}

/**
 * Formats a duration in seconds to standard MM:SS or H:MM:SS / HH:MM:SS.
 */
export function formatTimerDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const formatDuration = formatTimerDisplay;

/**
 * Pure calculation of focus session elapsed time and remaining countdown.
 * GUARANTEE: Never relies on tick increments. Computes directly from authoritative timestamps.
 */
export function calculateSessionProgress(
  session: TimerSessionSnapshot,
  currentEpoch: number | Date = Date.now()
): FocusSessionProgress {
  const currentEpochMs = typeof currentEpoch === 'number' ? currentEpoch : currentEpoch.getTime();
  const startedEpoch = Date.parse(session.started_at);
  const accumulatedPausedMs = (session.accumulated_paused_seconds || 0) * 1000;

  let effectiveEndEpoch: number;

  if (session.status === 'completed' || session.status === 'abandoned') {
    effectiveEndEpoch = session.ended_at ? Date.parse(session.ended_at) : currentEpochMs;
  } else if (session.status === 'paused' && session.paused_at) {
    effectiveEndEpoch = Date.parse(session.paused_at);
  } else {
    effectiveEndEpoch = currentEpochMs;
  }

  // Elapsed gross duration in ms minus paused duration
  const grossElapsedMs = Math.max(0, effectiveEndEpoch - startedEpoch);
  const netElapsedMs = Math.max(0, grossElapsedMs - accumulatedPausedMs);
  const elapsedSeconds = Math.floor(netElapsedMs / 1000);

  if (session.mode === 'stopwatch') {
    return {
      elapsedSeconds,
      remainingSeconds: 0,
      progressPercentage: 0,
      percent: 100,
      isExpired: false,
      displayTime: formatTimerDisplay(elapsedSeconds),
      status: session.status,
    };
  }

  // Countdown mode
  const planned = session.planned_duration_seconds ?? session.plannedDurationSeconds ?? 1500;
  const isExpired = elapsedSeconds >= planned;
  const remainingSeconds = Math.max(0, planned - elapsedSeconds);
  const percent = planned > 0 ? Math.min(100, Math.floor((Math.min(elapsedSeconds, planned) / planned) * 100)) : 0;
  const cappedElapsedSeconds = isExpired ? planned : elapsedSeconds;

  return {
    elapsedSeconds: cappedElapsedSeconds,
    remainingSeconds,
    progressPercentage: percent,
    percent,
    isExpired,
    displayTime: formatTimerDisplay(remainingSeconds),
    status: session.status,
  };
}

export const computeTimerState = calculateSessionProgress;

/**
 * Reconciles whether an active countdown session has naturally expired.
 */
export function checkCountdownExpiration(
  session: TimerSessionSnapshot,
  currentEpoch: number | Date = Date.now()
): boolean {
  if (session.status !== 'active' || session.mode !== 'countdown') {
    return false;
  }

  const progress = calculateSessionProgress(session, currentEpoch);
  return progress.isExpired;
}

export const isSessionExpired = checkCountdownExpiration;

/**
 * Computes reconciled status based on current epoch.
 */
export function computeReconciledStatus(
  session: TimerSessionSnapshot,
  currentEpoch: number | Date = Date.now()
): FocusStatus {
  if (session.status === 'completed' || session.status === 'abandoned') {
    return session.status;
  }
  if (isSessionExpired(session, currentEpoch)) {
    return 'completed';
  }
  return session.status;
}

export interface FocusMetricsSummary {
  totalFocusSeconds: number;
  completedSessions: number;
  completedSessionsCount: number;
  abandonedSessions: number;
  avgSessionDurationSeconds: number;
  averageSessionMinutes: number;
  longestSessionMinutes: number;
  todayFocusSeconds: number;
  dailyFocusMap: Record<string, number>;
  taskFocusMap: Record<string, number>;
}

/**
 * Computes deterministic statistics over focus sessions.
 */
export function calculateFocusMetrics(
  sessions: FocusSession[],
  todayUtcDateStr?: string
): FocusMetricsSummary {
  const completed = sessions.filter((s) => s.status === 'completed');
  const abandoned = sessions.filter((s) => s.status === 'abandoned');
  const today = todayUtcDateStr || new Date().toISOString().slice(0, 10);

  let totalFocusSeconds = 0;
  let todayFocusSeconds = 0;
  let maxSessionSeconds = 0;
  const dailyFocusMap: Record<string, number> = {};
  const taskFocusMap: Record<string, number> = {};

  for (const s of completed) {
    let sessionSeconds: number;
    if (typeof s.actual_duration_seconds === 'number' && s.actual_duration_seconds > 0) {
      sessionSeconds = s.actual_duration_seconds;
    } else {
      const startedEpoch = Date.parse(s.started_at);
      const endedEpoch = s.ended_at ? Date.parse(s.ended_at) : startedEpoch;
      const pausedMs = (s.accumulated_paused_seconds || 0) * 1000;
      sessionSeconds = Math.max(0, Math.floor((endedEpoch - startedEpoch - pausedMs) / 1000));
    }

    totalFocusSeconds += sessionSeconds;
    if (sessionSeconds > maxSessionSeconds) {
      maxSessionSeconds = sessionSeconds;
    }

    const dayKey = s.started_at.slice(0, 10);
    dailyFocusMap[dayKey] = (dailyFocusMap[dayKey] || 0) + sessionSeconds;

    if (s.task_id) {
      taskFocusMap[s.task_id] = (taskFocusMap[s.task_id] || 0) + sessionSeconds;
    }

    if (s.started_at.startsWith(today)) {
      todayFocusSeconds += sessionSeconds;
    }
  }

  const completedCount = completed.length;
  const avgSessionDurationSeconds =
    completedCount > 0 ? Math.round(totalFocusSeconds / completedCount) : 0;
  const averageSessionMinutes = Math.round(avgSessionDurationSeconds / 60);

  return {
    totalFocusSeconds,
    completedSessions: completedCount,
    completedSessionsCount: completedCount,
    abandonedSessions: abandoned.length,
    avgSessionDurationSeconds,
    averageSessionMinutes,
    longestSessionMinutes: Math.round(maxSessionSeconds / 60),
    todayFocusSeconds,
    dailyFocusMap,
    taskFocusMap,
  };
}

export const computeFocusMetrics = calculateFocusMetrics;

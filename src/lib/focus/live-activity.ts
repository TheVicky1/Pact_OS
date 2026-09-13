/**
 * PACT Phase 8: Mobile Live Activity & Focus Experience Engine
 * Cross-platform contracts for iOS Dynamic Island / Lock Screen Live Activities,
 * Android Ongoing Notifications, Screen Wake Lock API, and Background Notification Triggers.
 */

import { FocusSession, calculateSessionProgress, formatTimerDisplay } from './timer';

export interface FocusLiveActivityState {
  sessionId: string;
  taskTitle: string;
  mode: 'countdown' | 'stopwatch';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  startTimeEpochMs: number;
  targetEndTimeEpochMs: number | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
  displayTime: string;
  colorTheme: string;
  canPause: boolean;
  canComplete: boolean;
}

export interface FocusLiveActivityPayload {
  version: '1.0';
  activityType: 'deep_work_focus';
  state: FocusLiveActivityState;
  dynamicIsland: {
    compactLeading: string; // e.g. "PACT"
    compactTrailing: string; // e.g. "24:50"
    expandedTitle: string; // e.g. "Focus: Review Architecture"
    expandedSubtitle: string; // e.g. "Deep Work • 85% Remaining"
  };
  lockScreen: {
    title: string;
    body: string;
    progressBarPercent: number;
  };
}

/**
 * Pure function: Transforms a FocusSession into a standardized Live Activity payload.
 */
export function buildFocusLiveActivityPayload(
  session: FocusSession,
  currentEpoch: number | Date = Date.now()
): FocusLiveActivityPayload {
  const currentEpochMs = typeof currentEpoch === 'number' ? currentEpoch : currentEpoch.getTime();
  const progress = calculateSessionProgress(session, currentEpochMs);
  const startEpoch = Date.parse(session.started_at);
  const plannedSeconds = session.planned_duration_seconds || 1500;
  const targetEndTimeEpochMs =
    session.mode === 'countdown' ? startEpoch + plannedSeconds * 1000 : null;

  const taskTitle = session.tasks?.title || 'Deep Work Session';
  const displayTime = progress.displayTime;

  const state: FocusLiveActivityState = {
    sessionId: session.id,
    taskTitle,
    mode: session.mode,
    status: session.status,
    startTimeEpochMs: startEpoch,
    targetEndTimeEpochMs,
    elapsedSeconds: progress.elapsedSeconds,
    remainingSeconds: progress.remainingSeconds,
    progressPercent: progress.progressPercentage,
    displayTime,
    colorTheme: '#d4af37',
    canPause: session.status === 'active',
    canComplete: session.status === 'active' || session.status === 'paused',
  };

  const isCountdown = session.mode === 'countdown';
  const subtitle = isCountdown
    ? `Deep Work • ${formatTimerDisplay(progress.remainingSeconds)} remaining`
    : `Stopwatch • ${formatTimerDisplay(progress.elapsedSeconds)} elapsed`;

  return {
    version: '1.0',
    activityType: 'deep_work_focus',
    state,
    dynamicIsland: {
      compactLeading: 'PACT',
      compactTrailing: displayTime,
      expandedTitle: taskTitle,
      expandedSubtitle: subtitle,
    },
    lockScreen: {
      title: taskTitle,
      body: subtitle,
      progressBarPercent: isCountdown ? progress.progressPercentage : 100,
    },
  };
}

export interface ScreenWakeLockSentinel {
  release: () => Promise<void>;
  released?: boolean;
}

/**
 * Screen Wake Lock API Client Helper:
 * Prevents screen auto-dimming during active deep work focus sessions on supported mobile browsers.
 */
export async function requestScreenWakeLock(): Promise<ScreenWakeLockSentinel | null> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return null;
  }
  try {
    const nav = navigator as unknown as {
      wakeLock?: {
        request: (type: 'screen') => Promise<ScreenWakeLockSentinel>;
      };
    };
    if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
      const sentinel = await nav.wakeLock.request('screen');
      return sentinel;
    }
    return null;
  } catch (err) {
    console.warn('[PACT WakeLock] Screen wake lock unavailable or denied:', err);
    return null;
  }
}

/**
 * Releases active screen wake lock sentinel.
 */
export async function releaseScreenWakeLock(sentinel: ScreenWakeLockSentinel | null): Promise<void> {
  if (!sentinel) return;
  try {
    if (typeof sentinel.release === 'function') {
      await sentinel.release();
    }
  } catch (err) {
    console.warn('[PACT WakeLock] Error releasing screen wake lock:', err);
  }
}

/**
 * Web Notifications Helper:
 * Triggers background timer completion notifications when user is in another tab/app.
 */
export async function requestTimerNotificationPermission(): Promise<string> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function sendTimerCompletionNotification(taskTitle?: string): void {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return;
  }

  const title = 'Focus Interval Completed';
  const body = taskTitle
    ? `Congratulations! You finished your scheduled interval on "${taskTitle}".`
    : 'Congratulations! You finished your scheduled focus session.';

  try {
    new Notification(title, {
      body,
      icon: '/brand/pact-app-icon-192.png',
      badge: '/brand/pact-logo-64.png',
      tag: 'pact-timer-completion',
    });
  } catch (err) {
    console.warn('[PACT Notification] Failed to show timer notification:', err);
  }
}
